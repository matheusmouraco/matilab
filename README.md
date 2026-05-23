# Matilab — Site Institucional

Site estático em HTML/CSS/JS puro. Sem build, sem dependências.

## Estrutura
```
matilab-site/
  index.html      → o site completo
  vercel.json     → configuração de deploy (cache de imagens + clean URLs)
  imgs/           → screenshots do portfólio (thumb_XX + full_XX)
```

## Como subir no Vercel

### Opção A — via terminal (mais rápido)
1. Instale a CLI uma vez: `npm i -g vercel`
2. Entre na pasta: `cd matilab-site`
3. Rode: `vercel` (primeira vez) e depois `vercel --prod` para produção
4. Para renomear o projeto pra `matilab`, rode: `vercel --prod --name matilab`
   (o domínio fica matilab.vercel.app se estiver disponível)

### Opção B — via GitHub + Vercel (recomendado pra atualizar depois)
1. Crie um repositório no GitHub e suba TODOS os arquivos desta pasta
   (index.html, vercel.json e a pasta imgs/ inteira)
2. No Vercel: "Add New Project" → importe o repositório → Deploy
3. Não precisa configurar build — o Vercel detecta site estático sozinho

### Opção C — drag & drop
1. No painel do Vercel, arraste a pasta matilab-site/ inteira na área de deploy

## Domínio próprio
Para usar matilab.com.br: Vercel → Settings → Domains → Add → matilab.com.br
e aponte o DNS conforme as instruções que o Vercel mostrar.
