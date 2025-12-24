// src/app.js
const express = require("express");
const cors = require("cors");

const routes = require("./routes"); // routes/index.js
const { notFound } = require("./common/middleware/notFound");
const { errorHandler } = require("./common/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ 딱 1줄로 끝 (health + api 모두 포함)
app.use(routes);

// ✅ 반드시 맨 아래
app.use(notFound);
app.use(errorHandler);

module.exports = app;
