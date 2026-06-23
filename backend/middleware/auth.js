// middleware/auth.js
// Protege rotas administrativas exigindo um token JWT válido emitido em /api/auth/login.
// Sem esse token, requisições de escrita (criar/editar/excluir produto, ver contatos
// etc.) são rejeitadas com 401 — diferente da versão anterior, em que a "tela de
// login" era só visual e a API continuava 100% aberta para qualquer requisição direta.

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("\n🚨 ERRO FATAL: variável de ambiente JWT_SECRET não definida.");
  console.error("   Defina JWT_SECRET no .env (local) ou nas variáveis do Railway (produção).");
  console.error("   Gere uma com: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"\n");
  process.exit(1);
}

function gerarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

/** Middleware: exige um Bearer token válido no header Authorization. */
function exigirAutenticacao(req, res, next) {
  const header = req.headers.authorization || "";
  const [tipo, token] = header.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, erro: "Acesso não autorizado. Faça login no painel admin." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, erro: "Sessão inválida ou expirada. Faça login novamente." });
  }
}

module.exports = { gerarToken, exigirAutenticacao, JWT_SECRET };
