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

module.exports = { login };
