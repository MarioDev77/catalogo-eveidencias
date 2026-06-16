// routes/stats.js — Estatísticas e visualizações
const express = require("express");
const router  = express.Router();
const { query, run, get } = require("../db");

/* POST /api/stats/view — registra visualização */
router.post("/view", (req, res) => {
  const { sku } = req.body;
  if (!sku) return res.status(400).json({ ok: false });
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?";
  run("INSERT INTO visualizacoes (sku,ip) VALUES (?,?)", [sku, ip]);
  res.json({ ok: true });
});

/* GET /api/stats — resumo geral */
router.get("/", (req, res) => {
  const totalProdutos = get("SELECT COUNT(*) as n FROM produtos WHERE ativo=1");
  const totalContatos = get("SELECT COUNT(*) as n FROM contatos");
  const totalViews    = get("SELECT COUNT(*) as n FROM visualizacoes");

  const maisVistos = query(`
    SELECT v.sku, p.nome, COUNT(*) as views
    FROM visualizacoes v
    LEFT JOIN produtos p ON p.sku = v.sku
    GROUP BY v.sku
    ORDER BY views DESC
    LIMIT 10
  `);

  const contatosHoje = get(`
    SELECT COUNT(*) as n FROM contatos
    WHERE date(criado_em) = date('now','localtime')
  `);

  const ultimosContatos = query(`
    SELECT * FROM contatos ORDER BY criado_em DESC LIMIT 5
  `);

  res.json({
    ok: true,
    resumo: {
      produtos: totalProdutos.n,
      contatos: totalContatos.n,
      views:    totalViews.n,
      contatosHoje: contatosHoje.n
    },
    maisVistos,
    ultimosContatos
  });
});

module.exports = router;
