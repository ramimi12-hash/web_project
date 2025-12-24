// src/modules/donations/donations.routes.js
const express = require("express");

const donationsRouter = express.Router();

donationsRouter.get("/__ping", (req, res) => {
  res.json({ ok: true, module: "donations" });
});

module.exports = { donationsRouter };
