// src/modules/animals/animals.routes.js

const express = require("express");


const { requireAuth } = require("../../common/middleware/requireAuth");

const { toErrorResponse } = require("../../common/middleware/errorHandler");
const { toPageResponse } = require("../../common/pageResponse");

const repo = require("./animals.repo");
const service = require("./animals.service");
const { ANIMAL_ERRORS } = require("./animals.errors");
const {
  validateCreate,
  validateUpdate,
  validateStatus,
  validateNeutered,
  parseListQuery,
} = require("./animals.validators");

const animalsRouter = express.Router();

// PR1 ping 유지해도 됨
animalsRouter.get("/__ping", (req, res) => res.json({ ok: true, module: "animals" }));

// Create
animalsRouter.post("/", async (req, res) => {
  const errors = validateCreate(req.body);
  if (errors) {
    return res.status(ANIMAL_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ANIMAL_ERRORS.VALIDATION.status,
        code: ANIMAL_ERRORS.VALIDATION.code,
        message: ANIMAL_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  const created = await repo.createAnimal({
    ...req.body,
    intakeDate: new Date(req.body.intakeDate),
  });

  return res.status(201).json(created);
});

// Get One
animalsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(ANIMAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ANIMAL_ERRORS.INVALID_QUERY.status,
        code: ANIMAL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    const animal = await service.getOne(id);
    return res.json(animal);
  } catch (e) {
    const err = e.status ? e : ANIMAL_ERRORS.NOT_FOUND;
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

// List (filter/search/sort/page)
animalsRouter.get("/", requireAuth, async (req, res) => {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(ANIMAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ANIMAL_ERRORS.INVALID_QUERY.status,
        code: ANIMAL_ERRORS.INVALID_QUERY.code,
        message: ANIMAL_ERRORS.INVALID_QUERY.message,
        details: parsed.error,
      })
    );
  }

  const { species, neutered, status, keyword, from, to, page, size, sortField, sortDir, sort } =
    parsed.value;

  const where = {
    ...(species ? { species } : {}),
    ...(neutered !== undefined ? { neutered } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          intakeDate: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { breed: { contains: keyword } },
          ],
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

// Update
animalsRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(ANIMAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ANIMAL_ERRORS.INVALID_QUERY.status,
        code: ANIMAL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  const errors = validateUpdate(req.body);
  if (errors) {
    return res.status(ANIMAL_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ANIMAL_ERRORS.VALIDATION.status,
        code: ANIMAL_ERRORS.VALIDATION.code,
        message: ANIMAL_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    const updated = await service.update(id, req.body);
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : ANIMAL_ERRORS.NOT_FOUND;
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

// Delete (권한은 B가 ADMIN으로 감쌀 예정)
animalsRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(ANIMAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ANIMAL_ERRORS.INVALID_QUERY.status,
        code: ANIMAL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    await service.remove(id);
    return res.status(204).send();
  } catch (e) {
    const err = e.status ? e : ANIMAL_ERRORS.NOT_FOUND;
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

// Update status (ADMIN 예정)
animalsRouter.patch("/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const errors = validateStatus(req.body);
  if (!Number.isInteger(id) || errors) {
    return res.status(ANIMAL_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ANIMAL_ERRORS.VALIDATION.status,
        code: ANIMAL_ERRORS.VALIDATION.code,
        message: ANIMAL_ERRORS.VALIDATION.message,
        details: { ...(Number.isInteger(id) ? {} : { id: "id must be integer" }), ...(errors ?? {}) },
      })
    );
  }

  try {
    const updated = await service.update(id, { status: req.body.status });
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : ANIMAL_ERRORS.NOT_FOUND;
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

// Update neutered
animalsRouter.patch("/:id/neutered", async (req, res) => {
  const id = Number(req.params.id);
  const errors = validateNeutered(req.body);
  if (!Number.isInteger(id) || errors) {
    return res.status(ANIMAL_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: ANIMAL_ERRORS.VALIDATION.status,
        code: ANIMAL_ERRORS.VALIDATION.code,
        message: ANIMAL_ERRORS.VALIDATION.message,
        details: { ...(Number.isInteger(id) ? {} : { id: "id must be integer" }), ...(errors ?? {}) },
      })
    );
  }

  try {
    const updated = await service.update(id, { neutered: !!req.body.neutered });
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : ANIMAL_ERRORS.NOT_FOUND;
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

module.exports = { animalsRouter };
