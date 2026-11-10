# Extensão do navegador

Um botão na barra do Edge ou do Chrome que transforma o vídeo do YouTube aberto em
um arquivo de texto (Markdown), com a fala organizada em parágrafos e o tempo de
cada trecho.

## Quando usar

- Você está assistindo a um vídeo e quer guardar o que foi dito.
- O app no computador deu "bloqueio de IP" ou pediu `cookies.txt`. A extensão usa o
  navegador onde você já está logado, então esses dois problemas não aparecem.

Para transcrever **vários vídeos de uma vez** (playlist, "Assistir mais tarde") ou
um vídeo **sem legenda nenhuma**, continue usando o app no computador.

## Como usar

1. Abra o vídeo no YouTube.
2. Clique no ícone **YouTube para Markdown** na barra do navegador.
3. Confira o título e o canal que aparecem na janelinha.
4. Clique em **Baixar .md** (salva o arquivo) ou em **Copiar** (põe o texto na
   área de transferência, para colar onde quiser).

Enquanto lê, a extensão abre por um instante o painel "Transcrição" do próprio
YouTube, ao lado do vídeo, e fecha em seguida. Se o painel já estava aberto, ela o
deixa aberto.

## Opções

| Opção | O que faz |
|---|---|
| **Marcações de tempo** | Ligada: cada parágrafo começa com o minuto, e clicar nele abre o vídeo naquele ponto. Desligada: texto corrido. |
| **Perguntar onde salvar** | Ligada: o navegador pergunta a pasta e o nome. Desligada: salva direto. |

As duas escolhas ficam guardadas para a próxima vez.

## O que esperar

- O arquivo vai para **Downloads › YouTube para Markdown**. Neste computador essa pasta é
  um atalho para a pasta de transcrições do app, então o arquivo aparece junto com os
  outros e o app já o reconhece como "já transcrito". O nome é o do vídeo
  seguido do código dele (ex.: `nome-do-video-dQw4w9WgXcQ.md`). Baixar o mesmo
  vídeo de novo substitui o arquivo anterior.
- O idioma é o que o YouTube mostra no painel, normalmente o mesmo da interface do
  seu YouTube.
- Dentro do arquivo: título, canal, link, duração, número de palavras e o texto. É o
  mesmo formato do app no computador.

## Mensagens possíveis

| Mensagem | O que fazer |
|---|---|
| "Abra um vídeo do YouTube e clique no ícone de novo." | A aba aberta não é um vídeo. Shorts também não contam: abra como vídeo normal. |
| "Este vídeo não tem transcrição no YouTube." | O vídeo não tem legenda. Use o app no computador com a opção Whisper, que transcreve o áudio. |
| "O YouTube não carregou a transcrição." | Abra o painel "Transcrição" na página. Se ele também ficar vazio, o problema é do YouTube: tente mais tarde. |
| "Não achei o player nesta aba." | Recarregue a página do vídeo e tente de novo. |

## Como instalar

Veja o passo a passo no [README da extensão](../extensao/README.md#instalar-modo-desenvolvedor).
