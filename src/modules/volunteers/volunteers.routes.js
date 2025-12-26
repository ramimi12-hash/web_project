const express = require("express");
const { toErrorResponse } = require("../common/errorResponse");
const { toPageResponse } = require("../common/pageResponse");
const { VOL_ERRORS } = require("./volunteers.errors");
const repo = require("./volunteers.repo");
const service = require("./volunteers.service");
const { validateCreate, validateUpdate, parseListQuery } = require("./volunteers.validators");

const volunteersRouter = express.Router();

volunteersRouter.get("/__ping", (req, res) => res.json({ ok: true, module: "volunteers" }));

// POST /api/volunteers (신청)
volunteersRouter.post("/volunteers", async (req, res) => {
  const errors = validateCreate(req.body);
  if (errors) {
    return res.status(VOL_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.VALIDATION.status,
        code: VOL_ERRORS.VALIDATION.code,
        message: VOL_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  const created = await repo.createVolunteer({
    name: req.body.name,
    phone: req.body.phone ?? null,
    email: req.body.email ?? null,
    note: req.body.note ?? null,
    status: "PENDING",
  });

  return res.status(201).json(created);
});

// GET /api/volunteers/:id
volunteersRouter.get("/volunteers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(VOL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.INVALID_QUERY.status,
        code: VOL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    const one = await service.getOne(id);
    return res.json(one);
  } catch (e) {
    const err = e.status ? e : VOL_ERRORS.NOT_FOUND;
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

// GET /api/volunteers (list)
volunteersRouter.get("/volunteers", async (req, res) => {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(VOL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.INVALID_QUERY.status,
        code: VOL_ERRORS.INVALID_QUERY.code,
        message: VOL_ERRORS.INVALID_QUERY.message,
        details: parsed.error,
      })
    );
  }

  const { status, keyword, page, size, sortField, sortDir, sort } = parsed.value;

  const where = {
    ...(status ? { status } : {}),
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { phone: { contains: keyword } },
            { email: { contains: keyword } },
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

// PATCH /api/volunteers/:id (일반 수정)
volunteersRouter.patch("/volunteers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(VOL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.INVALID_QUERY.status,
        code: VOL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  const errors = validateUpdate(req.body);
  if (errors) {
    return res.status(VOL_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.VALIDATION.status,
        code: VOL_ERRORS.VALIDATION.code,
        message: VOL_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    const updated = await service.update(id, {
      ...(req.body.name !== undefined ? { name: req.body.name } : {}),
      ...(req.body.phone !== undefined ? { phone: req.body.phone } : {}),
      ...(req.body.email !== undefined ? { email: req.body.email } : {}),
      ...(req.body.note !== undefined ? { note: req.body.note } : {}),
    });
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : VOL_ERRORS.NOT_FOUND;
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

// DELETE /api/volunteers/:id
volunteersRouter.delete("/volunteers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(VOL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.INVALID_QUERY.status,
        code: VOL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    await service.remove(id);
    return res.status(204).send();
  } catch (e) {
    const err = e.status ? e : VOL_ERRORS.NOT_FOUND;
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


// ====== ADMIN 전용(상태 전이) ======

// GET /api/volunteers/pending
volunteersRouter.get("/volunteers/pending", async (req, res) => {
  const page = Math.max(parseInt(req.query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(req.query.size ?? "20", 10), 1), 50);

  const { content, totalElements } = await repo.list({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    skip: page * size,
    take: size,
  });

  return res.json(
    toPageResponse({
      content,
      page,
      size,
      totalElements,
      sort: "createdAt,DESC",
    })
  );
});

// PATCH /api/volunteers/:id/approve
volunteersRouter.patch("/volunteers/:id/approve", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(VOL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.INVALID_QUERY.status,
        code: VOL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    const updated = await service.approve(id);
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : VOL_ERRORS.STATE_CONFLICT;
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

// PATCH /api/volunteers/:id/suspend
volunteersRouter.patch("/volunteers/:id/suspend", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(VOL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.INVALID_QUERY.status,
        code: VOL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    const updated = await service.suspend(id);
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : VOL_ERRORS.STATE_CONFLICT;
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

// PATCH /api/volunteers/:id/reinstate
volunteersRouter.patch("/volunteers/:id/reinstate", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(VOL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: VOL_ERRORS.INVALID_QUERY.status,
        code: VOL_ERRORS.INVALID_QUERY.code,
        message: "id must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    const updated = await service.reinstate(id);
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : VOL_ERRORS.STATE_CONFLICT;
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

// (선택) GET /api/stats/volunteers/status
volunteersRouter.get("/stats/volunteers/status", async (req, res) => {
  const rows = await repo.countByStatus();
  return res.json({ rows });
});

module.exports = { volunteersRouter };
