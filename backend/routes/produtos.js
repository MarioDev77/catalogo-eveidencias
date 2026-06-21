// routes/produtos.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");

/* GET /api/produtos — lista todos, agrupados por categoria */
router.get("/", (req, res) => {
  const { categoria, ativo = "1" } = req.query;
  const produtos = db.listar({ categoria, ativo });

  const grupos = { feminino: [], masculino: [], novos: [] };
  produtos.forEach(p => {
    if (grupos[p.categoria]) grupos[p.categoria].push(p);
  });

  res.json({ ok: true, total: produtos.length, grupos, produtos });
});

/* GET /api/produtos/:sku — detalhe de um produto */
router.get("/:sku", (req, res) => {
  const produto = db.buscarPorSku(req.params.sku);
  if (!produto) return res.status(404).json({ ok: false, erro: "Produto não encontrado" });
  res.json({ ok: true, produto });
});

/* POST /api/produtos — cria um novo produto (usado pelo admin) */
router.post("/", (req, res) => {
  const { sku, nome } = req.body;
  if (!sku || !nome) {
    return res.status(400).json({ ok: false, erro: "Campos 'sku' e 'nome' são obrigatórios" });
  }
  if (db.buscarPorSku(sku)) {
    return res.status(409).json({ ok: false, erro: "Já existe um produto com esse SKU" });
  }
  const novo = db.criar(req.body);
  res.status(201).json({ ok: true, produto: novo });
});

/* PUT /api/produtos/:sku — atualiza um produto existente */
router.put("/:sku", (req, res) => {
  const atualizado = db.atualizar(req.params.sku, req.body);
  if (!atualizado) return res.status(404).json({ ok: false, erro: "Produto não encontrado" });
  res.json({ ok: true, produto: atualizado });
});

/* DELETE /api/produtos/:sku — remove um produto */
router.delete("/:sku", (req, res) => {
  const removido = db.remover(req.params.sku);
  if (!removido) return res.status(404).json({ ok: false, erro: "Produto não encontrado" });
  res.json({ ok: true });
});

module.exports = router;
