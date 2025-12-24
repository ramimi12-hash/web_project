// src/modules/stats/stats.routes.js
const express = require("express");

const statsRouter = express.Router();

statsRouter.get("/__ping", (req, res) => {
  res.json({ ok: true, module: "stats" });
});

module.exports = { statsRouter };
