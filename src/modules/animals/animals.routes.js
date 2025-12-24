// src/modules/animals/animals.routes.js
const express = require("express");

const animalsRouter = express.Router();

animalsRouter.get("/__ping", (req, res) => {
  res.json({ ok: true, module: "animals" });
});

module.exports = { animalsRouter };
