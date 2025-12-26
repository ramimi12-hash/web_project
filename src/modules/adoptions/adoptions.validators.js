const ALLOWED_STATUS = new Set(["REQUESTED", "APPROVED", "CONFIRMED", "CANCELED"]);
const ALLOWED_SORT_FIELDS = new Set(["requestedAt", "approvedAt", "adoptedAt", "createdAt"]);

function validateCreate(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  const animalId = Number(body.animalId);
  if (!Number.isInteger(animalId)) errors.animalId = "animalId must be integer";

  if (!body.applicantName) errors.applicantName = "applicantName is required";
  if (body.applicantName && String(body.applicantName).length > 50) errors.applicantName = "max 50 chars";

  if (body.applicantPhone && String(body.applicantPhone).length > 20) errors.applicantPhone = "max 20 chars";

  return Object.keys(errors).length ? errors : null;
}

function validateConfirm(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  if (!body.adoptedAt) errors.adoptedAt = "adoptedAt is required (ISO string)";
  else {
    const d = new Date(body.adoptedAt);
    if (isNaN(d.getTime())) errors.adoptedAt = "adoptedAt must be ISO date";
  }

  return Object.keys(errors).length ? errors : null;
}

function validateCancel(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };
  if (body.cancelReason && String(body.cancelReason).length > 255) errors.cancelReason = "max 255 chars";
  return Object.keys(errors).length ? errors : null;
}

function parseListQuery(query) {
  const status = query.status ? String(query.status) : undefined;
  if (status && !ALLOWED_STATUS.has(status)) return { error: { status: "invalid status enum" } };

  const animalId = query.animalId ? Number(query.animalId) : undefined;
  if (query.animalId && !Number.isInteger(animalId)) return { error: { animalId: "animalId must be integer" } };

  const keyword = query.keyword ? String(query.keyword).trim() : undefined;

  const from = query.from ? new Date(String(query.from)) : undefined;
  const to = query.to ? new Date(String(query.to)) : undefined;
  if (query.from && isNaN(from.getTime())) return { error: { from: "from must be ISO date" } };
  if (query.to && isNaN(to.getTime())) return { error: { to: "to must be ISO date" } };

  const page = Math.max(parseInt(query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(query.size ?? "20", 10), 1), 50);

  const sortRaw = query.sort ?? "requestedAt,DESC";
  const [field, dir] = String(sortRaw).split(",");
  const sortField = ALLOWED_SORT_FIELDS.has(field) ? field : "requestedAt";
  const sortDir = (dir ?? "DESC").toUpperCase() === "ASC" ? "asc" : "desc";
  const sort = `${sortField},${sortDir.toUpperCase()}`;

  return { value: { status, animalId, keyword, from, to, page, size, sortField, sortDir, sort } };
}

module.exports = { validateCreate, validateConfirm, validateCancel, parseListQuery };
