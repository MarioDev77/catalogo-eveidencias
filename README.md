# Catálogo Evidências Modas — v2.1 (segurança + admin completo)

## ⚠️ Antes de colocar em produção

1. Copie `backend/.env.example` para `backend/.env` e preencha os valores reais
   (veja a seção **Variáveis de ambiente** abaixo).
2. No Railway, configure essas mesmas variáveis em **Settings → Variables** do
   serviço — nunca suba o `.env` real para o Git (o `.gitignore` já bloqueia isso).
3. Rode `npm install` dentro de `backend/` antes do primeiro deploy (novas
   dependências: `bcryptjs`, `jsonwebtoken`, `multer`).

## O que mudou nesta versão

### 🔒 Segurança do painel admin (antes: só "decoração")
Na versão anterior, a tela de login do `/admin/` era só uma camada visual em
JavaScript no navegador — qualquer pessoa que soubesse chamar a API diretamente
(via `curl`, Postman, etc.) conseguia criar, editar ou apagar produtos e ver os
contatos de clientes **sem nenhuma senha**, porque a API em si não verificava
nada. Agora:

- Login real via `POST /api/auth/login`, validado no backend com **bcrypt**
  (hash com salt — bem mais resistente a quebra do que o SHA-256 simples
  usado antes).
- Toda rota que cria, edita ou apaga dados (`POST`/`PUT`/`DELETE` de produtos,
  upload de imagem, listagem/exclusão de contatos) agora exige um token **JWT**
  válido, emitido só depois do login. Sem o token, a API responde `401` —
  mesmo que a pessoa nunca tenha aberto a tela de login.
- O usuário e a senha do admin **não estão mais no código-fonte**. Ficam em
  variáveis de ambiente (`ADMIN_USER` e `ADMIN_PASS_HASH`), lidas só pelo
  servidor.

### 🚫 Bloqueio por tentativas suspeitas
- Depois de **5 tentativas de login erradas** seguidas do mesmo IP, o acesso é
  bloqueado por 15 minutos — mesmo que a pessoa digite a senha certa durante o
  bloqueio.
- Se a pessoa continuar tentando depois de bloqueada, o tempo de bloqueio
  **dobra a cada vez** (15min → 30min → 1h…), até um teto de 24h.
- Esse controle é por IP e fica em memória no servidor (não depende de banco
  externo). Some sozinho depois de um tempo sem atividade, sem acumular dados
  para sempre.
- Existe também um limite de 10 tentativas de login por minuto por IP (rate
  limit), antes mesmo de chegar na lógica de senha — dificulta automação.

### ✨ Nova função no admin: adicionar peça nova
Antes só era possível **editar** produtos já existentes pelo admin. Agora tem
um botão **"+ Nova Peça"** na página de Produtos, que abre um formulário para:

- SKU, nome, descrição, tamanhos, preço;
- **Categoria** (a peça já vem pré-selecionada como "✨ Novos Modelos", mas
  pode trocar para Feminino se for o caso);
- **Foto** — clique na caixa de upload, escolha a imagem do computador, e ela
  é enviada automaticamente para o servidor (aceita JPG, PNG ou WEBP, até 5MB).

Assim que a peça é salva, **ela já aparece direto no catálogo público**, na
seção correspondente ("Novos Modelos" ou "Feminino") — sem precisar editar
nenhum arquivo manualmente. Os contadores de "X peças" no topo de cada seção
e no hero da página principal também se atualizam automaticamente.

### 🖼️ Logo corrigida e em alta resolução
A logo original (`logo-evidencia.png`) tinha baixa resolução e uma falha de
exportação que deixava até o miolo do desenho semi-transparente — daí o
aspecto "borrado". Foi gerada uma nova versão a partir da mesma logo, com o
canal de transparência corrigido e em resolução bem maior (1200px), nítida
mesmo em telas retina/4K. A splash screen usa essa versão grande; o cabeçalho
usa uma versão leve (`logo-header.png`, 240px) só para não pesar o
carregamento da página.

### 🏠 Logo no cabeçalho
A logo da empresa agora aparece no canto superior esquerdo, ao lado do nome
"Evidências · Modas", em todas as páginas do catálogo.

### 🎨 Abertura (hero) com layout mais editorial
A seção de abertura do catálogo foi redesenhada: composição assimétrica
(texto alinhado à esquerda, com uma faixa vertical decorativa "Coleção
Atual"), métricas reais no rodapé do hero (peças disponíveis, etc.) que se
atualizam automaticamente, no lugar do antigo texto centralizado com
gradiente — visual mais próximo de um editorial de moda do que de um
template genérico.

### 🍪 Aviso de cookies
Um banner discreto aparece na primeira visita (alguns segundos depois da
splash screen), avisando sobre o uso de armazenamento local e dos dados de
contato coletados pelo formulário do catálogo. A escolha da pessoa
("Aceitar todos" ou "Apenas essenciais") é lembrada e o banner não volta a
aparecer depois disso. Não há cookies de rastreamento/publicidade de
terceiros — é puramente informativo.

## Estrutura

```
catalogo-evidencias/
├── .gitignore
├── backend/
│   ├── .env.example             ← copie para .env e preencha
│   ├── data/
│   │   ├── produtos.json        ← produtos (fonte da verdade)
│   │   ├── contatos.json        ← interesses registrados pelo catálogo
│   │   └── visualizacoes.json   ← contagem de views por produto
│   ├── db/
│   │   └── index.js             ← funções de ler/escrever o JSON
│   ├── middleware/
│   │   ├── auth.js              ← geração/validação do token JWT
│   │   └── loginGuard.js        ← bloqueio progressivo por IP
│   ├── routes/
│   │   ├── auth.js              ← login do admin
│   │   ├── produtos.js
│   │   ├── contatos.js
│   │   ├── stats.js
│   │   └── upload.js            ← upload de imagem de produto
│   ├── public/admin/            ← painel administrativo
│   ├── server.js
│   └── package.json
└── frontend/
    ├── index.html               ← catálogo + banner de cookies
    └── images/                  ← fotos dos produtos + logo
```

## Variáveis de ambiente

Veja `backend/.env.example` para o modelo completo. As obrigatórias são:

| Variável          | Para que serve                                                | Como gerar |
|-------------------|-----------------------------------------------------------------|------------|
| `ADMIN_USER`      | E-mail/usuário de login do admin                               | escolha você mesmo |
| `ADMIN_PASS_HASH` | Hash bcrypt da senha do admin (nunca a senha em texto puro)     | `node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA', 12))"` |
| `JWT_SECRET`      | Segredo usado para assinar os tokens de sessão do admin         | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CORS_ORIGIN`     | (Opcional) domínio do frontend, para restringir quem chama a API | ex: `https://catalogo-evidencias.vercel.app` |

**Se você precisar trocar a senha do admin no futuro:** gere um novo hash com
o comando da tabela acima e atualize só a variável `ADMIN_PASS_HASH` no
Railway — não precisa tocar no código.

## Deploy

### Railway (backend)
1. Configure as variáveis de ambiente da tabela acima em
   **Settings → Variables**.
2. Root Directory: deixe vazio (raiz do repo) — o `server.js` precisa
   encontrar a pasta `frontend` um nível acima dele.
3. Start Command: `cd backend && npm install && node server.js`.

### Vercel (frontend)
1. Root Directory: `frontend`.
2. Sem build step necessário (é HTML estático).
3. Confirme que `API_BASE` dentro de `frontend/index.html` aponta para a URL
   atual do serviço no Railway.

## Testando localmente

```bash
cd backend
cp .env.example .env
# edite o .env com seus próprios valores de ADMIN_USER / ADMIN_PASS_HASH / JWT_SECRET
npm install
node server.js
```

Abra `http://localhost:3000` para o catálogo e `http://localhost:3000/admin/`
para o painel administrativo.

## ⚠️ Sobre persistência de dados no Railway

Os produtos, contatos e imagens enviadas pelo admin continuam sendo salvos em
arquivos dentro do container (`backend/data/*.json` e `frontend/images/`).
**O Railway não garante disco persistente entre deploys/restarts** a menos que
um volume seja configurado. Isso significa que produtos adicionados ou fotos
enviadas pelo admin *depois* do último `git push` podem se perder caso o
serviço seja reiniciado ou reimplantado. Para um catálogo com edições
frequentes em produção, o ideal a médio prazo é migrar para um banco
gerenciado (ex: PostgreSQL do próprio Railway) com volume persistente — isso
não foi feito nesta rodada a pedido do cliente, mas é a próxima melhoria
recomendada.
