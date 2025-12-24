const ALLOWED_TYPE = new Set(["NEUTER", "SURGERY", "TREATMENT", "VACCINE"]);
const ALLOWED_SORT_FIELDS = new Set(["performedAt", "createdAt", "cost"]);

function validateCreate(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  if (!body.type) errors.type = "type is required";
  if (body.type && !ALLOWED_TYPE.has(body.type)) errors.type = "invalid type enum";

  if (!body.performedAt) errors.performedAt = "performedAt is required (ISO string)";
  else {
    const d = new Date(body.performedAt);
    if (isNaN(d.getTime())) errors.performedAt = "performedAt must be ISO date";
  }

  if (body.cost != null) {
    const n = Number(body.cost);
    if (!Number.isInteger(n) || n < 0 || n > 100000000) errors.cost = "cost must be integer >=0";
  }

  if (body.description != null && String(body.description).length > 255) {
    errors.description = "description max length is 255";
  }

  return Object.keys(errors).length ? errors : null;
}

function validateUpdate(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  if (body.type && !ALLOWED_TYPE.has(body.type)) errors.type = "invalid type enum";
  if (body.performedAt) {
    const d = new Date(body.performedAt);
    if (isNaN(d.getTime())) errors.performedAt = "performedAt must be ISO date";
  }
  if (body.cost != null) {
    const n = Number(body.cost);
    if (!Number.isInteger(n) || n < 0 || n > 100000000) errors.cost = "cost must be integer >=0";
  }
  if (body.description != null && String(body.description).length > 255) {
    errors.description = "description max length is 255";
  }

  return Object.keys(errors).length ? errors : null;
}

function parseListQuery(query) {
  const type = query.type ? String(query.type) : undefined;
  if (type && !ALLOWED_TYPE.has(type)) return { error: { type: "invalid type enum" } };

  const from = query.from ? new Date(String(query.from)) : undefined;
  const to = query.to ? new Date(String(query.to)) : undefined;
  if (query.from && isNaN(from.getTime())) return { error: { from: "from must be ISO date" } };
  if (query.to && isNaN(to.getTime())) return { error: { to: "to must be ISO date" } };

  const page = Math.max(parseInt(query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(query.size ?? "20", 10), 1), 50);

  const sortRaw = query.sort ?? "performedAt,DESC";
  const [field, dir] = String(sortRaw).split(",");
  const sortField = ALLOWED_SORT_FIELDS.has(field) ? field : "performedAt";
  const sortDir = (dir ?? "DESC").toUpperCase() === "ASC" ? "asc" : "desc";
  const sort = `${sortField},${sortDir.toUpperCase()}`;

  return { value: { type, from, to, page, size, sortField, sortDir, sort } };
}

module.exports = { validateCreate, validateUpdate, parseListQuery };
