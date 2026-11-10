# extensao/testes/

| Arquivo | Como roda | O que confere |
|---|---|---|
| `markdown.test.js` | `npm test` | Montagem do Markdown: slug, tempos, parágrafos, frontmatter. Sem rede. Roda também no CI. |
| `extensao.e2e.js` | `npm run test:e2e` | Carrega a extensão num Chromium, abre um vídeo real, aperta "Baixar .md" e confere o arquivo, o nome pedido e o painel fechado. Precisa de internet. |

O ponta a ponta usa o Chromium do Playwright (o Chrome e o Edge de marca não
carregam mais extensão pela linha de comando) e um perfil temporário, apagado no
fim. Fotos do popup (claro e escuro) e o `.md` baixado ficam em
[`saida/`](saida/), para conferir o visual.

## O que não fazer

- Não coloque o ponta a ponta no CI: depende do YouTube responder, e o YouTube
  trata servidor de CI como robô.
- Não tente "esconder" a automação do YouTube (flags anti-detecção): o teste usa o
  navegador como ele é. Se o YouTube parar de mostrar a transcrição para o
  navegador de teste, troque o vídeo ou rode à mão.
