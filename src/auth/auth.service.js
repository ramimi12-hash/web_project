// src/common/auth/auth.service.js
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library"); // ✅ 추가

const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../jwt");
const {
  saveRefreshToken,
  existsRefreshToken,
  deleteRefreshToken,
} = require("./refreshTokenStore");

// 임시 사용자(나중에 DB로 교체)
const USERS = [
  {
    id: 1,
    email: "admin@test.com",
    passwordHash: bcrypt.hashSync("1234", 10),
    role: "ADMIN",
  },
  {
    id: 2,
    email: "staff@test.com",
    passwordHash: bcrypt.hashSync("1234", 10),
    role: "STAFF",
  },
];

function parseExpiresToSeconds(expiresIn) {
  if (!expiresIn) return 0;
  if (typeof expiresIn === "number") return expiresIn;

  const s = String(expiresIn).trim();
  const m = s.match(/^(\d+)([smhd])$/i);
  if (!m) {
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const value = Number(m[1]);
  const unit = m[2].toLowerCase();

  if (unit === "s") return value;
  if (unit === "m") return value * 60;
  if (unit === "h") return value * 60 * 60;
  if (unit === "d") return value * 24 * 60 * 60;
  return 0;
}

function newJti() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
}

async function login(email, password) {
  const user = USERS.find((u) => u.email === email);
  if (!user) {
    const err = new Error("INVALID_CREDENTIALS");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("INVALID_CREDENTIALS");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });

  const jti = newJti();
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role, jti });

  const ttlSeconds = parseExpiresToSeconds(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
  await saveRefreshToken({ userId: user.id, jti, ttlSeconds });

  return { accessToken, refreshToken };
}

// ✅ 로그아웃: refreshToken 폐기
async function logout(refreshToken) {
  if (!refreshToken) {
    const err = new Error("REFRESH_TOKEN_REQUIRED");
    err.status = 400;
    throw err;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    const err = new Error("INVALID_REFRESH_TOKEN");
    err.status = 401;
    throw err;
  }

  const { userId, jti } = payload;
  if (!userId || !jti) {
    const err = new Error("INVALID_REFRESH_TOKEN");
    err.status = 401;
    throw err;
  }

  await deleteRefreshToken({ userId, jti });
}

async function refreshTokens(refreshToken) {
  if (!refreshToken) {
    const err = new Error("REFRESH_TOKEN_REQUIRED");
    err.status = 400;
    throw err;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    const err = new Error("INVALID_REFRESH_TOKEN");
    err.status = 401;
    throw err;
  }

  const { userId, role, jti } = payload;
  if (!userId || !jti) {
    const err = new Error("INVALID_REFRESH_TOKEN");
    err.status = 401;
    throw err;
  }

  // ✅ 디버깅 로그(회전 확인용)
  console.log("[refresh] incoming:", { userId, role, jti });

  const ok = await existsRefreshToken({ userId, jti });
  if (!ok) {
    const err = new Error("REFRESH_TOKEN_REUSE_DETECTED");
    err.status = 401;
    throw err;
  }

  // ✅ 회전: 기존 토큰 폐기
  await deleteRefreshToken({ userId, jti });
  console.log("[refresh] deleted old jti:", jti);

  const newAccessToken = signAccessToken({ userId, role });

  const newJtiValue = newJti();
  const newRefreshToken = signRefreshToken({ userId, role, jti: newJtiValue });

  const ttlSeconds = parseExpiresToSeconds(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
  await saveRefreshToken({ userId, jti: newJtiValue, ttlSeconds });
  console.log("[refresh] saved new jti:", newJtiValue);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

// =====================================================
// ✅ Google OAuth (일반) 추가: getGoogleAuthUrl / googleLoginCallback
// =====================================================

// .env 필요:
// GOOGLE_CLIENT_ID=...
// GOOGLE_CLIENT_SECRET=...
// GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
console.log("[google env check]", {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "***" : undefined,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
});

// (1) 구글 로그인 URL 생성 (컨트롤러의 /auth/google/start에서 redirect에 사용)
async function getGoogleAuthUrl() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    const err = new Error("GOOGLE_OAUTH_ENV_MISSING");
    err.status = 500;
    throw err;
  }

  return googleClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["openid", "email", "profile"],
  });
}

// (2) 콜백 처리: code -> 구글 토큰 -> 구글 사용자 -> 내부 JWT 발급
async function googleLoginCallback(code) {
  if (!code) {
    const err = new Error("GOOGLE_CODE_REQUIRED");
    err.status = 400;
    throw err;
  }

  // 1) code -> tokens
  let tokens;
  try {
    const r = await googleClient.getToken(code);
    tokens = r.tokens;
  } catch (e) {
    const err = new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");
    err.status = 401;
    throw err;
  }

  // 2) id_token 검증으로 사용자 정보 확보
  let googlePayload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    googlePayload = ticket.getPayload();
  } catch (e) {
    const err = new Error("GOOGLE_ID_TOKEN_INVALID");
    err.status = 401;
    throw err;
  }

  const googleSub = googlePayload?.sub;
  const email = googlePayload?.email;
  const name = googlePayload?.name || "";

  if (!googleSub || !email) {
    const err = new Error("GOOGLE_PROFILE_INCOMPLETE");
    err.status = 401;
    throw err;
  }

  // 3) DB가 없으니 임시 USERS에 매칭/생성
  // 실제로는 prisma user upsert(provider='google', providerId=googleSub)로 교체 추천
  let user = USERS.find((u) => u.email === email);
  if (!user) {
    const newId = USERS.length + 1;
    user = {
      id: newId,
      email,
      passwordHash: bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 10),
      role: "STAFF",
      provider: "google",
      providerId: googleSub,
    };
    USERS.push(user);
  }

  // 4) 내부 JWT 발급 + refresh 저장(기존 방식 그대로)
  const accessToken = signAccessToken({ userId: user.id, role: user.role });

  const jti = newJti();
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role, jti });

  const ttlSeconds = parseExpiresToSeconds(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
  await saveRefreshToken({ userId: user.id, jti, ttlSeconds });

  return {
    accessToken,
    refreshToken,
    social: {
      provider: "google-oauth",
      email,
      name,
    },
  };
}

module.exports = {
  login,
  refreshTokens,
  logout,

  // ✅ google oauth
  getGoogleAuthUrl,
  googleLoginCallback,
};
