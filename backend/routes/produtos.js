// routes/produtos.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { exigirAutenticacao } = require("../middleware/auth");

const CATEGORIAS_VALIDAS = ["feminino", "masculino", "novos"];

/** Valida e limpa os campos recebidos do admin antes de salvar. */
function validarProduto(body, { exigirSkuNome = true } = {}) {
  const erros = [];
  const dados = {};

  if (exigirSkuNome) {
    if (!body.sku || typeof body.sku !== "string" || !body.sku.trim()) {
      erros.push("Campo 'sku' é obrigatório.");
    } else if (!/^[A-Za-z0-9\-_]{1,30}$/.test(body.sku.trim())) {
      erros.push("SKU deve conter só letras, números, hífen ou underline (até 30 caracteres).");
    } else {
      dados.sku = body.sku.trim().toUpperCase();
    }

    if (!body.nome || typeof body.nome !== "string" || !body.nome.trim()) {
      erros.push("Campo 'nome' é obrigatório.");
    } else if (body.nome.trim().length > 120) {
      erros.push("Nome muito longo (máximo 120 caracteres).");
    } else {
      dados.nome = body.nome.trim();
    }
  } else {
    if (body.nome !== undefined) dados.nome = String(body.nome).trim().slice(0, 120);
  }

  if (body.descricao !== undefined) dados.descricao = String(body.descricao).trim().slice(0, 600);

  if (body.categoria !== undefined) {
    if (!CATEGORIAS_VALIDAS.includes(body.categoria)) {
      erros.push(`Categoria inválida. Use uma de: ${CATEGORIAS_VALIDAS.join(", ")}.`);
    } else {
      dados.categoria = body.categoria;
    }
  }

  if (body.imagem !== undefined) dados.imagem = String(body.imagem).trim().slice(0, 300);

  if (body.tamanhos !== undefined) {
    if (!Array.isArray(body.tamanhos)) {
      erros.push("Campo 'tamanhos' deve ser uma lista.");
    } else {
      dados.tamanhos = body.tamanhos.map(t => String(t).trim().slice(0, 10)).filter(Boolean).slice(0, 15);
    }
  }

  if (body.preco !== undefined) dados.preco = String(body.preco).trim().slice(0, 60);
  if (body.ativo !== undefined) dados.ativo = !!body.ativo;
  if (body.destaque !== undefined) dados.destaque = !!body.destaque;

  return { erros, dados };
}

/* GET /api/produtos — lista todos, agrupados por categoria (público) */
router.get("/", (req, res) => {
  const { categoria, ativo = "1" } = req.query;
  const produtos = db.listar({ categoria, ativo });

  const grupos = { feminino: [], masculino: [], novos: [] };
  produtos.forEach(p => {
    if (grupos[p.categoria]) grupos[p.categoria].push(p);
  });

  res.json({ ok: true, total: produtos.length, grupos, produtos });
});

/* GET /api/produtos/:sku — detalhe de um produto (público) */
router.get("/:sku", (req, res) => {
  const produto = db.buscarPorSku(req.params.sku);
  if (!produto) return res.status(404).json({ ok: false, erro: "Produto não encontrado" });
  res.json({ ok: true, produto });
});

/* ─── A partir daqui, todas as rotas exigem login de admin ─── */

/* POST /api/produtos — cria um novo produto (admin) */
router.post("/", exigirAutenticacao, (req, res) => {
  const { erros, dados } = validarProduto(req.body, { exigirSkuNome: true });
  if (erros.length) return res.status(400).json({ ok: false, erro: erros.join(" ") });

  if (db.buscarPorSku(dados.sku)) {
    return res.status(409).json({ ok: false, erro: "Já existe um produto com esse SKU" });
  }
  const novo = db.criar(dados);
  res.status(201).json({ ok: true, produto: novo });
});

/* PUT /api/produtos/:sku — atualiza um produto existente (admin) */
router.put("/:sku", exigirAutenticacao, (req, res) => {
  const { erros, dados } = validarProduto(req.body, { exigirSkuNome: false });
  if (erros.length) return res.status(400).json({ ok: false, erro: erros.join(" ") });

  const atualizado = db.atualizar(req.params.sku, dados);
  if (!atualizado) return res.status(404).json({ ok: false, erro: "Produto não encontrado" });
  res.json({ ok: true, produto: atualizado });
});

/* DELETE /api/produtos/:sku — remove um produto (admin) */
router.delete("/:sku", exigirAutenticacao, (req, res) => {
  const removido = db.remover(req.params.sku);
  if (!removido) return res.status(404).json({ ok: false, erro: "Produto não encontrado" });
  res.json({ ok: true });
});

module.exports = router;
