// src/modules/animals/animals.validators.js
const ALLOWED_STATUS = new Set(["SHELTERED", "TEMP_FOSTER", "ADOPTED", "DECEASED"]);
const ALLOWED_SEX = new Set(["M", "F", "UNKNOWN"]);
const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "intakeDate",
  "updatedAt",
  "ageYears",
  "species",
  "status",
]);

function toBool(v) {
  if (v === undefined) return undefined;
  if (v === "true" || v === true) return true;
  if (v === "false" || v === false) return false;
  return null;
}

function validateCreate(body) {
  const errors = {};

  if (!body || typeof body !== "object") errors.body = "body is required";
  if (!body?.species) errors.species = "species is required";
  if (body?.sex && !ALLOWED_SEX.has(body.sex)) errors.sex = "sex must be M|F|UNKNOWN";
  if (!body?.intakeDate) errors.intakeDate = "intakeDate is required (ISO string)";
  if (body?.status && !ALLOWED_STATUS.has(body.status)) errors.status = "invalid status enum";

  if (body?.ageYears != null) {
    const n = Number(body.ageYears);
    if (!Number.isInteger(n) || n < 0 || n > 30) errors.ageYears = "ageYears must be 0~30";
  }

  return Object.keys(errors).length ? errors : null;
}

function validateUpdate(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  if (body.sex && !ALLOWED_SEX.has(body.sex)) errors.sex = "sex must be M|F|UNKNOWN";
  if (body.status && !ALLOWED_STATUS.has(body.status)) errors.status = "invalid status enum";

  if (body.ageYears != null) {
    const n = Number(body.ageYears);
    if (!Number.isInteger(n) || n < 0 || n > 30) errors.ageYears = "ageYears must be 0~30";
  }

  return Object.keys(errors).length ? errors : null;
}

function validateStatus(body) {
  const errors = {};
  if (!body?.status) errors.status = "status is required";
  if (body?.status && !ALLOWED_STATUS.has(body.status)) errors.status = "invalid status enum";
  return Object.keys(errors).length ? errors : null;
}

function validateNeutered(body) {
  const errors = {};
  const b = toBool(body?.neutered);
  if (b === null) errors.neutered = "neutered must be boolean";
  return Object.keys(errors).length ? errors : null;
}

function parseListQuery(query) {
  // filters
  const species = query.species ? String(query.species) : undefined;

  const neutered = query.neutered ? toBool(query.neutered) : undefined;
  if (query.neutered && neutered === null) return { error: { neutered: "neutered must be true/false" } };

  const status = query.status ? String(query.status) : undefined;
  if (status && !ALLOWED_STATUS.has(status)) return { error: { status: "invalid status enum" } };

  const keyword = query.keyword ? String(query.keyword).trim() : undefined;

  const from = query.from ? new Date(String(query.from)) : undefined;
  const to = query.to ? new Date(String(query.to)) : undefined;
  if (query.from && isNaN(from.getTime())) return { error: { from: "from must be ISO date" } };
  if (query.to && isNaN(to.getTime())) return { error: { to: "to must be ISO date" } };

  // pagination/sort
  const page = Math.max(parseInt(query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(query.size ?? "20", 10), 1), 50);

  const sortRaw = query.sort ?? "createdAt,DESC";
  const [field, dir] = String(sortRaw).split(",");
  const sortField = ALLOWED_SORT_FIELDS.has(field) ? field : "createdAt";
  const sortDir = (dir ?? "DESC").toUpperCase() === "ASC" ? "asc" : "desc";
  const sort = `${sortField},${sortDir.toUpperCase()}`;

  return {
    value: { species, neutered, status, keyword, from, to, page, size, sortField, sortDir, sort },
  };
}

module.exports = {
  validateCreate,
  validateUpdate,
  validateStatus,
  validateNeutered,
  parseListQuery,
};
