// db/index.js — Banco de dados SQLite via sql.js (puro JS, sem dependências nativas)
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "catalogo.db");
let db = null;

/* ─── Inicializa banco ─── */
async function getDB() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Cria diretório data/ se não existir
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Carrega banco existente ou cria novo
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    criarTabelas();
    seedProdutos();
    salvar();
  }

  return db;
}

/* ─── Salva banco em disco ─── */
function salvar() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/* ─── Cria tabelas ─── */
function criarTabelas() {
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      sku       TEXT UNIQUE NOT NULL,
      nome      TEXT NOT NULL,
      descricao TEXT,
      categoria TEXT NOT NULL,  -- 'feminino' | 'masculino' | 'novos'
      imagem    TEXT,
      tamanhos  TEXT,           -- JSON: ["P","M","G"]
      preco     TEXT DEFAULT 'Consulte',
      destaque  INTEGER DEFAULT 0,
      ativo     INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS contatos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT,
      telefone   TEXT,
      produto    TEXT,
      sku        TEXT,
      mensagem   TEXT,
      origem     TEXT DEFAULT 'catalogo',
      criado_em  TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS visualizacoes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      sku       TEXT NOT NULL,
      ip        TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime'))
    );
  `);
}

/* ─── Dados iniciais ─── */
function seedProdutos() {
  const feminino = [
    { sku:"AT-001",  nome:"Conjunto Soraia",      desc:"Conjunto blazer e shorts em alfaiataria leve, cor chocolate. Caimento estruturado, fivela metálica e modelagem que valoriza a silhueta.", img:"produto_01.png",  tam:["P","M","G"] },
    { sku:"AT-J05",  nome:"Calça Lumière",         desc:"Calça jeans cintura alta em lavagem clara, modelagem skinny com lycra para conforto e sustentação.",                                       img:"produto_05.jpeg", tam:["36","38","40","44","46"] },
    { sku:"AT-J08",  nome:"Calça Noir Modeladora", desc:"Jeans escuro com efeito modelador, cintura alta e elastano. Realça curvas com sofisticação.",                                              img:"produto_08.jpeg", tam:["38","40","42","44","46"] },
    { sku:"AT-J10",  nome:"Calça Bardot",          desc:"Edição limitada em lavagem média uniforme. Cintura alta com lycra, recortes precisos.",                                                    img:"produto_10.jpeg", tam:["36","38"] },
    { sku:"AT-J14",  nome:"Calça Indigo Premium",  desc:"Jeans azul escuro com leve desgaste, costura aparente e modelagem skinny ajustada.",                                                       img:"produto_14.jpeg", tam:["36","38","40","46"] }
  ];

  const masculino = [
    { sku:"AT-M03", nome:"Jeans Marlon Azul Médio", desc:"Calça jeans com lycra em lavagem média uniforme. Modelagem skinny, conforto e sofisticação.", img:"produto_03.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-M02", nome:"Jeans Graphite",           desc:"Jeans cinza grafite com leve estonado. Lycra para mobilidade total e caimento moderno.",      img:"produto_02.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-M04", nome:"Jeans Indigo Used",        desc:"Lavagem indigo profundo com leve desgaste. Bolsos clássicos e modelagem slim.",                img:"produto_04.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-M06", nome:"Jeans Navy Essencial",     desc:"Tom azul marinho profundo, tecido encorpado com lycra. Versatilidade do casual ao social.",    img:"produto_06.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-M07", nome:"Jeans Royal Blue",         desc:"Azul royal vibrante com toque acetinado. Modelagem slim para um visual contemporâneo.",        img:"produto_07.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-M09", nome:"Jeans Classique",          desc:"Lavagem média atemporal, cinco bolsos. Peça-curinga que combina com tudo.",                    img:"produto_09.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B11", nome:"Brim Sand",                desc:"Calça em brim bege areia com lycra. Modelagem slim, ideal para looks descontraídos.",           img:"produto_11.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B12", nome:"Brim Espresso",            desc:"Marrom escuro encorpado com elastano. Combinação refinada com camisas claras.",                 img:"produto_12.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B13", nome:"Brim Terracotta",          desc:"Tom laranja telha exclusivo. Brim com lycra para conforto e modelagem ajustada.",               img:"produto_13.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B15", nome:"Brim Blanc",               desc:"Branca off-white em brim premium. Sofisticada para o dia e elegante para a noite.",             img:"produto_15.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B16", nome:"Brim Noir",                desc:"Preto absoluto, modelagem slim com lycra. A base perfeita para qualquer composição.",            img:"produto_16.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B17", nome:"Brim Marine",              desc:"Azul marinho com leve elasticidade. Caimento limpo e bolsos discretos.",                        img:"produto_17.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B18", nome:"Brim Bordeaux",            desc:"Vinho profundo com brilho sutil. Modelagem slim e tecido com excelente memória.",               img:"produto_18.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B19", nome:"Brim Caramelo",            desc:"Tom caramelo quente em brim com lycra. Toque sofisticado para o guarda-roupa masculino.",       img:"produto_19.jpeg", tam:["38","40","42","44"] },
    { sku:"AT-B20", nome:"Brim Khaki Stone",         desc:"Cinza esverdeado em tecido encorpado. Versátil, sóbrio e contemporâneo.",                      img:"produto_20.jpeg", tam:["38","40","42","44"] }
  ];

  const novos = Array.from({length:20},(_,i) => {
    const n = String(i+1).padStart(2,"0");
    return { sku:`AT-N${n}`, nome:`Modelo Novo ${n}`, desc:"Nova peça da coleção recém-chegada.", img:`novo_${n}.jpeg`, tam:["P","M","G"] };
  });

  const inserir = (lista, cat) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO produtos (sku,nome,descricao,categoria,imagem,tamanhos)
      VALUES (?,?,?,?,?,?)
    `);
    lista.forEach(p => stmt.run([p.sku, p.nome, p.desc, cat, `images/${p.img}`, JSON.stringify(p.tam)]));
    stmt.free();
  };

  inserir(feminino,  "feminino");
  inserir(masculino, "masculino");
  inserir(novos,     "novos");
}

/* ─── Helpers de query ─── */
function query(sql, params = []) {
  const db_ = db;
  const stmt = db_.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  salvar();
}

function get(sql, params = []) {
  const rows = query(sql, params);
  return rows[0] || null;
}

module.exports = { getDB, query, run, get, salvar };
