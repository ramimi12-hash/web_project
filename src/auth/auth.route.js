// src/common/auth/auth.route.js
const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");

router.post("/login", controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/google/start", controller.googleStart);
router.get("/google/callback", controller.googleCallback);

module.exports = router;

