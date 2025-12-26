const ALLOWED_STATUS = new Set(["PENDING", "APPROVED", "SUSPENDED"]);
const ALLOWED_SORT_FIELDS = new Set(["joinedAt", "createdAt", "name", "status"]);

function validateCreate(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  if (!body.name) errors.name = "name is required";
  if (body.name && String(body.name).length > 50) errors.name = "max 50 chars";

  if (body.phone && String(body.phone).length > 20) errors.phone = "max 20 chars";
  if (body.email && String(body.email).length > 100) errors.email = "max 100 chars";
  if (body.note && String(body.note).length > 255) errors.note = "max 255 chars";

  // status는 생성 시 기본 PENDING 권장(임의 입력 금지)
  if (body.status !== undefined) errors.status = "status cannot be set on create";

  return Object.keys(errors).length ? errors : null;
}

function validateUpdate(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  if (body.name !== undefined && String(body.name).length > 50) errors.name = "max 50 chars";
  if (body.phone !== undefined && String(body.phone).length > 20) errors.phone = "max 20 chars";
  if (body.email !== undefined && String(body.email).length > 100) errors.email = "max 100 chars";
  if (body.note !== undefined && String(body.note).length > 255) errors.note = "max 255 chars";

  // 일반 수정에서 status 변경 금지(approve/suspend/reinstate로만)
  if (body.status !== undefined) errors.status = "status cannot be updated here";

  return Object.keys(errors).length ? errors : null;
}

function parseListQuery(query) {
  const status = query.status ? String(query.status) : undefined;
  if (status && !ALLOWED_STATUS.has(status)) return { error: { status: "invalid status enum" } };

  const keyword = query.keyword ? String(query.keyword).trim() : undefined;

  const page = Math.max(parseInt(query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(query.size ?? "20", 10), 1), 50);

  const sortRaw = query.sort ?? "createdAt,DESC";
  const [field, dir] = String(sortRaw).split(",");
  const sortField = ALLOWED_SORT_FIELDS.has(field) ? field : "createdAt";
  const sortDir = (dir ?? "DESC").toUpperCase() === "ASC" ? "asc" : "desc";
  const sort = `${sortField},${sortDir.toUpperCase()}`;

  return { value: { status, keyword, page, size, sortField, sortDir, sort } };
}

module.exports = { validateCreate, validateUpdate, parseListQuery };
