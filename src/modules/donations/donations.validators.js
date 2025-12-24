const ALLOWED_SORT_FIELDS = new Set(["donatedAt", "amount", "createdAt"]);

function toBool(v) {
  if (v === undefined) return undefined;
  if (v === "true" || v === true) return true;
  if (v === "false" || v === false) return false;
  return null;
}

function validateCreate(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  if (!body.donorName) errors.donorName = "donorName is required";
  if (body.donorName && String(body.donorName).length > 50) errors.donorName = "max 50 chars";

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) errors.amount = "amount must be integer > 0";

  if (!body.donatedAt) errors.donatedAt = "donatedAt is required (ISO string)";
  else {
    const d = new Date(body.donatedAt);
    if (isNaN(d.getTime())) errors.donatedAt = "donatedAt must be ISO date";
  }

  const receipt = body.receiptIssued;
  if (receipt !== undefined) {
    const b = toBool(receipt);
    if (b === null) errors.receiptIssued = "receiptIssued must be boolean";
  }

  if (body.donorContact && String(body.donorContact).length > 50) errors.donorContact = "max 50 chars";

  return Object.keys(errors).length ? errors : null;
}

function validateUpdate(body) {
  const errors = {};
  if (!body || typeof body !== "object") return { body: "body is required" };

  if (body.donorName && String(body.donorName).length > 50) errors.donorName = "max 50 chars";
  if (body.donorContact && String(body.donorContact).length > 50) errors.donorContact = "max 50 chars";

  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount <= 0) errors.amount = "amount must be integer > 0";
  }

  if (body.donatedAt !== undefined) {
    const d = new Date(body.donatedAt);
    if (isNaN(d.getTime())) errors.donatedAt = "donatedAt must be ISO date";
  }

  if (body.receiptIssued !== undefined) {
    const b = toBool(body.receiptIssued);
    if (b === null) errors.receiptIssued = "receiptIssued must be boolean";
  }

  return Object.keys(errors).length ? errors : null;
}

function validateReceipt(body) {
  const errors = {};
  const b = toBool(body?.receiptIssued);
  if (b === null || b === undefined) errors.receiptIssued = "receiptIssued is required boolean";
  return Object.keys(errors).length ? errors : null;
}

function parseListQuery(query) {
  const keyword = query.keyword ? String(query.keyword).trim() : undefined;

  const receiptIssued = query.receiptIssued ? toBool(query.receiptIssued) : undefined;
  if (query.receiptIssued && receiptIssued === null) return { error: { receiptIssued: "true/false only" } };

  const minAmount = query.minAmount !== undefined ? Number(query.minAmount) : undefined;
  if (query.minAmount !== undefined && (!Number.isInteger(minAmount) || minAmount < 0))
    return { error: { minAmount: "minAmount must be integer >= 0" } };

  const maxAmount = query.maxAmount !== undefined ? Number(query.maxAmount) : undefined;
  if (query.maxAmount !== undefined && (!Number.isInteger(maxAmount) || maxAmount < 0))
    return { error: { maxAmount: "maxAmount must be integer >= 0" } };

  const from = query.from ? new Date(String(query.from)) : undefined;
  const to = query.to ? new Date(String(query.to)) : undefined;
  if (query.from && isNaN(from.getTime())) return { error: { from: "from must be ISO date" } };
  if (query.to && isNaN(to.getTime())) return { error: { to: "to must be ISO date" } };

  const page = Math.max(parseInt(query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(query.size ?? "20", 10), 1), 50);

  const sortRaw = query.sort ?? "donatedAt,DESC";
  const [field, dir] = String(sortRaw).split(",");
  const sortField = ALLOWED_SORT_FIELDS.has(field) ? field : "donatedAt";
  const sortDir = (dir ?? "DESC").toUpperCase() === "ASC" ? "asc" : "desc";
  const sort = `${sortField},${sortDir.toUpperCase()}`;

  return { value: { keyword, receiptIssued, minAmount, maxAmount, from, to, page, size, sortField, sortDir, sort } };
}

module.exports = { validateCreate, validateUpdate, validateReceipt, parseListQuery };
