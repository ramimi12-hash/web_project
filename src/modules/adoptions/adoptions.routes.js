// src/modules/adoptions/adoptions.routes.js
const express = require("express");

const adoptionsRouter = express.Router();

adoptionsRouter.get("/__ping", (req, res) => {
  res.json({ ok: true, module: "adoptions" });
});

module.exports = { adoptionsRouter };
