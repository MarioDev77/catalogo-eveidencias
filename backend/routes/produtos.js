// routes/produtos.js
const express = require("express");
const router  = express.Router();
const { query, get, run } = require("../db");

/* GET /api/produtos — lista com filtros opcionais */
router.get("/", (req, res) => {
  const { categoria, ativo = "1" } = req.query;
  let sql    = "SELECT * FROM produtos WHERE ativo = ?";
  const params = [ativo === "all" ? undefined : 1];

  if (ativo === "all") {
    sql = "SELECT * FROM produtos";
    params.length = 0;
  }

  if (categoria) {
    sql += params.length ? " AND categoria = ?" : " WHERE categoria = ?";
    params.push(categoria);
  }

  sql += " ORDER BY categoria, id";

  const rows = query(sql, params);
  const produtos = rows.map(p => ({
    ...p,
    tamanhos: JSON.parse(p.tamanhos || "[]"),
    destaque: !!p.destaque,
    ativo: !!p.ativo
  }));

  // Agrupa por categoria para facilitar o frontend
  const grupos = {
    feminino:  produtos.filter(p => p.categoria === "feminino"),
    masculino: produtos.filter(p => p.categoria === "masculino"),
    novos:     produtos.filter(p => p.categoria === "novos")
  };

  res.json({ ok: true, total: produtos.length, grupos, produtos });
});

/* GET /api/produtos/:sku */
router.get("/:sku", (req, res) => {
  const p = get("SELECT * FROM produtos WHERE sku = ?", [req.params.sku]);
  if (!p) return res.status(404).json({ ok: false, erro: "Produto não encontrado" });
  p.tamanhos = JSON.parse(p.tamanhos || "[]");
  res.json({ ok: true, produto: p });
});

/* PUT /api/produtos/:sku — atualiza produto (admin) */
router.put("/:sku", (req, res) => {
  const { nome, descricao, tamanhos, preco, destaque, ativo } = req.body;
  const p = get("SELECT id FROM produtos WHERE sku = ?", [req.params.sku]);
  if (!p) return res.status(404).json({ ok: false, erro: "Produto não encontrado" });

  run(`UPDATE produtos SET
    nome          = COALESCE(?, nome),
    descricao     = COALESCE(?, descricao),
    tamanhos      = COALESCE(?, tamanhos),
    preco         = COALESCE(?, preco),
    destaque      = COALESCE(?, destaque),
    ativo         = COALESCE(?, ativo),
    atualizado_em = datetime('now','localtime')
    WHERE sku = ?`,
    [
      nome || null,
      descricao || null,
      tamanhos ? JSON.stringify(tamanhos) : null,
      preco || null,
      destaque !== undefined ? (destaque ? 1 : 0) : null,
      ativo !== undefined ? (ativo ? 1 : 0) : null,
      req.params.sku
    ]
  );

  const atualizado = get("SELECT * FROM produtos WHERE sku = ?", [req.params.sku]);
  atualizado.tamanhos = JSON.parse(atualizado.tamanhos || "[]");
  res.json({ ok: true, produto: atualizado });
});

module.exports = router;
