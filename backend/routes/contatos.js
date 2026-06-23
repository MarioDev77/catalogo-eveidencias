// routes/contatos.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { exigirAutenticacao } = require("../middleware/auth");

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

/* POST /api/contatos — registra interesse de cliente (público, com validação) */
router.post("/", (req, res) => {
  const { nome, telefone, produto, sku, mensagem, origem = "catalogo" } = req.body;

  if (!produto || typeof produto !== "string" || !produto.trim()) {
    return res.status(400).json({ ok: false, erro: "Campo 'produto' obrigatório." });
  }

  const contatos = lerContatos();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?";
  const novo = {
    id: contatos.length ? Math.max(...contatos.map(c => c.id)) + 1 : 1,
    nome: nome ? String(nome).trim().slice(0, 120) : "Não informado",
    telefone: telefone ? String(telefone).replace(/[^\d+()\s-]/g, "").slice(0, 20) : null,
    produto: String(produto).trim().slice(0, 120),
    sku: sku ? String(sku).trim().slice(0, 30) : null,
    mensagem: mensagem ? String(mensagem).trim().slice(0, 500) : null,
    origem: String(origem).trim().slice(0, 30),
    ip,
    criado_em: new Date().toISOString()
  };
  contatos.unshift(novo);
  salvarContatos(contatos);

  console.log(`[CONTATO] ${novo.nome} → ${novo.produto} (${novo.sku || "-"})`);
  res.json({ ok: true, mensagem: "Interesse registrado com sucesso!" });
});

/* ─── A partir daqui, dados de clientes só para o admin autenticado ─── */

/* GET /api/contatos — lista contatos (admin) */
router.get("/", exigirAutenticacao, (req, res) => {
  const { limite = 50, offset = 0 } = req.query;
  const lim = Math.min(Math.max(Number(limite) || 50, 1), 500);
  const off = Math.max(Number(offset) || 0, 0);
  const todos = lerContatos();
  const pagina = todos.slice(off, off + lim);
  res.json({ ok: true, total: todos.length, contatos: pagina });
});

/* DELETE /api/contatos/:id — remove contato (admin) */
router.delete("/:id", exigirAutenticacao, (req, res) => {
  const id = Number(req.params.id);
  const contatos = lerContatos();
  const existe = contatos.some(c => c.id === id);
  if (!existe) return res.status(404).json({ ok: false, erro: "Contato não encontrado" });

  salvarContatos(contatos.filter(c => c.id !== id));
  res.json({ ok: true });
});

module.exports = router;
