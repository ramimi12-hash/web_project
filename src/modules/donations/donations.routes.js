const express = require("express");
const { toErrorResponse } = require("../common/errorResponse");
const { toPageResponse } = require("../common/pageResponse");
const { DONATION_ERRORS } = require("./donations.errors");
const repo = require("./donations.repo");
const service = require("./donations.service");
const { validateCreate, validateUpdate, validateReceipt, parseListQuery } = require("./donations.validators");

const donationsRouter = express.Router();

donationsRouter.get("/__ping", (req, res) => res.json({ ok: true, module: "donations" }));

// POST /api/donations
donationsRouter.post("/donations", async (req, res) => {
  const errors = validateCreate(req.body);
  if (errors) {
    return res.status(DONATION_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: DONATION_ERRORS.VALIDATION.status,
        code: DONATION_ERRORS.VALIDATION.code,
        message: DONATION_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  const created = await repo.createDonation({
    donorName: req.body.donorName,
    donorContact: req.body.donorContact ?? null,
    amount: Number(req.body.amount),
    donatedAt: new Date(req.body.donatedAt),
    receiptIssued: req.body.receiptIssued === undefined ? false : !!req.body.receiptIssued,
  });

  return res.status(201).json(created);
});

// GET /api/donations/:id
donationsRouter.get("/donations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(DONATION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: DONATION_ERRORS.INVALID_QUERY.status,
        code: DONATION_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    const one = await service.getOne(id);
    return res.json(one);
  } catch (e) {
    const err = e.status ? e : DONATION_ERRORS.NOT_FOUND;
    return res.status(err.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: err.status,
        code: err.code,
        message: err.message,
        details: e.details ?? null,
      })
    );
  }
});

// GET /api/donations (list)
donationsRouter.get("/donations", async (req, res) => {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(DONATION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: DONATION_ERRORS.INVALID_QUERY.status,
        code: DONATION_ERRORS.INVALID_QUERY.code,
        message: DONATION_ERRORS.INVALID_QUERY.message,
        details: parsed.error,
      })
    );
  }

  const { keyword, receiptIssued, minAmount, maxAmount, from, to, page, size, sortField, sortDir, sort } = parsed.value;

  const where = {
    ...(keyword ? { donorName: { contains: keyword } } : {}),
    ...(receiptIssued !== undefined ? { receiptIssued } : {}),
    ...(minAmount !== undefined || maxAmount !== undefined
      ? {
          amount: {
            ...(minAmount !== undefined ? { gte: minAmount } : {}),
            ...(maxAmount !== undefined ? { lte: maxAmount } : {}),
          },
        }
      : {}),
    ...(from || to
      ? {
          donatedAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const orderBy = { [sortField]: sortDir };
  const skip = page * size;
  const take = size;

  const { content, totalElements } = await repo.list({ where, orderBy, skip, take });

  return res.json(
    toPageResponse({
      content,
      page,
      size,
      totalElements,
      sort,
    })
  );
});

// PATCH /api/donations/:id
donationsRouter.patch("/donations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(DONATION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: DONATION_ERRORS.INVALID_QUERY.status,
        code: DONATION_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  const errors = validateUpdate(req.body);
  if (errors) {
    return res.status(DONATION_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: DONATION_ERRORS.VALIDATION.status,
        code: DONATION_ERRORS.VALIDATION.code,
        message: DONATION_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    const updated = await service.update(id, {
      ...(req.body.donorName !== undefined ? { donorName: req.body.donorName } : {}),
      ...(req.body.donorContact !== undefined ? { donorContact: req.body.donorContact } : {}),
      ...(req.body.amount !== undefined ? { amount: Number(req.body.amount) } : {}),
      ...(req.body.donatedAt !== undefined ? { donatedAt: new Date(req.body.donatedAt) } : {}),
      ...(req.body.receiptIssued !== undefined ? { receiptIssued: !!req.body.receiptIssued } : {}),
    });
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : DONATION_ERRORS.NOT_FOUND;
    return res.status(err.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: err.status,
        code: err.code,
        message: err.message,
        details: e.details ?? null,
      })
    );
  }
});

// PATCH /api/donations/:id/receipt
donationsRouter.patch("/donations/:id/receipt", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(DONATION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: DONATION_ERRORS.INVALID_QUERY.status,
        code: DONATION_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  const errors = validateReceipt(req.body);
  if (errors) {
    return res.status(DONATION_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: DONATION_ERRORS.VALIDATION.status,
        code: DONATION_ERRORS.VALIDATION.code,
        message: DONATION_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    const updated = await service.update(id, { receiptIssued: !!req.body.receiptIssued });
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : DONATION_ERRORS.NOT_FOUND;
    return res.status(err.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: err.status,
        code: err.code,
        message: err.message,
        details: e.details ?? null,
      })
    );
  }
});

// DELETE /api/donations/:id
donationsRouter.delete("/donations/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(DONATION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: DONATION_ERRORS.INVALID_QUERY.status,
        code: DONATION_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    await service.remove(id);
    return res.status(204).send();
  } catch (e) {
    const err = e.status ? e : DONATION_ERRORS.NOT_FOUND;
    return res.status(err.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: err.status,
        code: err.code,
        message: err.message,
        details: e.details ?? null,
      })
    );
  }
});

module.exports = { donationsRouter };
