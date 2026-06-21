// routes/contatos.js
const express = require("express");
const router  = express.Router();
const fs      = require("fs");
const path    = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "contatos.json");

function lerContatos() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function salvarContatos(lista) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(lista, null, 2), "utf-8");
}

/* POST /api/contatos — registra interesse de cliente */
router.post("/", (req, res) => {
  const { nome, telefone, produto, sku, mensagem, origem = "catalogo" } = req.body;

  if (!produto) return res.status(400).json({ ok: false, erro: "Campo 'produto' obrigatório." });

  const contatos = lerContatos();
  const novo = {
    id: contatos.length ? Math.max(...contatos.map(c => c.id)) + 1 : 1,
    nome: nome || "Não informado",
    telefone: telefone || null,
    produto,
    sku: sku || null,
    mensagem: mensagem || null,
    origem,
    criado_em: new Date().toISOString()
  };
  contatos.unshift(novo);
  salvarContatos(contatos);

  console.log(`[CONTATO] ${novo.nome} → ${produto} (${sku || "-"})`);
  res.json({ ok: true, mensagem: "Interesse registrado com sucesso!" });
});

/* GET /api/contatos — lista contatos (admin) */
router.get("/", (req, res) => {
  const { limite = 50, offset = 0 } = req.query;
  const todos = lerContatos();
  const pagina = todos.slice(Number(offset), Number(offset) + Number(limite));
  res.json({ ok: true, total: todos.length, contatos: pagina });
});

/* DELETE /api/contatos/:id — remove contato (admin) */
router.delete("/:id", (req, res) => {
  const contatos = lerContatos().filter(c => c.id !== Number(req.params.id));
  salvarContatos(contatos);
  res.json({ ok: true });
});

module.exports = router;
