// routes/contatos.js
const express = require("express");
const router  = express.Router();
const { query, run, get } = require("../db");

/* POST /api/contatos — registra interesse de cliente */
router.post("/", (req, res) => {
  const { nome, telefone, produto, sku, mensagem, origem = "catalogo" } = req.body;

  if (!produto) return res.status(400).json({ ok: false, erro: "Campo 'produto' obrigatório." });

  run(
    `INSERT INTO contatos (nome,telefone,produto,sku,mensagem,origem) VALUES (?,?,?,?,?,?)`,
    [nome || "Não informado", telefone || null, produto, sku || null, mensagem || null, origem]
  );

  console.log(`[CONTATO] ${nome || "?"} → ${produto} (${sku || "-"})`);
  res.json({ ok: true, mensagem: "Interesse registrado com sucesso!" });
});

/* GET /api/contatos — lista contatos (admin) */
router.get("/", (req, res) => {
  const { limite = 50, offset = 0 } = req.query;
  const rows = query(
    "SELECT * FROM contatos ORDER BY criado_em DESC LIMIT ? OFFSET ?",
    [Number(limite), Number(offset)]
  );
  const total = get("SELECT COUNT(*) as n FROM contatos");
  res.json({ ok: true, total: total.n, contatos: rows });
});

/* DELETE /api/contatos/:id — remove contato (admin) */
router.delete("/:id", (req, res) => {
  run("DELETE FROM contatos WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
