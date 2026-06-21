// db/index.js
// Banco de dados simplificado baseado em arquivo JSON.
// Os dados ficam versionados no Git (data/produtos.json), entao nunca se perdem
// entre deploys ou restarts do servidor (diferente de SQLite em containers sem volume).
//
// IMPORTANTE: como o Railway nao garante disco persistente entre deploys, qualquer
// alteracao feita pelo admin (criar/editar/excluir produto) e salva no arquivo,
// mas so fica permanente de fato apos um novo commit/push. Para uso continuo,
// considere conectar um banco externo (ex: PostgreSQL do Railway) no futuro.

const fs   = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "produtos.json");

function lerTudo() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erro ao ler produtos.json:", err.message);
    return [];
  }
}

function salvarTudo(produtos) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(produtos, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Erro ao salvar produtos.json:", err.message);
    return false;
  }
}

function listar({ categoria, ativo } = {}) {
  let produtos = lerTudo();
  if (categoria) produtos = produtos.filter(p => p.categoria === categoria);
  if (ativo !== undefined && ativo !== "all") {
    const ativoBool = ativo === "1" || ativo === true;
    produtos = produtos.filter(p => p.ativo === ativoBool);
  }
  return produtos;
}

function buscarPorSku(sku) {
  return lerTudo().find(p => p.sku === sku) || null;
}

function proximoId() {
  const produtos = lerTudo();
  return produtos.length ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
}

function criar(produto) {
  const produtos = lerTudo();
  const novo = {
    id: proximoId(),
    sku: produto.sku,
    nome: produto.nome,
    descricao: produto.descricao || "",
    categoria: produto.categoria || "novos",
    imagem: produto.imagem || "",
    tamanhos: produto.tamanhos || ["P", "M", "G"],
    preco: produto.preco || "Consulte",
    ativo: produto.ativo !== undefined ? produto.ativo : true
  };
  produtos.push(novo);
  salvarTudo(produtos);
  return novo;
}

function atualizar(sku, dadosNovos) {
  const produtos = lerTudo();
  const idx = produtos.findIndex(p => p.sku === sku);
  if (idx === -1) return null;
  produtos[idx] = { ...produtos[idx], ...dadosNovos, sku: produtos[idx].sku };
  salvarTudo(produtos);
  return produtos[idx];
}

function remover(sku) {
  const produtos = lerTudo();
  const idx = produtos.findIndex(p => p.sku === sku);
  if (idx === -1) return false;
  produtos.splice(idx, 1);
  salvarTudo(produtos);
  return true;
}

/* Insere produtos novos apenas se o SKU ainda nao existir. Seguro para rodar
   varias vezes sem duplicar. Usado pela rota de seed. */
function inserirSeNaoExiste(listaNovos) {
  const produtos = lerTudo();
  const existentes = new Set(produtos.map(p => p.sku));
  let inseridos = 0;
  let proximoIdLocal = produtos.length ? Math.max(...produtos.map(p => p.id)) + 1 : 1;

  listaNovos.forEach(p => {
    if (!existentes.has(p.sku)) {
      produtos.push({
        id: proximoIdLocal++,
        sku: p.sku,
        nome: p.nome,
        descricao: p.descricao || "",
        categoria: p.categoria || "novos",
        imagem: p.imagem || "",
        tamanhos: p.tamanhos || ["P", "M", "G"],
        preco: p.preco || "Consulte",
        ativo: true
      });
      existentes.add(p.sku);
      inseridos++;
    }
  });

  salvarTudo(produtos);
  return { inseridos, total: produtos.length };
}

module.exports = {
  listar,
  buscarPorSku,
  criar,
  atualizar,
  remover,
  inserirSeNaoExiste
};
