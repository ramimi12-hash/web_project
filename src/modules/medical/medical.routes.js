// src/modules/medical/medical.routes.js
const express = require("express");

const medicalRouter = express.Router();

medicalRouter.get("/__ping", (req, res) => {
  res.json({ ok: true, module: "medical" });
});

module.exports = { medicalRouter };
