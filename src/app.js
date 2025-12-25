// src/app.js
const express = require("express");
const cors = require("cors");

const routes = require("./routes"); // routes/index.js
const { notFound } = require("./common/middleware/notFound");
const { errorHandler } = require("./common/middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// 라우터
app.use(routes);

// 404
app.use(notFound);

// 에러 핸들러 (반드시 맨 아래)
app.use(errorHandler);

module.exports = app;
