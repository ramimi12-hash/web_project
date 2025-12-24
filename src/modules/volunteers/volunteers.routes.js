// src/modules/volunteers/volunteers.routes.js
const express = require("express");

const volunteersRouter = express.Router();

volunteersRouter.get("/__ping", (req, res) => {
  res.json({ ok: true, module: "volunteers" });
});

module.exports = { volunteersRouter };
