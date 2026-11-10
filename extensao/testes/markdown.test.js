// Testes do montador de Markdown (lib/markdown.js). Rodam sem navegador:
//   cd extensao && npm test
// `node:test` é o equivalente do `unittest` do Python, já embutido no Node.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcularDuracoes,
  formatarTempo,
  lerTempo,
  montarMarkdown,
  montarParagrafos,
  nomeDoArquivo,
  slugify,
} from "../lib/markdown.js";

test("slugify igual ao do Python", () => {
  assert.equal(slugify("Chegue em garotas, mas do jeito CERTO!"), "chegue-em-garotas-mas-do-jeito-certo");
  assert.equal(slugify("Ação & reação — 2ª parte"), "acao-reacao-2a-parte");
  assert.equal(slugify("日本語"), "video");
  assert.equal(slugify("a".repeat(100)).length, 70);
});

test("nome do arquivo termina no ID do vídeo", () => {
  assert.equal(nomeDoArquivo("Meu vídeo", "dQw4w9WgXcQ"), "meu-video-dQw4w9WgXcQ.md");
});

test("formatar e ler tempo", () => {
  assert.equal(formatarTempo(75), "01:15");
  assert.equal(formatarTempo(3725), "1:02:05");
  assert.equal(lerTempo("1:02:05"), 3725);
  assert.equal(lerTempo("0:18"), 18);
  assert.equal(lerTempo("abc"), null);
});

test("duração de cada trecho vai até o próximo; o último, até o fim do vídeo", () => {
  const r = calcularDuracoes([{ inicio: 0, texto: "a" }, { inicio: 10, texto: "b" }], 25);
  assert.deepEqual(r.map((t) => t.duracao), [10, 15]);
});

test("parágrafo fecha no fim de frase depois de 45 s", () => {
  const trechos = [
    { inicio: 0, duracao: 20, texto: "Primeira fala" },
    { inicio: 20, duracao: 30, texto: "termina aqui." },
    { inicio: 50, duracao: 5, texto: "Novo parágrafo" },
  ];
  const p = montarParagrafos(trechos);
  assert.equal(p.length, 2);
  assert.deepEqual(p[0], { inicio: 0, texto: "Primeira fala termina aqui." });
  assert.equal(p[1].inicio, 50);
});

test("Markdown com frontmatter, cabeçalho e tempos clicáveis", () => {
  const md = montarMarkdown(
    { id: "dQw4w9WgXcQ", titulo: 'Vídeo "teste"', canal: "Canal X", duracao: 90 },
    [
      { inicio: 18, texto: "Olá mundo." },
      { inicio: 70, texto: "Tchau." },
    ],
    { idioma: "pt-BR", fonte: "extensao-painel", agora: new Date(2026, 10, 10, 9, 5) },
  );
  assert.match(md, /^---\ntitle: "Vídeo \\"teste\\""\nchannel: "Canal X"\n/);
  assert.match(md, /\nlanguage: pt-BR\nduration: 01:30\nwords: 3\nsource: extensao-painel\nextracted_at: 2026-11-10 09:05\n---\n/);
  assert.match(md, /\n> \*\*Canal:\*\* Canal X · \[Assistir no YouTube\]\(https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ\)\n/);
  // 1º trecho vai de 18 s a 70 s (52 s, termina em ponto): fecha o parágrafo.
  assert.match(md, /\n\*\*\[00:18\]\(https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ&t=18s\)\*\* Olá mundo\.\n\n/);
  assert.match(md, /\*\*\[01:10\]\(https:\/\/www\.youtube\.com\/watch\?v=dQw4w9WgXcQ&t=70s\)\*\* Tchau\.\n$/);
});

test("sem tempos vira texto corrido", () => {
  const md = montarMarkdown({ id: "x".repeat(11), titulo: "T", canal: "", duracao: 5 }, [{ inicio: 0, texto: "Oi." }], {
    comTempos: false,
  });
  assert.ok(md.endsWith("## Transcrição\n\nOi.\n"));
  assert.ok(!md.includes("**Canal:**"));
  assert.match(md, /language: desconhecido/);
});
