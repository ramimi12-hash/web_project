const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const { notFound } = require("./common/middleware/notFound");
const { errorHandler } = require("./common/middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", routes);     // ✅ 여기서 /api 붙임
app.use("/health", require("./routes/health.route")); // ✅ /health는 별도로

app.use(notFound);
app.use(errorHandler);

module.exports = app;
