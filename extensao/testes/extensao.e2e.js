// Teste ponta a ponta: carrega a extensão num Chromium de verdade, abre um vídeo
// do YouTube, aperta "Baixar .md" no popup e confere o arquivo baixado.
//   cd extensao && npm run test:e2e
//
// Precisa de internet (fala com o YouTube de verdade). Usa o Chromium do próprio
// Playwright, porque Chrome e Edge "de marca" não aceitam mais carregar extensão
// pela linha de comando (--load-extension).
//
// Vídeo de teste: dQw4w9WgXcQ, que tem legenda manual em pt-BR e o painel novo
// de transcrição. Se o YouTube mudar a página, é aqui que vai aparecer primeiro.

import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PASTA_EXTENSAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VIDEO = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "ytmd-e2e-"));
const contexto = await chromium.launchPersistentContext(perfil, {
  channel: "chromium",
  headless: true,
  locale: "pt-BR",
  acceptDownloads: true,
  args: [`--disable-extensions-except=${PASTA_EXTENSAO}`, `--load-extension=${PASTA_EXTENSAO}`],
});

const passos = [];
const ok = (texto) => {
  passos.push(texto);
  console.log("  ✓ " + texto);
};

try {
  // ID da extensão: a página chrome://extensions sabe, e é o jeito estável de perguntar.
  const pg = await contexto.newPage();
  await pg.goto("chrome://extensions");
  const idExtensao = await pg.evaluate(async () => {
    const lista = await chrome.developerPrivate.getExtensionsInfo();
    return lista.find((e) => e.name === "YouTube para Markdown")?.id;
  });
  assert.ok(idExtensao, "a extensão não carregou");
  ok(`extensão carregada (${idExtensao})`);
  const popupUrl = (aba) => `chrome-extension://${idExtensao}/popup/popup.html` + (aba ? `?aba=${aba}` : "");

  // 1) Fora do YouTube, o popup pede para abrir um vídeo.
  await pg.goto("https://example.com");
  const popupFora = await contexto.newPage();
  await popupFora.goto(popupUrl());
  // A extensão só enxerga a URL de abas do YouTube (é a única permissão que ela
  // pede), então a aba do example.com aparece para ela sem URL.
  const idFora = await popupFora.evaluate(async () => (await chrome.tabs.query({})).find((t) => !t.url)?.id);
  assert.ok(idFora, "não achei a aba de fora do YouTube");
  await popupFora.goto(popupUrl(idFora));
  await popupFora.locator("#fora").waitFor({ state: "visible" });
  ok("fora de um vídeo, mostra o aviso");

  // 2) No vídeo: título e canal aparecem no popup.
  const video = await contexto.newPage();
  await video.goto(VIDEO, { waitUntil: "domcontentloaded" });
  await video.waitForFunction(() => document.getElementById("movie_player")?.getVideoData?.()?.video_id);
  const idAba = await popupFora.evaluate(async () => (await chrome.tabs.query({ url: "https://www.youtube.com/watch*" }))[0].id);
  const popup = popupFora;
  await popup.goto(popupUrl(idAba));
  await popup.locator("#principal").waitFor({ state: "visible" });
  await popup.waitForFunction(() => document.getElementById("titulo").textContent !== "…");
  const titulo = await popup.locator("#titulo").textContent();
  assert.match(titulo, /Rick Astley/i);
  ok(`popup mostra o vídeo: ${titulo} · ${await popup.locator("#meta").textContent()}`);

  // 3) Baixar .md e conferir o arquivo. O Playwright grava o download com um nome
  // interno (e chama de "download.md" tudo que vem de data: URL), então o nome
  // que a extensão PEDIU é conferido espiando a chamada chrome.downloads.download.
  await popup.evaluate(() => {
    const original = chrome.downloads.download.bind(chrome.downloads);
    chrome.downloads.download = (opcoes) => {
      window.__pedidoDownload = { filename: opcoes.filename, saveAs: opcoes.saveAs };
      return original(opcoes);
    };
  });
  const esperaDownload = contexto.waitForEvent("download", { timeout: 40000 }).catch((e) => e);
  await popup.locator("#baixar").click();
  await popup.locator("#status.ok, #status.erro").waitFor({ timeout: 40000 });
  const status = await popup.locator("#status").textContent();
  assert.ok(await popup.locator("#status.ok").count(), "falhou: " + status);
  ok("status: " + status);

  const pedido = await popup.evaluate(() => window.__pedidoDownload);
  assert.match(pedido.filename, /^YouTube para Markdown\/.+-dQw4w9WgXcQ\.md$/);
  assert.equal(pedido.saveAs, false);
  const download = await esperaDownload;
  if (download instanceof Error) throw download;
  const baixado = { filename: await download.path(), nome: pedido.filename };
  const md = fs.readFileSync(baixado.filename, "utf-8");
  assert.match(md, /^---\ntitle: ".*Rick Astley.*"\n/);
  assert.match(md, /\nvideo_id: dQw4w9WgXcQ\n/);
  assert.match(md, /\nsource: extensao-painel\n/);
  assert.match(md, /\*\*\[00:18\]\(https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ&t=18s\)\*\* /);
  const palavras = Number(/\nwords: (\d+)\n/.exec(md)[1]);
  assert.ok(palavras > 200, `poucas palavras: ${palavras}`);
  ok(`arquivo ${baixado.nome} com ${palavras} palavras, idioma ${/\nlanguage: (.+)\n/.exec(md)[1]}`);

  // 4) O painel que a extensão abriu foi fechado de novo.
  const painelAberto = await video.evaluate(
    () =>
      !!document.querySelector(
        "ytd-engagement-panel-section-list-renderer[target-id='PAmodern_transcript_view'][visibility='ENGAGEMENT_PANEL_VISIBILITY_EXPANDED']",
      ),
  );
  assert.equal(painelAberto, false, "o painel de transcrição ficou aberto na página");
  ok("painel do YouTube fechado de novo");

  // Foto do popup, para conferir o visual (fica em testes/saida/, fora do Git).
  const saida = path.join(PASTA_EXTENSAO, "testes", "saida");
  fs.mkdirSync(saida, { recursive: true });
  await popup.setViewportSize({ width: 320, height: 300 });
  await popup.screenshot({ path: path.join(saida, "popup.png") });
  await popup.emulateMedia({ colorScheme: "dark" });
  await popup.screenshot({ path: path.join(saida, "popup-escuro.png") });
  fs.copyFileSync(baixado.filename, path.join(saida, "exemplo.md"));
  ok("fotos e exemplo salvos em testes/saida/");

  console.log(`\n${passos.length} passos OK`);
} catch (erro) {
  console.error("\n✗ " + erro.message);
  process.exitCode = 1;
} finally {
  await contexto.close();
  fs.rmSync(perfil, { recursive: true, force: true });
}
