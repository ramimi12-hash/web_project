const express = require("express");
const { toErrorResponse } = require("../common/errorResponse");
const { toPageResponse } = require("../common/pageResponse");
const { MEDICAL_ERRORS } = require("./medical.errors");
const { validateCreate, validateUpdate, parseListQuery } = require("./medical.validators");
const repo = require("./medical.repo");
const service = require("./medical.service");

const medicalRouter = express.Router();

// PR1 ping 유지
medicalRouter.get("/__ping", (req, res) => res.json({ ok: true, module: "medical" }));

// 1) 동물별 의료기록 생성 (sub-resource)
// POST /api/animals/:id/medical-records  -> (B가 라우팅에서 /api/animals에 medicalRouter를 합치거나, 여기서 경로를 그대로 받는 방식 중 하나)
// A는 Router 내부 경로를 "상대경로"로 작성하고, B가 app에서 마운트 경로를 선택하도록 하면 됨.
// 여기서는 "animals sub-resource"를 그대로 경로로 둠:
medicalRouter.post("/animals/:id/medical-records", async (req, res) => {
  const animalId = Number(req.params.id);
  if (!Number.isInteger(animalId)) {
    return res.status(MEDICAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.INVALID_QUERY.status,
        code: MEDICAL_ERRORS.INVALID_QUERY.code,
        message: "animalId must be integer",
        details: { id: req.params.id },
      })
    );
  }

  const errors = validateCreate(req.body);
  if (errors) {
    return res.status(MEDICAL_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.VALIDATION.status,
        code: MEDICAL_ERRORS.VALIDATION.code,
        message: MEDICAL_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    await service.ensureAnimal(animalId);

    const created = await repo.createRecord({
      animalId,
      type: req.body.type,
      description: req.body.description ?? null,
      performedAt: new Date(req.body.performedAt),
      cost: req.body.cost != null ? Number(req.body.cost) : null,
    });

    return res.status(201).json(created);
  } catch (e) {
    const err = e.status ? e : MEDICAL_ERRORS.ANIMAL_NOT_FOUND;
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

// 2) 동물별 의료기록 목록
// GET /api/animals/:id/medical-records?page=&size=&sort=performedAt,DESC
medicalRouter.get("/animals/:id/medical-records", async (req, res) => {
  const animalId = Number(req.params.id);
  if (!Number.isInteger(animalId)) {
    return res.status(MEDICAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.INVALID_QUERY.status,
        code: MEDICAL_ERRORS.INVALID_QUERY.code,
        message: "animalId must be integer",
        details: { id: req.params.id },
      })
    );
  }

  // list query 공통 규격 일부만 사용(간단)
  const page = Math.max(parseInt(req.query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(req.query.size ?? "20", 10), 1), 50);

  const sortRaw = req.query.sort ?? "performedAt,DESC";
  const [field, dir] = String(sortRaw).split(",");
  const sortField = field === "performedAt" ? "performedAt" : "performedAt";
  const sortDir = (dir ?? "DESC").toUpperCase() === "ASC" ? "asc" : "desc";
  const sort = `${sortField},${sortDir.toUpperCase()}`;

  try {
    await service.ensureAnimal(animalId);

    const orderBy = { [sortField]: sortDir };
    const skip = page * size;
    const take = size;

    const { content, totalElements } = await repo.listByAnimal({ animalId, orderBy, skip, take });

    return res.json(
      toPageResponse({
        content,
        page,
        size,
        totalElements,
        sort,
      })
    );
  } catch (e) {
    const err = e.status ? e : MEDICAL_ERRORS.ANIMAL_NOT_FOUND;
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

// 3) 의료기록 단건 조회
medicalRouter.get("/medical-records/:recordId", async (req, res) => {
  const recordId = Number(req.params.recordId);
  if (!Number.isInteger(recordId)) {
    return res.status(MEDICAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.INVALID_QUERY.status,
        code: MEDICAL_ERRORS.INVALID_QUERY.code,
        message: "recordId must be integer",
        details: { recordId: req.params.recordId },
      })
    );
  }

  try {
    const rec = await service.getRecord(recordId);
    return res.json(rec);
  } catch (e) {
    const err = e.status ? e : MEDICAL_ERRORS.RECORD_NOT_FOUND;
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

// 4) 의료기록 수정
medicalRouter.patch("/medical-records/:recordId", async (req, res) => {
  const recordId = Number(req.params.recordId);
  if (!Number.isInteger(recordId)) {
    return res.status(MEDICAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.INVALID_QUERY.status,
        code: MEDICAL_ERRORS.INVALID_QUERY.code,
        message: "recordId must be integer",
        details: { recordId: req.params.recordId },
      })
    );
  }

  const errors = validateUpdate(req.body);
  if (errors) {
    return res.status(MEDICAL_ERRORS.VALIDATION.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.VALIDATION.status,
        code: MEDICAL_ERRORS.VALIDATION.code,
        message: MEDICAL_ERRORS.VALIDATION.message,
        details: errors,
      })
    );
  }

  try {
    await service.getRecord(recordId); // 404 보장
    const updated = await repo.updateRecord(recordId, {
      ...(req.body.type ? { type: req.body.type } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      ...(req.body.performedAt ? { performedAt: new Date(req.body.performedAt) } : {}),
      ...(req.body.cost !== undefined
        ? { cost: req.body.cost != null ? Number(req.body.cost) : null }
        : {}),
    });
    return res.json(updated);
  } catch (e) {
    const err = e.status ? e : MEDICAL_ERRORS.RECORD_NOT_FOUND;
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

// 5) 의료기록 삭제(ADMIN 예정)
medicalRouter.delete("/medical-records/:recordId", async (req, res) => {
  const recordId = Number(req.params.recordId);
  if (!Number.isInteger(recordId)) {
    return res.status(MEDICAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.INVALID_QUERY.status,
        code: MEDICAL_ERRORS.INVALID_QUERY.code,
        message: "recordId must be integer",
        details: { recordId: req.params.recordId },
      })
    );
  }

  try {
    await service.getRecord(recordId);
    await repo.deleteRecord(recordId);
    return res.status(204).send();
  } catch (e) {
    const err = e.status ? e : MEDICAL_ERRORS.RECORD_NOT_FOUND;
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

// 6) 전체 의료기록 목록(기간/type/페이지)
medicalRouter.get("/medical-records", async (req, res) => {
  const parsed = parseListQuery(req.query);
  if (parsed.error) {
    return res.status(MEDICAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.INVALID_QUERY.status,
        code: MEDICAL_ERRORS.INVALID_QUERY.code,
        message: MEDICAL_ERRORS.INVALID_QUERY.message,
        details: parsed.error,
      })
    );
  }

  const { type, from, to, page, size, sortField, sortDir, sort } = parsed.value;

  const where = {
    ...(type ? { type } : {}),
    ...(from || to
      ? {
          performedAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const orderBy = { [sortField]: sortDir };
  const skip = page * size;
  const take = size;

  const { content, totalElements } = await repo.listAll({ where, orderBy, skip, take });

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

// 7) (선택) 동물별 요약
medicalRouter.get("/animals/:id/medical-summary", async (req, res) => {
  const animalId = Number(req.params.id);
  const limit = Math.min(Math.max(parseInt(req.query.limit ?? "5", 10), 1), 20);

  if (!Number.isInteger(animalId)) {
    return res.status(MEDICAL_ERRORS.INVALID_QUERY.status).json(
      toErrorResponse({
        path: req.originalUrl,
        status: MEDICAL_ERRORS.INVALID_QUERY.status,
        code: MEDICAL_ERRORS.INVALID_QUERY.code,
        message: "animalId must be integer",
        details: { id: req.params.id },
      })
    );
  }

  try {
    await service.ensureAnimal(animalId);
    const recent = await repo.recentSummary(animalId, limit);
    return res.json({ animalId, limit, recent });
  } catch (e) {
    const err = e.status ? e : MEDICAL_ERRORS.ANIMAL_NOT_FOUND;
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

module.exports = { medicalRouter };
