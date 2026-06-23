// routes/upload.js
// Upload de imagens de produto pelo painel admin.
// Salva o arquivo em frontend/images (mesma pasta usada pelas fotos atuais
// do catálogo) e devolve o caminho relativo para ser gravado no produto.

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { exigirAutenticacao } = require("../middleware/auth");

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_POR_TIPO = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

function resolveImagesDir() {
  const candidatos = [
    path.join(__dirname, "..", "..", "frontend", "images"),
    path.join(__dirname, "..", "frontend", "images"),
  ];
  for (const c of candidatos) {
    if (fs.existsSync(c)) return c;
  }
  // fallback: cria ao lado do primeiro candidato válido
  fs.mkdirSync(candidatos[0], { recursive: true });
  return candidatos[0];
}

const IMAGES_DIR = resolveImagesDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = EXT_POR_TIPO[file.mimetype] || ".jpg";
    const nomeAleatorio = crypto.randomBytes(10).toString("hex");
    cb(null, `produto_${nomeAleatorio}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      return cb(new Error("Formato de imagem não suportado. Use JPG, PNG ou WEBP."));
    }
    cb(null, true);
  }
});

/* POST /api/upload — envia uma imagem e recebe o caminho relativo (admin) */
router.post("/", exigirAutenticacao, (req, res) => {
  upload.single("imagem")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ ok: false, erro: err.message || "Falha no upload da imagem." });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, erro: "Nenhuma imagem enviada." });
    }
    res.json({ ok: true, caminho: `images/${req.file.filename}` });
  });
});

module.exports = router;
