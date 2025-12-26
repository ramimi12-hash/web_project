// src/app.js
const express = require("express");
const cors = require("cors");

const routes = require("./routes"); // routes/index.js
const { notFound } = require("./common/middleware/notFound");
const { errorHandler } = require("./common/middleware/errorHandler");

const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");

const app = express();

const openApiPath = path.join(__dirname, "..", "docs", "openapi.yaml");
const openApiDoc = YAML.parse(fs.readFileSync(openApiPath, "utf8"));

// ✅ 배포 서버에서도 Try it out 정상 동작하도록 servers 덮어쓰기(권장)
openApiDoc.servers = [
  { url: "http://113.198.66.68:10207", description: "prod" },
  { url: "http://localhost:8080", description: "local" },
];

app.use(cors());
app.use(express.json());

// ✅ 1) docs 폴더 정적 서빙: /docs/openapi.yaml 접근 가능
app.use("/docs", express.static(path.join(__dirname, "..", "docs")));

// ✅ 2) Swagger UI (notFound 전에 등록해야 함!)
app.use("/swagger-ui", swaggerUi.serve, swaggerUi.setup(openApiDoc));

// 라우터
app.use(routes);

// 404
app.use(notFound);

// 에러 핸들러 (반드시 맨 아래)
app.use(errorHandler);

module.exports = app;
