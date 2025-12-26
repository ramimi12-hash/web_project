// src/routes/auth.routes.js
const express = require("express");
const { toErrorResponse } = require("../common/errorResponse");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../jwt");

const { parseExpiresToSeconds } = require("../common/utils/ttl");
const {
  saveRefreshToken,
  existsRefreshToken,
  deleteRefreshToken,
} = require("../auth/refreshTokenStore");

// TODO: 너희 실제 유저 조회/비번검증 로직으로 바꿔야 함
// 지금은 "로그인 성공하면 userId/role이 나온다"는 전제
async function fakeLogin(email, password) {
  // 여기 실제 구현(Prisma user 조회 + bcrypt compare)로 교체
  if (email === "admin@test.com" && password === "1234") return { id: 1, role: "ADMIN" };
  if (email === "staff@test.com" && password === "1234") return { id: 2, role: "STAFF" };
  return null;
}

const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await fakeLogin(email, password);
  if (!user) {
    return res.status(401).json(
      toErrorResponse({
        path: req.originalUrl,
        status: 401,
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
        details: {},
      })
    );
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const { token: refreshToken, jti } = signRefreshToken({ sub: user.id, role: user.role });

  const ttlSeconds = parseExpiresToSeconds(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
  await saveRefreshToken({ userId: user.id, jti, ttlSeconds });

  return res.json({ accessToken, refreshToken });
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) {
    return res.status(400).json(
      toErrorResponse({
        path: req.originalUrl,
        status: 400,
        code: "BAD_REQUEST",
        message: "refreshToken is required",
        details: {},
      })
    );
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken); // { sub, role, jti, iat, exp }
  } catch (e) {
    return res.status(401).json(
      toErrorResponse({
        path: req.originalUrl,
        status: 401,
        code: "TOKEN_INVALID",
        message: "Invalid refresh token",
        details: {},
      })
    );
  }

  const userId = payload.sub;
  const jti = payload.jti;

  // Redis에 존재해야 유효(= 서버가 발급한 refresh)
  const ok = await existsRefreshToken({ userId, jti });
  if (!ok) {
    return res.status(401).json(
      toErrorResponse({
        path: req.originalUrl,
        status: 401,
        code: "TOKEN_REVOKED",
        message: "Refresh token revoked",
        details: {},
      })
    );
  }

  // ✅ 회전: 기존 refresh 폐기 + 새 refresh 발급/저장
  await deleteRefreshToken({ userId, jti });

  const newAccessToken = signAccessToken({ sub: userId, role: payload.role });
  const { token: newRefreshToken, jti: newJti } = signRefreshToken({ sub: userId, role: payload.role });

  const ttlSeconds = parseExpiresToSeconds(process.env.JWT_REFRESH_EXPIRES_IN || "7d");
  await saveRefreshToken({ userId, jti: newJti, ttlSeconds });

  return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

authRouter.post("/logout", async (req, res) => {
  const { refreshToken } = req.body ?? {};
  if (!refreshToken) return res.status(204).send();

  try {
    const payload = verifyRefreshToken(refreshToken);
    await deleteRefreshToken({ userId: payload.sub, jti: payload.jti });
  } catch (e) {
    // 이미 만료/무효여도 로그아웃은 성공 처리(UX 좋음)
  }

  return res.status(204).send();
});

module.exports = { authRouter };
