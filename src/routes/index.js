// src/routes/index.js

const express = require("express");
const router = express.Router();

// /health
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ✅ modules (정확한 경로)
const { animalsRouter } = require("../modules/animals/animals.routes.js");
const { medicalRouter } = require("../modules/medical/medical.routes.js");
const { adoptionsRouter } = require("../modules/adoptions/adoptions.routes.js");
const { donationsRouter } = require("../modules/donations/donations.routes.js");
const { volunteersRouter } = require("../modules/volunteers/volunteers.routes.js");
const { statsRouter } = require("../modules/stats/stats.routes.js");

// API prefix
router.use("/api/animals", animalsRouter);
router.use("/api/medical", medicalRouter);
router.use("/api/adoptions", adoptionsRouter);
router.use("/api/donations", donationsRouter);
router.use("/api/volunteers", volunteersRouter);
router.use("/api/stats", statsRouter);

module.exports = router;
