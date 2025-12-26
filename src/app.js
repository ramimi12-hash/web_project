// src/app.js
const express = require("express");
const cors = require("cors");

const routes = require("./routes"); // routes/index.js
const { notFound } = require("./common/middleware/notFound");
const { errorHandler } = require("./common/middleware/errorHandler");

const app = express();

const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");

const openApiPath = path.join(__dirname, "..", "docs", "openapi.yaml");
const openApiDoc = YAML.parse(fs.readFileSync(openApiPath, "utf8"));

app.use(cors());
app.use(express.json());

// 라우터
app.use(routes);

// 404
app.use(notFound);

// Swagger UI

app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(openApiDoc));

// 에러 핸들러 (반드시 맨 아래)
app.use(errorHandler);

module.exports = app;
