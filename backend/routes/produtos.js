// routes/produtos.js
const express = require("express");
const router  = express.Router();
const { query, get, run } = require("../db");

/* POST /api/produtos/seed-novos — insere as 15 pecas novas (AT-N21 a AT-N35) caso ainda nao existam.
   Rota temporaria, segura para rodar varias vezes (usa INSERT OR IGNORE). */
router.post("/seed-novos", (req, res) => {
  const novos = [
    { sku:"AT-N21", nome:"Vestido Toque de Couro",        desc:"Vestido curto em couro ecologico marrom, gola alta com amarracao e barra com recorte vazado em ilhos. Composicao com bota over the knee.",            img:"novo_21.jpeg", tam:["P","M","G"] },
    { sku:"AT-N22", nome:"Vestido Londres",                desc:"Vestido envelope em poliamida acetinada, manga longa ampla e decote drapeado fechado por amarracao. Disponivel nas cores Preto, Cafe, Perola e Marsala.", img:"novo_22.jpeg", tam:["P","M","G"] },
    { sku:"AT-N23", nome:"Saia Courino Mozart",            desc:"Saia em courino com caimento reto e bolsos frontais. Disponivel em Caramelo, Preto, Cinza e Nude.",                                                  img:"novo_23.jpeg", tam:["36","38","40","42"] },
    { sku:"AT-N24", nome:"Body Long Horn",                 desc:"Body basico de alcinha com estampa de chifre bordada. Disponivel em Preto, Branco e Marrom.",                                                       img:"novo_24.jpeg", tam:["P","M","G"] },
    { sku:"AT-N25", nome:"Vestido Londres Perola",         desc:"Vestido manga longa em poliamida acetinada com recorte nas costas e silhueta soltinha que afina na cintura.",                                        img:"novo_25.jpeg", tam:["P","M","G"] },
    { sku:"AT-N26", nome:"Meia-Calca Fio 40",              desc:"Meia-calca fina em tom preto, ideal para compor looks com bota e saia ou vestido curto.",                                                            img:"novo_26.jpeg", tam:["Unico"] },
    { sku:"AT-N27", nome:"Conjunto Skort Stitch",          desc:"Conjunto top cropped com recorte vazado e skort de costura contrastante. Disponivel em Preto e Off White.",                                          img:"novo_27.jpeg", tam:["P","M","G"] },
    { sku:"AT-N28", nome:"Top Bandeira Brasil",            desc:"Top em cetim estampado com as cores do Brasil, modelagem versatil que pode ser amarrada de diferentes formas.",                                      img:"novo_28.jpeg", tam:["Unico"] },
    { sku:"AT-N29", nome:"Blusa Elise Basica",             desc:"Blusa basica de manga curta em malha lisa, gola careca. Disponivel em diversas cores: preto, branco, verde, marinho, marrom e rosa.",                img:"novo_29.jpeg", tam:["P","M","G"] },
    { sku:"AT-N30", nome:"Regata Stripe Azul",             desc:"Regata canelada com acabamento contrastante na gola e cavas. Disponivel em Azul Royal e Off White.",                                                  img:"novo_30.jpeg", tam:["P","M","G"] },
    { sku:"AT-N31", nome:"Vestido Tubinho Amarracao",      desc:"Vestido midi em malha canelada com amarracao lateral que marca a cintura. Disponivel em Marrom, Preto, Marinho e Vinho.",                            img:"novo_31.jpeg", tam:["P","M","G"] },
    { sku:"AT-N32", nome:"Body Poa Mesh",                  desc:"Body de manga longa em tule com poa flocado, decote canoa. Disponivel em Preto, Marrom e Off White.",                                                img:"novo_32.jpeg", tam:["P","M","G"] },
    { sku:"AT-N33", nome:"Polo Listrada Tricot",           desc:"Polo sem manga em tricot listrado com gola e botoes frontais. Disponivel em Marrom, Marinho, Verde, Lilas e Preto.",                                 img:"novo_33.jpeg", tam:["P","M","G"] },
    { sku:"AT-N34", nome:"Vestido Canelado Costas Nuas",   desc:"Vestido midi canelado com recorte nas costas e alcas largas. Disponivel em Marrom, Off White, Caramelo e Preto.",                                    img:"novo_34.jpeg", tam:["P","M","G"] },
    { sku:"AT-N35", nome:"Regata Canelada Argola",         desc:"Regata canelada basica com detalhe de argola dourada na alca. Disponivel em Preto, Branco, Marsala, Marinho, Off White e Bordo.",                    img:"novo_35.jpeg", tam:["P","M","G"] }
  ];

  let inseridos = 0;
  novos.forEach(p => {
    const antes = get("SELECT id FROM produtos WHERE sku = ?", [p.sku]);
    if (!antes) {
      run(
        "INSERT OR IGNORE INTO produtos (sku, nome, descricao, categoria, imagem, tamanhos) VALUES (?, ?, ?, 'novos', ?, ?)",
        [p.sku, p.nome, p.desc, `images/${p.img}`, JSON.stringify(p.tam)]
      );
      inseridos++;
    }
  });

  const total = get("SELECT COUNT(*) as total FROM produtos");
  res.json({ ok: true, inseridos, total: total.total });
});

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
