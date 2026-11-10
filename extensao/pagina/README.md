# extensao/pagina/

Código que roda **dentro da aba do YouTube**, injetado pelo popup com
`chrome.scripting.executeScript` no mundo `MAIN` (o mesmo JavaScript da página,
para poder usar o player `movie_player`).

`ler-transcricao.js` exporta `lerTranscricao()`, que:

1. Pega id, título, canal e duração pelo player (`getVideoData`, `getDuration`).
2. Abre o painel "Transcrição" pelo botão da descrição (espera ele aparecer, até 6 s).
3. Espera os trechos pararem de chegar e lê tempo + texto de cada um. Aceita as
   duas versões do painel que o YouTube usa hoje (`transcript-segment-view-model` e
   `ytd-transcript-segment-renderer`).
4. Fecha o painel, se foi ela que abriu.
5. Devolve `{ video, trechos, idioma }` ou `{ erro: "sem-video" | "sem-transcricao" | "nao-carregou" }`.

## O que não fazer

- **Nada de fora dentro da função.** O Chrome copia o texto da função e roda na
  página; import, constante do topo ou função vizinha viram "não definido" lá.
- Não baixe a URL da legenda (`/api/timedtext`): sem o token anti-robô do YouTube
  ela volta vazia. Ver "Armadilhas" no [CLAUDE.md](../../CLAUDE.md).
- Se o YouTube mudar a página, os seletores daqui são o primeiro lugar a conferir. O
  teste `npm run test:e2e` avisa.
