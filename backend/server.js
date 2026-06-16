// server.js — Catálogo Atelier Coleção
require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const morgan      = require("morgan");
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");
const path        = require("path");
const { getDB }   = require("./db");

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─── Segurança e middlewares ─── */
app.use(helmet({
  contentSecurityPolicy: false  // permite carregar Google Fonts e recursos externos
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET","POST","PUT","DELETE"]
}));

app.use(express.json());
app.use(morgan("dev"));

// Rate limit na API
app.use("/api", rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, erro: "Muitas requisições. Tente novamente em 1 minuto." }
}));

/* ─── Arquivos estáticos ─── */
// Painel admin — rota COM e SEM trailing slash
app.get("/admin", (req, res) => res.redirect("/admin/"));
app.use("/admin", express.static(path.join(__dirname, "public", "admin")));

// Frontend do catálogo
app.use(express.static(path.join(__dirname, "..", "frontend")));

/* ─── Rotas da API ─── */
app.use("/api/produtos",  require("./routes/produtos"));
app.use("/api/contatos",  require("./routes/contatos"));
app.use("/api/stats",     require("./routes/stats"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, versao: "1.0.0", timestamp: new Date().toISOString() });
});

/* ─── SPA fallback: tudo que não é /api vai para o frontend ─── */
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ ok: false, erro: "Rota não encontrada" });
  }
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

/* ─── Inicia banco e sobe servidor ─── */
getDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n✅ Catálogo Atelier rodando em http://localhost:${PORT}`);
    console.log(`   → Catálogo:  http://localhost:${PORT}/`);
    console.log(`   → Admin:     http://localhost:${PORT}/admin/`);
    console.log(`   → API:       http://localhost:${PORT}/api/produtos\n`);
  });
}).catch(err => {
  console.error("❌ Erro ao inicializar banco:", err);
  process.exit(1);
});
