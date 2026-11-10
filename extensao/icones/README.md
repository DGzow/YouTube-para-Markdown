# extensao/icones/

Ícones da extensão em 16, 32, 48 e 128 px, gerados a partir do
[icone.ico](../../icone.ico) do app (o mesmo do atalho da Área de Trabalho), para
as duas peças terem a mesma cara.

Para gerar de novo (precisa do Pillow), na raiz do projeto:

```bash
python -c "from PIL import Image; im=Image.open('icone.ico'); im.size=(256,256); im.load(); [im.convert('RGBA').resize((s,s), Image.LANCZOS).save(f'extensao/icones/icone-{s}.png') for s in (16,32,48,128)]"
```

Não renomeie os arquivos sem atualizar o `manifest.json`.
