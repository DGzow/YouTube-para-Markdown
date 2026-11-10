# YouTube para Markdown

**Leia primeiro o [CHANGELOG.md](CHANGELOG.md).** Toda mudança entra lá, com o porquê.

## O que é

Ferramenta pessoal que transforma vídeos do YouTube em `.md` (frontmatter, texto em
parágrafos, tempos clicáveis). Duas peças, mesmo formato de arquivo:

- **App local em Python** (`app.py` + `interface/`, servidor em `127.0.0.1:7860`,
  CLI em `yt_transcript_md.py`): playlists, fila com pausa, login Google, Whisper.
- **Extensão de navegador** ([extensao/](extensao/)): o vídeo aberto, um clique,
  usando a sessão do navegador.

O usuário é iniciante em programação (sabe um pouco de Python): explicar o que cada
trecho faz ao mexer no código.

## Arquitetura

- `yt_transcript_md.py`: núcleo (legendas via `youtube-transcript-api` → `yt-dlp` →
  Whisper opcional; montagem do Markdown).
- `app.py`: servidor HTTP e rotas `/api/...`; página montada de `interface/`.
- `extensao/lib/markdown.js`: **cópia em JS** da montagem do Markdown. Regra mudou no
  Python → muda lá também (os dois geram arquivo idêntico, conferido em 10/11/2026).
- Testes Python em `tests/` (CI); testes da extensão em `extensao/testes/`.

## Padrão visual

Tokens em `interface/estilo.css` (claro `:root`, escuro `.dark`), repetidos em
`extensao/popup/popup.css`. Sem cápsulas/selos. Contraste conferido por número.
Tema do app: botão único com fade linear; o popup segue o tema do sistema.

## Armadilhas

- **Legenda do YouTube exige token anti-robô ("pot") desde 2025.** A URL de
  `captionTracks[].baseUrl` (`/api/timedtext`, com `exp=xpe`) volta **vazia** sem ele,
  e o token vale uma vez só (refazer a mesma URL também volta vazio). `get_transcript`
  chamado à mão responde 400 "Precondition check failed". Por isso a extensão **lê o
  painel "Transcrição" da página** (carregado por `get_panel` com a sessão do usuário).
  Testado em 10/11/2026.
- O painel tem duas versões: `transcript-segment-view-model` (nova, `PAmodern_transcript_view`)
  e `ytd-transcript-segment-renderer` (antiga, `engagement-panel-searchable-transcript`,
  em vídeos com capítulos). Num navegador de teste sem login, a antiga pode falhar no
  próprio YouTube (400); no navegador logado ela funciona.
- O botão "Mostrar transcrição" aparece **depois** de a página abrir: esperar por ele.
- `lerTranscricao` é serializada para a página: nada de import ou variável de fora.
- No Windows, `--cookies-from-browser` do yt-dlp não funciona (DPAPI): use `cookies.txt`.
- Não tentar contornar detecção de automação do YouTube em teste.
