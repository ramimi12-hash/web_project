// src/common/auth/auth.controller.js
const service = require("./auth.service");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await service.login(email, password);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await service.refreshTokens(refreshToken);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    await service.logout(refreshToken);
    return res.json({ message: "LOGGED_OUT" });
  } catch (e) {
    return next(e);
  }
}

async function googleStart(req, res, next) {
  try {
    const url = await service.getGoogleAuthUrl();
    return res.redirect(url);
  } catch (e) {
    next(e);
  }
}

async function googleCallback(req, res, next) {
  try {
    const { code } = req.query;
    const result = await service.googleLoginCallback(code);

    // 선택1) JSON으로 토큰 반환(백엔드만으로 테스트 쉬움)
    return res.json(result);

    // 선택2) 프론트로 redirect 하면서 토큰 전달(실서비스형)
    // return res.redirect(`https://frontend.../oauth?accessToken=${result.accessToken}`);
  } catch (e) {
    next(e);
  }
}

module.exports = { login, refresh, logout, googleStart, googleCallback };
