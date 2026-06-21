# Catálogo Evidências Modas — v2.0 (sem SQLite)

## O que mudou nesta versão

A versão anterior usava SQLite (`sql.js`) salvo em arquivo dentro do container do
Railway. O problema: o Railway **não garante disco persistente** entre deploys/restarts
sem um volume configurado, então o banco era recriado do zero (apagando qualquer
produto inserido manualmente) sempre que o serviço reiniciava.

**Nesta versão, os produtos ficam em `backend/data/produtos.json`**, um arquivo de
texto simples que é versionado no Git junto com o resto do código. Isso significa:

- Os 35 produtos (20 originais + 15 novos) já vêm prontos desde o primeiro deploy.
- Qualquer alteração feita pelo painel admin (criar/editar/excluir produto) é
  salva nesse arquivo em tempo real.
- **Atenção:** se o Railway recriar o container sem volume persistente, alterações
  feitas pelo admin *depois* do último `git push` podem se perder no próximo deploy
  (mesma limitação de antes). O que resolve isso de vez é commitar o `produtos.json`
  de volta no repositório depois de usar o admin, ou — melhor ainda — migrar para um
  banco gerenciado (ex: Postgres do próprio Railway) caso o catálogo for crescer muito
  ou tiver edições frequentes pelo admin em produção.

## Estrutura

```
catalogo-evidencias/
├── backend/
│   ├── data/
│   │   ├── produtos.json       ← os 35 produtos (fonte da verdade)
│   │   ├── contatos.json       ← interesses registrados pelo catálogo
│   │   └── visualizacoes.json  ← contagem de views por produto
│   ├── db/
│   │   └── index.js            ← funções de ler/escrever o JSON
│   ├── routes/
│   │   ├── produtos.js
│   │   ├── contatos.js
│   │   └── stats.js
│   ├── public/admin/           ← painel administrativo
│   ├── server.js
│   └── package.json
└── frontend/
    ├── index.html              ← catálogo (mesmo visual de antes)
    └── images/                 ← todas as fotos dos produtos
```

## Deploy

### Railway (backend)
1. Crie um novo serviço a partir deste repositório.
2. **Root Directory: deixe vazio (raiz do repo)** — não use `backend` como root,
   porque o `server.js` precisa encontrar a pasta `frontend` um nível acima dele.
   (O código agora detecta automaticamente se a pasta frontend existe ou não, então
   mesmo que você configure errado, o site não vai mais derrubar com erro 500 —
   mas vai servir só a API, sem o catálogo visual.)
3. Start Command: `cd backend && npm install && node server.js` — ou configure
   Root Directory como a raiz e Build/Start normalmente, com `npm install` rodando
   dentro de `backend`.
4. Variáveis de ambiente: nenhuma obrigatória. Opcional: `CORS_ORIGIN` para
   restringir o domínio que pode chamar a API.

### Vercel (frontend)
1. Root Directory: `frontend`
2. Sem build step necessário (é HTML estático).
3. O arquivo `frontend/index.html` já aponta para a URL do Railway em `API_BASE`
   (linha ~356). Atualize esse valor se o domínio do Railway mudar.

## Testando localmente

```bash
cd backend
npm install
node server.js
```

Abra `http://localhost:3000` no navegador — o catálogo completo, incluindo as 35
peças, deve aparecer imediatamente.

## Adicionando produtos no futuro

Duas formas:

1. **Pelo painel admin** (`/admin/`) — mais rápido, mas lembre de fazer backup do
   `produtos.json` (ou commit) depois de usar, caso o Railway recrie o container.
2. **Editando `backend/data/produtos.json` direto e fazendo commit** — mais seguro
   a longo prazo, porque garante que os dados sempre vêm junto com o código.
