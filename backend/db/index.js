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

  const novos = [
    ...Array.from({length:20},(_,i) => {
      const n = String(i+1).padStart(2,"0");
      return { sku:`AT-N${n}`, nome:`Modelo Novo ${n}`, desc:"Nova peça da coleção recém-chegada.", img:`novo_${n}.jpeg`, tam:["P","M","G"] };
    }),
    { sku:"AT-N21", nome:"Vestido Toque de Couro",        desc:"Vestido curto em couro ecológico marrom, gola alta com amarração e barra com recorte vazado em ilhós. Composição com bota over the knee.",                  img:"novo_21.jpeg", tam:["P","M","G"] },
    { sku:"AT-N22", nome:"Vestido Londres",                desc:"Vestido envelope em poliamida acetinada, manga longa ampla e decote drapeado fechado por amarração. Disponível nas cores Preto, Café, Pérola e Marsala.",        img:"novo_22.jpeg", tam:["P","M","G"] },
    { sku:"AT-N23", nome:"Saia Courino Mozart",            desc:"Saia em courino com caimento reto e bolsos frontais. Disponível em Caramelo, Preto, Cinza e Nude.",                                                              img:"novo_23.jpeg", tam:["36","38","40","42"] },
    { sku:"AT-N24", nome:"Body Long Horn",                 desc:"Body básico de alcinha com estampa de chifre bordada. Disponível em Preto, Branco e Marrom.",                                                                   img:"novo_24.jpeg", tam:["P","M","G"] },
    { sku:"AT-N25", nome:"Vestido Londres Pérola",         desc:"Vestido manga longa em poliamida acetinada com recorte nas costas e silhueta soltinha que afina na cintura.",                                                    img:"novo_25.jpeg", tam:["P","M","G"] },
    { sku:"AT-N26", nome:"Meia-Calça Fio 40",              desc:"Meia-calça fina em tom preto, ideal para compor looks com bota e saia ou vestido curto.",                                                                        img:"novo_26.jpeg", tam:["Único"] },
    { sku:"AT-N27", nome:"Conjunto Skort Stitch",          desc:"Conjunto top cropped com recorte vazado e skort de costura contrastante. Disponível em Preto e Off White.",                                                       img:"novo_27.jpeg", tam:["P","M","G"] },
    { sku:"AT-N28", nome:"Top Bandeira Brasil",            desc:"Top em cetim estampado com as cores do Brasil, modelagem versátil que pode ser amarrada de diferentes formas.",                                                  img:"novo_28.jpeg", tam:["Único"] },
    { sku:"AT-N29", nome:"Blusa Elise Básica",             desc:"Blusa básica de manga curta em malha lisa, gola careca. Disponível em diversas cores: preto, branco, verde, marinho, marrom e rosa.",                            img:"novo_29.jpeg", tam:["P","M","G"] },
    { sku:"AT-N30", nome:"Regata Stripe Azul",             desc:"Regata canelada com acabamento contrastante na gola e cavas. Disponível em Azul Royal e Off White.",                                                              img:"novo_30.jpeg", tam:["P","M","G"] },
    { sku:"AT-N31", nome:"Vestido Tubinho Amarração",      desc:"Vestido midi em malha canelada com amarração lateral que marca a cintura. Disponível em Marrom, Preto, Marinho e Vinho.",                                          img:"novo_31.jpeg", tam:["P","M","G"] },
    { sku:"AT-N32", nome:"Body Poá Mesh",                  desc:"Body de manga longa em tule com poá flocado, decote canoa. Disponível em Preto, Marrom e Off White.",                                                            img:"novo_32.jpeg", tam:["P","M","G"] },
    { sku:"AT-N33", nome:"Polo Listrada Tricot",           desc:"Polo sem manga em tricot listrado com gola e botões frontais. Disponível em Marrom, Marinho, Verde, Lilás e Preto.",                                               img:"novo_33.jpeg", tam:["P","M","G"] },
    { sku:"AT-N34", nome:"Vestido Canelado Costas Nuas",   desc:"Vestido midi canelado com recorte nas costas e alças largas. Disponível em Marrom, Off White, Caramelo e Preto.",                                                 img:"novo_34.jpeg", tam:["P","M","G"] },
    { sku:"AT-N35", nome:"Regata Canelada Argola",         desc:"Regata canelada básica com detalhe de argola dourada na alça. Disponível em Preto, Branco, Marsala, Marinho, Off White e Bordô.",                                  img:"novo_35.jpeg", tam:["P","M","G"] }
  ];

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
