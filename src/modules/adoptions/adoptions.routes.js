const express = require("express");
const { toErrorResponse } = require("../common/errorResponse");
const { toPageResponse } = require("../common/pageResponse");
const { ADOPTION_ERRORS } = require("./adoptions.errors");
const service = require("./adoptions.service");
const repo = require("./adoptions.repo");
const { validateCreate, validateConfirm, validateCancel, parseListQuery } = require("./adoptions.validators");

const adoptionsRouter = express.Router();

// PR1 ping 유지
adoptionsRouter.get("/__ping", (req, res) => res.json({ ok: true, module: "adoptions" }));

// POST /api/adoptions
adoptionsRouter.post("/adoptions", async (req, res) => {
  const errors = validateCreate(req.body);
  if (errors) {
    return res.status(ADOPTION_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.VALIDATION.status,
        code: ADOPTION_ERRORS.VALIDATION.code,
        message: ADOPTION_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    const created = await service.create({
      animalId: Number(req.body.animalId),
      applicantName: req.body.applicantName,
      applicantPhone: req.body.applicantPhone,
    });
    return res.status(201).json(created);
  } catch (e) {
    const err = e.status ? e : ADOPTION_ERRORS.STATE_CONFLICT;
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

// GET /api/adoptions/:id
adoptionsRouter.get("/adoptions/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(ADOPTION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.INVALID_QUERY.status,
        code: ADOPTION_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    const one = await service.getOne(id);
    return res.json(one);
  } catch (e) {
    const err = e.status ? e : ADOPTION_ERRORS.NOT_FOUND;
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

// GET /api/adoptions (list)
adoptionsRouter.get("/adoptions", async (req, res) => {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(ADOPTION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.INVALID_QUERY.status,
        code: ADOPTION_ERRORS.INVALID_QUERY.code,
        message: ADOPTION_ERRORS.INVALID_QUERY.message,
        details: parsed.error,
      })
    );
  }

  const { status, animalId, keyword, from, to, page, size, sortField, sortDir, sort } = parsed.value;

  const where = {
    ...(status ? { status } : {}),
    ...(animalId ? { animalId } : {}),
    ...(from || to
      ? {
          requestedAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(keyword
      ? {
          applicantName: { contains: keyword },
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

// GET /api/adoptions/pending  (ADMIN 예정)
adoptionsRouter.get("/adoptions/pending", async (req, res) => {
  const page = Math.max(parseInt(req.query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(req.query.size ?? "20", 10), 1), 50);

  const orderBy = { requestedAt: "desc" };
  const skip = page * size;
  const take = size;

  const { content, totalElements } = await repo.list({
    where: { status: "REQUESTED" },
    orderBy,
    skip,
    take,
  });

  return res.json(
    toPageResponse({
      content,
      page,
      size,
      totalElements,
      sort: "requestedAt,DESC",
    })
  );
});

// GET /api/animals/:id/adoptions (동물별 이력)
adoptionsRouter.get("/animals/:id/adoptions", async (req, res) => {
  const animalId = Number(req.params.id);
  if (!Number.isInteger(animalId)) {
    return res.status(ADOPTION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.INVALID_QUERY.status,
        code: ADOPTION_ERRORS.INVALID_QUERY.code,
        message: "animalId must be integer",
        details: { id: req.params.id },
      })
    );
  }

  // 페이지네이션 최소 적용
  const page = Math.max(parseInt(req.query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(req.query.size ?? "20", 10), 1), 50);

  const orderBy = { requestedAt: "desc" };
  const skip = page * size;
  const take = size;

  // 동물 존재 확인(없으면 404)
  const animal = await repo.findAnimal(animalId);
  if (!animal) {
    return res.status(ADOPTION_ERRORS.ANIMAL_NOT_FOUND.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.ANIMAL_NOT_FOUND.status,
        code: ADOPTION_ERRORS.ANIMAL_NOT_FOUND.code,
        message: ADOPTION_ERRORS.ANIMAL_NOT_FOUND.message,
        details: { animalId },
      })
    );
  }

  const { content, totalElements } = await repo.listByAnimal(animalId, { orderBy, skip, take });

  return res.json(
    toPageResponse({
      content,
      page,
      size,
      totalElements,
      sort: "requestedAt,DESC",
    })
  );
});

// PATCH /api/adoptions/:id/approve (ADMIN 예정)
adoptionsRouter.patch("/adoptions/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(ADOPTION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.INVALID_QUERY.status,
        code: ADOPTION_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    const updated = await service.approve(id);
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : ADOPTION_ERRORS.STATE_CONFLICT;
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

// PATCH /api/adoptions/:id/confirm (ADMIN 예정)
adoptionsRouter.patch("/adoptions/:id/confirm", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(ADOPTION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.INVALID_QUERY.status,
        code: ADOPTION_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  const errors = validateConfirm(req.body);
  if (errors) {
    return res.status(ADOPTION_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.VALIDATION.status,
        code: ADOPTION_ERRORS.VALIDATION.code,
        message: ADOPTION_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    const adoptedAt = new Date(req.body.adoptedAt);
    const updated = await service.confirm(id, adoptedAt);
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : ADOPTION_ERRORS.STATE_CONFLICT;
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

// PATCH /api/adoptions/:id/cancel
adoptionsRouter.patch("/adoptions/:id/cancel", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(ADOPTION_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.INVALID_QUERY.status,
        code: ADOPTION_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  const errors = validateCancel(req.body);
  if (errors) {
    return res.status(ADOPTION_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ADOPTION_ERRORS.VALIDATION.status,
        code: ADOPTION_ERRORS.VALIDATION.code,
        message: ADOPTION_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    const updated = await service.cancel(id, req.body.cancelReason);
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : ADOPTION_ERRORS.STATE_CONFLICT;
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

module.exports = { adoptionsRouter };
