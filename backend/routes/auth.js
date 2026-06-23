// routes/auth.js
// Rota de login do painel administrativo.
// O usuário/senha do admin ficam em variáveis de ambiente (nunca no código-fonte
// nem no front-end), e a senha é validada com bcrypt (hash + salt), bem mais
// resistente a força bruta/rainbow tables do que um SHA-256 simples.

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { gerarToken } = require("../middleware/auth");
const { verificarBloqueio, registrarFalha, registrarSucesso } = require("../middleware/loginGuard");

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH; // hash bcrypt, gerado uma vez e colado no .env

if (!ADMIN_USER || !ADMIN_PASS_HASH) {
  console.error("\n🚨 ERRO FATAL: ADMIN_USER ou ADMIN_PASS_HASH não definidos no ambiente.");
  console.error("   Configure essas variáveis no .env (local) ou no Railway (produção).\n");
  process.exit(1);
}

/* POST /api/auth/login — autentica o admin e devolve um token JWT */
router.post("/login", verificarBloqueio, async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ ok: false, erro: "Informe usuário e senha." });
  }

  // Delay artificial fixo (independente do resultado) — dificulta ataques de
  // timing que tentam descobrir se o usuário existe pela velocidade da resposta.
  await new Promise(r => setTimeout(r, 400));

  const usuarioCorreto = usuario.trim().toLowerCase() === ADMIN_USER.trim().toLowerCase();
  const senhaCorreta = usuarioCorreto ? await bcrypt.compare(senha, ADMIN_PASS_HASH) : false;

  if (!usuarioCorreto || !senhaCorreta) {
    const resultado = registrarFalha(req);
    if (resultado.bloqueado) {
      return res.status(429).json({
        ok: false,
        erro: `Muitas tentativas incorretas. Acesso bloqueado por ${resultado.minutos} minuto(s).`
      });
    }
    return res.status(401).json({
      ok: false,
      erro: "Usuário ou senha incorretos.",
      tentativasRestantes: resultado.restantes
    });
  }

  registrarSucesso(req);
  const token = gerarToken({ usuario: ADMIN_USER, role: "admin" });
  res.json({ ok: true, token, expiraEm: "8h" });
});

module.exports = router;
