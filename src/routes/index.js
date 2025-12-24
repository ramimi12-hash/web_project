const express = require("express");
const router = express.Router();

router.use("/animals", require("./animals/animals.route"));
// 다른 리소스도 동일하게
// router.use("/adoptions", require("./adoptions/adoptions.route"));

module.exports = router;
