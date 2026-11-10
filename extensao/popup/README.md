# extensao/popup/

A janelinha que abre ao clicar no ícone da extensão.

| Arquivo | O que tem |
|---|---|
| `popup.html` | Estrutura e ícones SVG (traço estilo Lucide), reusados com `<use>`. |
| `popup.css` | Visual. Tokens de cor copiados de [interface/estilo.css](../../interface/estilo.css); o tema segue o do sistema (`prefers-color-scheme`). |
| `popup.js` | Comportamento: acha a aba, mostra o vídeo, injeta o leitor, monta e entrega o `.md`. |

## Regras

- Cor só por token, nos dois temas, com contraste conferido (texto 4,5:1, contorno
  de controle 3:1). `--ok-text` existe porque o verde do app não passa como texto.
- Sem cápsula/selo: o status é texto com cor e ícone.
- Texto vindo do YouTube (título, canal) entra por `textContent`, nunca `innerHTML`.
- `?aba=ID` na URL do popup é um gancho para o teste automatizado. Não remova.
- Download por `data:` URL, não `Blob`: com "Perguntar onde salvar" o popup fecha e
  levaria o Blob junto.
