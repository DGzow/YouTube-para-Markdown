// Roda DENTRO da aba do YouTube (no "mundo" da própria página, MAIN), injetado
// pelo popup com chrome.scripting.executeScript.
//
// ⚠️ Regra de ouro deste arquivo: a função `lerTranscricao` tem de ser
// AUTOSSUFICIENTE. O Chrome pega o texto dela (como um copiar e colar), joga na
// página e roda lá. Ela não enxerga nada de fora: nem imports, nem constantes do
// topo do arquivo, nem outras funções daqui. Tudo o que ela usa mora dentro dela.
//
// Por que ler o painel, e não baixar a legenda direto (como o app em Python)?
// Desde 2025 o YouTube exige um token anti-robô ("pot") nas URLs de legenda; sem
// ele a resposta vem vazia, e o token vale uma vez só. O painel "Transcrição" é
// carregado pela própria página, com a sua sessão, então não esbarra nisso.
// Ver "Armadilhas" no CLAUDE.md da raiz.

export function lerTranscricao() {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

  // "1:02:05" → 3725
  const lerTempo = (texto) => {
    const partes = String(texto || "").trim().split(":").map(Number);
    if (!partes.length || partes.some(Number.isNaN)) return null;
    return partes.reduce((t, p) => t * 60 + p, 0);
  };

  // O YouTube usa duas versões do painel, dependendo do vídeo:
  // a nova (transcript-segment-view-model) e a antiga (ytd-transcript-segment-renderer).
  const SELETOR_TRECHO = "transcript-segment-view-model, ytd-transcript-segment-renderer";
  const SELETOR_PAINEL =
    "ytd-engagement-panel-section-list-renderer[target-id='PAmodern_transcript_view'], " +
    "ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-searchable-transcript']";

  const lerTrechos = () =>
    [...document.querySelectorAll(SELETOR_TRECHO)]
      .map((el) => {
        const tempo =
          el.querySelector(".ytwTranscriptSegmentViewModelTimestamp, .segment-timestamp")?.textContent;
        const texto = el.querySelector(".ytAttributedStringHost, .segment-text, yt-formatted-string")?.textContent;
        return { inicio: lerTempo(tempo), texto: (texto || "").replace(/\s+/g, " ").trim() };
      })
      .filter((t) => t.inicio !== null && t.texto);

  const painelVisivel = () =>
    [...document.querySelectorAll(SELETOR_PAINEL)].find(
      (p) => p.getAttribute("visibility") === "ENGAGEMENT_PANEL_VISIBILITY_EXPANDED",
    );

  return (async () => {
    // 1) Dados do vídeo, pelo próprio player. Funciona mesmo depois de navegar de
    // um vídeo para outro sem recarregar (ytInitialPlayerResponse fica velho).
    const player = document.getElementById("movie_player");
    const dados = player?.getVideoData?.();
    if (!dados?.video_id) return { erro: "sem-video" };
    const video = {
      id: dados.video_id,
      titulo: dados.title || document.title.replace(/ - YouTube$/, ""),
      canal: dados.author || "",
      duracao: player.getDuration?.() || 0,
    };

    // Idioma: o painel não diz qual faixa mostrou. Melhor palpite: a faixa no
    // idioma da interface do YouTube; se só houver uma, é ela.
    let idioma = null;
    try {
      const faixas =
        player.getPlayerResponse?.()?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const lingua = (document.documentElement.lang || "").slice(0, 2);
      const naLingua = faixas.find((f) => f.languageCode.startsWith(lingua));
      idioma = (naLingua || (faixas.length === 1 ? faixas[0] : null))?.languageCode || null;
    } catch {
      /* palpite opcional: sem ele, o .md diz "desconhecido" */
    }

    // 2) Abre o painel, a não ser que você já esteja com ele aberto.
    const jaEstavaAberto = Boolean(painelVisivel()) && lerTrechos().length > 0;
    if (!jaEstavaAberto) {
      // O botão "Mostrar transcrição" mora na descrição, que o YouTube desenha aos
      // poucos depois de a página abrir. Espera até 6 s; na metade, abre a
      // descrição ("...mais"), que em alguns vídeos só cria o botão assim.
      const SELETOR_BOTAO = "ytd-video-description-transcript-section-renderer button";
      let botao = null;
      for (let i = 0; i < 24 && !botao; i++) {
        botao = document.querySelector(SELETOR_BOTAO);
        if (!botao && i === 12) document.querySelector("ytd-watch-metadata #description-inline-expander #expand")?.click();
        if (!botao) await esperar(250);
      }
      if (!botao) return { erro: "sem-transcricao", video };
      botao.click();
    }

    // 3) Espera os trechos pararem de chegar (mesma contagem por ~0,75 s), até 20 s.
    let anterior = -1;
    let estavel = 0;
    let trechos = [];
    for (let i = 0; i < 80; i++) {
      trechos = lerTrechos();
      if (trechos.length && trechos.length === anterior) {
        if (++estavel >= 3) break;
      } else {
        estavel = 0;
      }
      anterior = trechos.length;
      await esperar(250);
    }

    // 4) Fecha o painel se fomos nós que abrimos, para a página ficar como estava.
    if (!jaEstavaAberto) {
      painelVisivel()?.querySelector("#visibility-button button, button[aria-label='Fechar'], button[aria-label='Close']")?.click();
    }

    if (!trechos.length) return { erro: "nao-carregou", video };
    return { video, trechos, idioma };
  })();
}
