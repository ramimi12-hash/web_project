const { verifyAccessToken } = require("../../jwt");

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Authorization token required",
    });
  }

  const token = auth.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { userId, role, ... }
    return next();
  } catch (e) {
    return res.status(401).json({
      code: "TOKEN_EXPIRED",
      message: "Invalid or expired token",
    });
  }
}

module.exports = { requireAuth };
