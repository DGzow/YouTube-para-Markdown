# extensao/

Extensão de navegador (Chrome e Edge, Manifest V3) que baixa a transcrição do vídeo
do YouTube aberto como um arquivo `.md`, no mesmo formato do app em Python.

Ela **lê o painel "Transcrição" que o próprio YouTube mostra na página**, usando a
sua sessão do navegador. Por isso não esbarra no bloqueio de IP nem precisa de
`cookies.txt`. O que ela não faz (fica no app): Whisper para vídeo sem legenda,
fila de playlists e "Assistir mais tarde".

## Instalar (modo desenvolvedor)

1. Abra `edge://extensions` (ou `chrome://extensions`).
2. Ligue **Modo de desenvolvedor**.
3. Clique em **Carregar sem compactação** e escolha esta pasta `extensao/`.
4. Fixe o ícone na barra (quebra-cabeça → alfinete).

Depois de editar qualquer arquivo daqui, clique em **Recarregar** no cartão da
extensão nessa mesma página.

## Mapa

| Pasta/arquivo | O que tem |
|---|---|
| `manifest.json` | Identidade da extensão: nome, versão, ícones e permissões. |
| [`popup/`](popup/) | A janelinha que abre ao clicar no ícone (HTML, CSS, JS). |
| [`pagina/`](pagina/) | O código injetado na aba do YouTube para ler o painel. |
| [`lib/`](lib/) | Montagem do Markdown (pura, sem navegador). |
| [`icones/`](icones/) | Ícones PNG gerados a partir do `icone.ico` do app. |
| [`testes/`](testes/) | Testes de unidade (Node) e ponta a ponta (Playwright). |
| `package.json` | Só para os testes. A extensão em si não usa npm nem build. |

Dependência em uma direção: `popup/ → pagina/` e `popup/ → lib/`. `lib/` não sabe
que existe navegador.

## Permissões, e por quê

- `host_permissions: www.youtube.com` — rodar o leitor na aba do vídeo e ver a URL
  dela. A extensão **não** enxerga nenhum outro site.
- `scripting` — injetar o leitor na aba.
- `downloads` — salvar o `.md` em `Downloads/YouTube para Markdown/`.
- `storage` — lembrar as duas chaves do popup.

## Testes

```bash
cd extensao
npm install          # uma vez (instala o Playwright 1.65, sem baixar navegador novo)
npm test             # unidade: montagem do Markdown
npm run test:e2e     # ponta a ponta: carrega a extensão e baixa um vídeo de verdade
```

## O que não fazer

- Não adicione import nem variável de fora dentro de `lerTranscricao`
  ([pagina/](pagina/)): ela é copiada como texto para a página e lá não enxerga nada.
- Não troque o leitor por "baixar a URL da legenda": o YouTube exige um token que a
  extensão não tem (ver "Armadilhas" no [CLAUDE.md](../CLAUDE.md)).
- Não peça permissão nova sem anotar aqui o motivo.
