# Evidências Modas — Catálogo Atelier

## ⚠️ IMPORTANTE: Como iniciar corretamente

O painel `/admin` **só funciona pelo servidor Node.js** (porta 3000).  
**NÃO abra os arquivos pelo Live Server do VS Code** (porta 5500) — isso causa o erro 404.

---

## 🚀 Como iniciar o servidor

```bash
# 1. Entre na pasta backend
cd backend

# 2. Instale as dependências (só precisa fazer uma vez)
npm install

# 3. Inicie o servidor
node server.js
```

Após iniciar, acesse:

| Página      | URL                              |
|-------------|----------------------------------|
| Catálogo    | http://localhost:3000/           |
| **Admin**   | **http://localhost:3000/admin/** |
| API         | http://localhost:3000/api/produtos |

---

## 📁 Estrutura do projeto

```
/
├── backend/
│   ├── server.js          ← servidor Express (porta 3000)
│   ├── .env               ← configurações (PORT, etc.)
│   ├── db/index.js        ← banco SQLite (sql.js)
│   ├── routes/
│   │   ├── produtos.js
│   │   ├── contatos.js
│   │   └── stats.js
│   └── public/
│       └── admin/
│           └── index.html ← painel administrativo
└── frontend/
    ├── index.html         ← catálogo público
    └── images/            ← fotos dos produtos
```

---

## ✅ Correções aplicadas

- Adicionado redirecionamento `/admin` → `/admin/` no servidor  
- `contentSecurityPolicy` desativado para permitir Google Fonts  
- README com instruções claras de uso

