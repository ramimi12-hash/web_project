const express = require("express");
const { toErrorResponse } = require("../common/errorResponse");
const { ERROR_CODES } = require("../common/errorCodes");
const repo = require("./stats.repo");
const { parseRange } = require("./stats.validators");

const statsRouter = express.Router();

statsRouter.get("/__ping", (req, res) => res.json({ ok: true, module: "stats" }));

// GET /api/stats/donations/daily?from=&to=
statsRouter.get("/stats/donations/daily", async (req, res) => {
  const parsed = parseRange(req.query);
  if (parsed.error) {
    return res.status(400).json(
      toErrorResponse({
        path: req.originalUrl,
        status: 400,
        code: ERROR_CODES.INVALID_QUERY_PARAM,
        message: "invalid query",
        details: parsed.error,
      })
    );
  }

  const { from, to } = parsed.value;
  const rows = await repo.donationsDaily({ from, to });

  return res.json({ from, to, rows });
});

// GET /api/stats/donations/monthly?from=&to=
statsRouter.get("/stats/donations/monthly", async (req, res) => {
  const parsed = parseRange(req.query);
  if (parsed.error) {
    return res.status(400).json(
      toErrorResponse({
        path: req.originalUrl,
        status: 400,
        code: ERROR_CODES.INVALID_QUERY_PARAM,
        message: "invalid query",
        details: parsed.error,
      })
    );
  }

  const { from, to } = parsed.value;
  const rows = await repo.donationsMonthly({ from, to });

  return res.json({ from, to, rows });
});

// GET /api/stats/donations/top-donors?from=&to=&limit=
statsRouter.get("/stats/donations/top-donors", async (req, res) => {
  const parsed = parseRange(req.query);
  if (parsed.error) {
    return res.status(400).json(
      toErrorResponse({
        path: req.originalUrl,
        status: 400,
        code: ERROR_CODES.INVALID_QUERY_PARAM,
        message: "invalid query",
        details: parsed.error,
      })
    );
  }

  const { from, to, limit } = parsed.value;
  const rows = await repo.topDonors({ from, to, limit });

  return res.json({ from, to, limit, rows });
});

module.exports = { statsRouter };
