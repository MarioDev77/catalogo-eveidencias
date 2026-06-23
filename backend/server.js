// server.js — Catálogo Evidências Modas
require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const morgan      = require("morgan");
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");
const path        = require("path");
const fs          = require("fs");

const app  = express();
const PORT = process.env.PORT || 3000;

// Confia no proxy do Railway (corrige X-Forwarded-* e evita loops de redirect)
app.set("trust proxy", 1);

/* ─── Resolve o caminho do frontend de forma resiliente ───
   Funciona tanto se o Root Directory do deploy for a raiz do repo
   (backend e frontend lado a lado) quanto se for a pasta "backend"
   isoladamente (nesse caso, "frontend" não existe um nível acima e
   o servidor cai de volta para servir só a API, sem quebrar). */
function resolveFrontendPath() {
  const candidatos = [
    path.join(__dirname, "..", "frontend"),
    path.join(__dirname, "frontend"),
    path.join(__dirname, "public", "frontend")
  ];
  for (const candidato of candidatos) {
    if (fs.existsSync(path.join(candidato, "index.html"))) return candidato;
  }
  return null;
}

const FRONTEND_PATH = resolveFrontendPath();

if (!FRONTEND_PATH) {
  console.warn("⚠️  Pasta do frontend não encontrada. O servidor vai responder só a API.");
  console.warn("    Verifique se o Root Directory do deploy está na raiz do repositório.");
}

/* ─── Segurança e middlewares ─── */
app.use(helmet({
  contentSecurityPolicy: false  // permite carregar Google Fonts e recursos externos
}));

// CORS_ORIGIN aceita uma origem única, várias separadas por vírgula, ou "*".
// Em produção, prefira sempre listar a(s) URL(s) reais do frontend em vez de "*" —
// "*" permite que qualquer site na internet chame esta API diretamente.
const corsOriginEnv = process.env.CORS_ORIGIN || "*";
const corsOrigins = corsOriginEnv.split(",").map(o => o.trim()).filter(Boolean);

if (corsOriginEnv === "*" && process.env.NODE_ENV === "production") {
  console.warn("⚠️  CORS_ORIGIN está como \"*\" em produção. Recomenda-se restringir à URL real do frontend.");
}

app.use(cors({
  origin: corsOrigins.includes("*") ? "*" : corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Rate limit na API
app.use("/api", rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, erro: "Muitas requisições. Tente novamente em 1 minuto." }
}));

// Rate limit mais estrito específico para tentativas de login (além do
// bloqueio progressivo por IP feito no loginGuard) — barra automação rápida
// de tentativas antes mesmo de chegar na lógica de usuário/senha.
app.use("/api/auth/login", rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, erro: "Muitas tentativas de login. Aguarde um minuto." }
}));

// Rate limit dedicado para as duas rotas públicas que GRAVAM dados sem
// exigir login (POST /api/contatos e POST /api/stats/view). O limite geral
// de /api (120/min) é alto demais para essas: sem isso, alguém poderia
// automatizar o envio de centenas de "contatos" falsos por minuto, poluindo
// os dados reais de clientes e inchando os arquivos em disco.
const limiteEscritaPublica = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, erro: "Muitas requisições. Tente novamente em 1 minuto." }
});
app.use("/api/contatos", (req, res, next) => req.method === "POST" ? limiteEscritaPublica(req, res, next) : next());
app.use("/api/stats/view", limiteEscritaPublica);

/* ─── Arquivos estáticos ─── */
// Painel admin
app.use("/admin", express.static(path.join(__dirname, "public", "admin"), { redirect: false }));
app.get(/^\/admin\/?$/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

// Frontend do catálogo (só registra se a pasta existir)
if (FRONTEND_PATH) {
  app.use(express.static(FRONTEND_PATH));
}

/* ─── Rotas da API ─── */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/produtos", require("./routes/produtos"));
app.use("/api/contatos", require("./routes/contatos"));
app.use("/api/stats",    require("./routes/stats"));
app.use("/api/upload",   require("./routes/upload"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    versao: "2.0.0",
    frontend_servido: !!FRONTEND_PATH,
    timestamp: new Date().toISOString()
  });
});

/* ─── SPA fallback: tudo que não é /api vai para o frontend (se existir) ─── */
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ ok: false, erro: "Rota não encontrada" });
  }
  if (FRONTEND_PATH) {
    return res.sendFile(path.join(FRONTEND_PATH, "index.html"));
  }
  res.status(404).send("Frontend não disponível neste serviço. Esta instância serve apenas a API.");
});

/* ─── Handler global de erro ───
   Qualquer erro não tratado (JSON malformado, exceção em rota, etc.) cai
   aqui. Sem isso, o Express devolveria o stack trace completo do código
   para o cliente em alguns casos — informação útil para quem está tentando
   atacar o servidor (caminhos de arquivo, versões de biblioteca etc.).
   O detalhe real do erro vai só para o log do servidor. */
app.use((err, req, res, next) => {
  console.error("[ERRO NÃO TRATADO]", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, erro: "Erro interno no servidor. Tente novamente em instantes." });
});

/* ─── Sobe o servidor (sem dependência de banco externo) ─── */
app.listen(PORT, () => {
  console.log(`\n✅ Catálogo Evidências rodando em http://localhost:${PORT}`);
  console.log(`   → Catálogo:  http://localhost:${PORT}/`);
  console.log(`   → Admin:     http://localhost:${PORT}/admin/`);
  console.log(`   → API:       http://localhost:${PORT}/api/produtos`);
  console.log(`   → Frontend:  ${FRONTEND_PATH || "NÃO ENCONTRADO"}\n`);
});
