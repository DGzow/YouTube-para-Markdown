// Monta o arquivo Markdown a partir dos trechos da transcrição.
//
// É a tradução para JavaScript das funções de yt_transcript_md.py (slugify,
// format_ts, build_paragraphs, build_markdown). O objetivo é a extensão gerar um
// .md igual ao do app em Python: mesmo frontmatter, mesmos parágrafos, mesmo nome
// de arquivo. Mudou a regra lá? Mude aqui também (e o teste em testes/).
//
// Este arquivo é "puro": não mexe na página, no navegador nem em arquivo. Recebe
// dados e devolve texto. Por isso dá para testar com `node --test` sem navegador.

export const PADROES = {
  segundosPorParagrafo: 45, // --chunk-seconds do Python
  caracteresPorParagrafo: 700, // --chunk-chars do Python
};

export function urlDoVideo(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// "Título Ótimo!" → "titulo-otimo". Igual ao slugify do Python: tira acento,
// joga fora o que não for letra/número/espaço/hífen e corta em 70 caracteres.
export function slugify(texto, maximo = 70) {
  let t = String(texto).normalize("NFKD").replace(/[^\x00-\x7F]/g, "");
  t = t.replace(/[^\w\s-]/g, "").trim().toLowerCase();
  t = t.replace(/[\s_-]+/g, "-");
  t = t.slice(0, maximo).replace(/^-+|-+$/g, "");
  return t || "video";
}

// 75 → "01:15"; 3725 → "1:02:05".
export function formatarTempo(segundos) {
  const s = Math.floor(segundos);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const dois = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${dois(m)}:${dois(r)}` : `${dois(m)}:${dois(r)}`;
}

// "1:02:05" → 3725. É o caminho inverso: o painel do YouTube mostra o tempo como
// texto, e o Markdown precisa dele em segundos para montar o link.
export function lerTempo(texto) {
  const partes = String(texto).trim().split(":").map(Number);
  if (!partes.length || partes.some(Number.isNaN)) return null;
  return partes.reduce((total, parte) => total * 60 + parte, 0);
}

export function nomeDoArquivo(titulo, videoId) {
  return `${slugify(titulo)}-${videoId}.md`;
}

function limpar(texto) {
  return String(texto).replace(/\s+/g, " ").trim();
}

// Junta falas curtas em parágrafos. Fecha o parágrafo quando já passou do tempo
// alvo E a fala termina em fim de frase, ou quando ficou grande demais.
export function montarParagrafos(trechos, opcoes = PADROES) {
  const paragrafos = [];
  let pedaco = [];
  let inicio = null;

  for (const trecho of trechos) {
    const texto = limpar(trecho.texto);
    if (!texto) continue;
    if (inicio === null) inicio = trecho.inicio;
    pedaco.push(texto);
    const decorrido = trecho.inicio + (trecho.duracao || 0) - inicio;
    const junto = pedaco.join(" ");
    const fimDeFrase = /[.!?…]$/.test(texto);
    if ((decorrido >= opcoes.segundosPorParagrafo && fimDeFrase) || junto.length >= opcoes.caracteresPorParagrafo) {
      paragrafos.push({ inicio, texto: junto });
      pedaco = [];
      inicio = null;
    }
  }
  if (pedaco.length && inicio !== null) paragrafos.push({ inicio, texto: pedaco.join(" ") });
  return paragrafos;
}

// O painel só informa quando cada trecho COMEÇA. A duração de um trecho é o
// tempo até o próximo; a do último vai até o fim do vídeo.
export function calcularDuracoes(trechos, duracaoDoVideo) {
  return trechos.map((t, i) => {
    const proximo = i + 1 < trechos.length ? trechos[i + 1].inicio : duracaoDoVideo || t.inicio;
    return { ...t, duracao: Math.max(proximo - t.inicio, 0) };
  });
}

function aspasYaml(valor) {
  return String(valor ?? "").replace(/"/g, '\\"');
}

function agoraLocal(data) {
  const d = (n) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${d(data.getMonth() + 1)}-${d(data.getDate())} ${d(data.getHours())}:${d(data.getMinutes())}`;
}

// video = { id, titulo, canal, duracao }; trechos = [{ inicio, texto, duracao? }]
export function montarMarkdown(video, trechos, { comTempos = true, idioma, fonte = "extensao", agora = new Date() } = {}) {
  const comDuracao = trechos.every((t) => t.duracao !== undefined) ? trechos : calcularDuracoes(trechos, video.duracao);
  const paragrafos = montarParagrafos(comDuracao);
  const ultimo = comDuracao[comDuracao.length - 1];
  const total = video.duracao || (ultimo ? ultimo.inicio + ultimo.duracao : 0);
  const palavras = paragrafos.reduce((soma, p) => soma + p.texto.split(" ").length, 0);
  const url = urlDoVideo(video.id);

  const linhas = [
    "---",
    `title: "${aspasYaml(video.titulo)}"`,
    `channel: "${aspasYaml(video.canal)}"`,
    `url: ${url}`,
    `video_id: ${video.id}`,
    `language: ${idioma || "desconhecido"}`,
    `duration: ${formatarTempo(total)}`,
    `words: ${palavras}`,
    `source: ${fonte}`,
    `extracted_at: ${agoraLocal(agora)}`,
    "---",
    "",
    `# ${video.titulo}`,
    "",
  ];

  const cabecalho = [];
  if (video.canal) cabecalho.push(`**Canal:** ${video.canal}`);
  cabecalho.push(`[Assistir no YouTube](${url})`);
  linhas.push("> " + cabecalho.join(" · "), "", "## Transcrição", "");

  for (const p of paragrafos) {
    linhas.push(comTempos ? `**[${formatarTempo(p.inicio)}](${url}&t=${Math.floor(p.inicio)}s)** ${p.texto}` : p.texto);
    linhas.push("");
  }

  return linhas.join("\n").trimEnd() + "\n";
}
