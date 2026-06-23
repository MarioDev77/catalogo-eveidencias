// middleware/loginGuard.js
// Controla tentativas de login por IP: bloqueia progressivamente após
// erros consecutivos, em memória (sem dependência de banco externo).
//
// Regras:
//  - 5 tentativas erradas seguidas → bloqueia o IP por 15 minutos
//  - Cada novo bloqueio dobra o tempo anterior (15min → 30min → 60min...),
//    até um teto de 24h, para desencorajar tentativas persistentes (brute force).
//  - Login certo zera o contador daquele IP.
//  - Estado limpo automaticamente em memória (sem crescer pra sempre).

const MAX_TENTATIVAS = 5;
const BLOQUEIO_BASE_MS = 15 * 60 * 1000;     // 15 minutos
const BLOQUEIO_MAX_MS = 24 * 60 * 60 * 1000; // 24 horas
const JANELA_LIMPEZA_MS = 60 * 60 * 1000;    // limpa registros antigos a cada 1h

const estado = new Map(); // ip -> { tentativas, bloqueadoAte, nivelBloqueio, ultimaAtividade }

function getRegistro(ip) {
  if (!estado.has(ip)) {
    estado.set(ip, { tentativas: 0, bloqueadoAte: 0, nivelBloqueio: 0, ultimaAtividade: Date.now() });
  }
  return estado.get(ip);
}

function obterIp(req) {
  // Confia no X-Forwarded-For só porque "trust proxy" está configurado no server.js
  // (Railway/Vercel atrás de proxy reverso confiável).
  return req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "desconhecido";
}

/** Middleware: bloqueia a requisição se o IP estiver em período de bloqueio. */
function verificarBloqueio(req, res, next) {
  const ip = obterIp(req);
  const reg = getRegistro(ip);
  reg.ultimaAtividade = Date.now();

  if (reg.bloqueadoAte > Date.now()) {
    const minutosRestantes = Math.ceil((reg.bloqueadoAte - Date.now()) / 60000);
    return res.status(429).json({
      ok: false,
      erro: `Muitas tentativas de acesso. Tente novamente em ${minutosRestantes} minuto(s).`,
      bloqueadoAte: reg.bloqueadoAte
    });
  }
  req._loginIp = ip;
  next();
}

/** Chamar quando o login falhar: incrementa contador e bloqueia se necessário. */
function registrarFalha(req) {
  const ip = req._loginIp || obterIp(req);
  const reg = getRegistro(ip);
  reg.tentativas++;
  reg.ultimaAtividade = Date.now();

  if (reg.tentativas >= MAX_TENTATIVAS) {
    const tempoBloqueio = Math.min(BLOQUEIO_BASE_MS * Math.pow(2, reg.nivelBloqueio), BLOQUEIO_MAX_MS);
    reg.bloqueadoAte = Date.now() + tempoBloqueio;
    reg.nivelBloqueio++;
    reg.tentativas = 0;
    console.warn(`[SEGURANÇA] IP ${ip} bloqueado por ${Math.round(tempoBloqueio / 60000)} min após tentativas suspeitas de login no admin.`);
    return { bloqueado: true, minutos: Math.round(tempoBloqueio / 60000) };
  }
  return { bloqueado: false, restantes: MAX_TENTATIVAS - reg.tentativas };
}

/** Chamar quando o login der certo: zera o histórico de falhas daquele IP. */
function registrarSucesso(req) {
  const ip = req._loginIp || obterIp(req);
  estado.delete(ip);
}

// Limpeza periódica de IPs inativos para não crescer a memória indefinidamente
setInterval(() => {
  const agora = Date.now();
  for (const [ip, reg] of estado.entries()) {
    if (agora - reg.ultimaAtividade > JANELA_LIMPEZA_MS && reg.bloqueadoAte < agora) {
      estado.delete(ip);
    }
  }
}, JANELA_LIMPEZA_MS).unref();

module.exports = { verificarBloqueio, registrarFalha, registrarSucesso };
