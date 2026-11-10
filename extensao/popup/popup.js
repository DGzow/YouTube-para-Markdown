// Comportamento do popup (a janelinha que abre ao clicar no ícone da extensão).
//
// Fluxo: descobre a aba aberta → se for vídeo do YouTube, mostra título e canal →
// no clique, injeta `lerTranscricao` na página, monta o Markdown e baixa ou copia.
//
// `type="module"` no <script> do HTML permite usar `import`, como o `import` do
// Python: cada peça mora no seu arquivo e o popup só junta.

import { lerTranscricao } from "../pagina/ler-transcricao.js";
import { formatarTempo, montarMarkdown, nomeDoArquivo } from "../lib/markdown.js";

const PASTA_DOWNLOADS = "YouTube para Markdown"; // subpasta dentro de Downloads

const $ = (id) => document.getElementById(id);
const el = {
  fora: $("fora"),
  principal: $("principal"),
  titulo: $("titulo"),
  meta: $("meta"),
  comTempos: $("comTempos"),
  perguntarOnde: $("perguntarOnde"),
  baixar: $("baixar"),
  copiar: $("copiar"),
  status: $("status"),
};

// O que já foi lido da página fica aqui. Assim "Copiar" depois de "Baixar" (ou
// trocar a chave de tempos) não abre o painel do YouTube de novo.
let leitura = null;
let abaId = null;

const MENSAGENS = {
  "sem-video": "Não achei o player nesta aba. Recarregue a página do vídeo e tente de novo.",
  "sem-transcricao":
    "Este vídeo não tem transcrição no YouTube. Para transcrever o áudio, use o app no computador (opção Whisper).",
  "nao-carregou":
    "O YouTube não carregou a transcrição. Abra o painel “Transcrição” na própria página: se ele também ficar vazio, tente mais tarde ou use o app no computador.",
};

function mostrarStatus(texto, tipo = "") {
  const icone = { ok: "i-ok", erro: "i-aviso", carregando: "i-carregando" }[tipo];
  el.status.className = "status" + (tipo === "ok" || tipo === "erro" ? " " + tipo : "");
  el.status.textContent = "";
  if (icone) {
    // Ícone por createElementNS, porque SVG não é HTML comum.
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ic" + (tipo === "carregando" ? " girando" : ""));
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + icone);
    svg.append(use);
    el.status.append(svg);
  }
  // textContent, nunca innerHTML: o título do vídeo pode trazer "<" e afins.
  el.status.append(document.createTextNode(texto));
}

function ocupado(sim) {
  el.baixar.disabled = sim;
  el.copiar.disabled = sim;
}

// Qual aba ler. `?aba=123` é um gancho para o teste automatizado, que abre o
// popup como página comum (e aí a "aba ativa" seria o próprio popup).
async function descobrirAba() {
  const forcada = Number(new URLSearchParams(location.search).get("aba"));
  if (forcada) return chrome.tabs.get(forcada);
  const [aba] = await chrome.tabs.query({ active: true, currentWindow: true });
  return aba;
}

function ehVideo(url) {
  try {
    const u = new URL(url);
    return u.hostname === "www.youtube.com" && u.pathname === "/watch" && u.searchParams.has("v");
  } catch {
    return false;
  }
}

async function rodarNaPagina(func) {
  const [resultado] = await chrome.scripting.executeScript({ target: { tabId: abaId }, world: "MAIN", func });
  return resultado?.result;
}

// Leitura rápida, só do cabeçalho (sem abrir painel), para mostrar o vídeo no popup.
function dadosBasicos() {
  const p = document.getElementById("movie_player");
  const d = p?.getVideoData?.();
  return d?.video_id ? { id: d.video_id, titulo: d.title, canal: d.author, duracao: p.getDuration?.() || 0 } : null;
}

async function obterLeitura() {
  if (leitura) return leitura;
  mostrarStatus("Lendo a transcrição no YouTube…", "carregando");
  const r = await rodarNaPagina(lerTranscricao);
  if (!r || r.erro) throw new Error(MENSAGENS[r?.erro] || "Não consegui ler a página do vídeo.");
  leitura = r;
  return r;
}

function gerar(r) {
  return montarMarkdown(r.video, r.trechos, {
    comTempos: el.comTempos.checked,
    idioma: r.idioma,
    fonte: "extensao-painel",
  });
}

function contarPalavras(md) {
  return Number(/^words: (\d+)$/m.exec(md)?.[1] || 0).toLocaleString("pt-BR");
}

async function baixar() {
  ocupado(true);
  try {
    const r = await obterLeitura();
    const md = gerar(r);
    const nome = nomeDoArquivo(r.video.titulo, r.video.id);
    // data: URL em vez de Blob: o popup fecha quando a janela "Salvar como" abre,
    // e um Blob morreria junto com ele antes de o download começar.
    await chrome.downloads.download({
      url: "data:text/markdown;charset=utf-8," + encodeURIComponent(md),
      filename: `${PASTA_DOWNLOADS}/${nome}`,
      saveAs: el.perguntarOnde.checked,
      conflictAction: "overwrite",
    });
    mostrarStatus(`Salvo em Downloads/${PASTA_DOWNLOADS} · ${contarPalavras(md)} palavras`, "ok");
  } catch (e) {
    mostrarStatus(e.message, "erro");
  } finally {
    ocupado(false);
  }
}

async function copiar() {
  ocupado(true);
  try {
    const md = gerar(await obterLeitura());
    await navigator.clipboard.writeText(md);
    mostrarStatus(`Copiado · ${contarPalavras(md)} palavras`, "ok");
  } catch (e) {
    mostrarStatus(e.message, "erro");
  } finally {
    ocupado(false);
  }
}

async function iniciar() {
  // Preferências ficam no chrome.storage.sync: valem em todo computador logado.
  const prefs = await chrome.storage.sync.get({ comTempos: true, perguntarOnde: false });
  el.comTempos.checked = prefs.comTempos;
  el.perguntarOnde.checked = prefs.perguntarOnde;
  for (const chave of ["comTempos", "perguntarOnde"]) {
    el[chave].addEventListener("change", () => chrome.storage.sync.set({ [chave]: el[chave].checked }));
  }

  const aba = await descobrirAba();
  if (!aba || !ehVideo(aba.url)) {
    el.fora.hidden = false;
    return;
  }
  abaId = aba.id;
  el.principal.hidden = false;
  el.baixar.addEventListener("click", baixar);
  el.copiar.addEventListener("click", copiar);

  try {
    const v = await rodarNaPagina(dadosBasicos);
    if (!v) throw new Error();
    el.titulo.textContent = v.titulo;
    el.meta.textContent = [v.canal, v.duracao ? formatarTempo(v.duracao) : ""].filter(Boolean).join(" · ");
  } catch {
    el.titulo.textContent = aba.title.replace(/ - YouTube$/, "");
    el.meta.textContent = "";
  }
}

iniciar();
