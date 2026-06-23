// routes/stats.js — Estatísticas e visualizações
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { exigirAutenticacao } = require("../middleware/auth");

const VIEWS_PATH = path.join(__dirname, "..", "data", "visualizacoes.json");
const CONTATOS_PATH = path.join(__dirname, "..", "data", "contatos.json");

function lerJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return []; }
}
function salvarJSON(p, dados) {
  fs.writeFileSync(p, JSON.stringify(dados, null, 2), "utf-8");
}

/* POST /api/stats/view — registra visualização (público, sem dado sensível) */
router.post("/view", (req, res) => {
  const { sku } = req.body;
  if (!sku || typeof sku !== "string") return res.status(400).json({ ok: false });

  const views = lerJSON(VIEWS_PATH);
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?";
  views.push({ sku: sku.trim().slice(0, 30), ip, criado_em: new Date().toISOString() });
  salvarJSON(VIEWS_PATH, views);

  res.json({ ok: true });
});

/* GET /api/stats — resumo geral (admin: contém nomes/contatos de clientes) */
router.get("/", exigirAutenticacao, (req, res) => {
  const produtos = db.listar({ ativo: "1" });
  const contatos = lerJSON(CONTATOS_PATH);
  const views = lerJSON(VIEWS_PATH);

  const contagemPorSku = {};
  views.forEach(v => { contagemPorSku[v.sku] = (contagemPorSku[v.sku] || 0) + 1; });

  const maisVistos = Object.entries(contagemPorSku)
    .map(([sku, count]) => {
      const produto = produtos.find(p => p.sku === sku);
      return { sku, nome: produto ? produto.nome : null, views: count };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const hoje = new Date().toISOString().slice(0, 10);
  const contatosHoje = contatos.filter(c => (c.criado_em || "").startsWith(hoje)).length;

  res.json({
    ok: true,
    resumo: {
      produtos: produtos.length,
      contatos: contatos.length,
      views: views.length,
      contatosHoje
    },
    maisVistos,
    ultimosContatos: contatos.slice(0, 5)
  });
});

module.exports = router;
