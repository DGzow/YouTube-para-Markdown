# extensao/lib/

`markdown.js`: monta o `.md` a partir dos trechos lidos. É a tradução para
JavaScript de `slugify`, `format_ts`, `build_paragraphs` e `build_markdown` do
[yt_transcript_md.py](../../yt_transcript_md.py), para o arquivo da extensão sair
igual ao do app (conferido por comparação direta em 10/11/2026).

Código puro: recebe dados, devolve texto. Não toca em página, aba nem arquivo, e
por isso é testado com `node --test`, sem navegador.

## O que não fazer

- Mudou a regra de parágrafo, o frontmatter ou o nome do arquivo no Python? Mude
  aqui também, ou os dois passam a gerar `.md` diferentes.
- Não renomeie o fim do nome do arquivo (`-{video_id}.md`): o app usa o ID para
  saber o que já foi transcrito.
