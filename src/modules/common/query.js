// src/modules/common/query.js
function parsePagination(query) {
  const page = Math.max(parseInt(query.page ?? "0", 10), 0);
  const size = Math.min(Math.max(parseInt(query.size ?? "20", 10), 1), 50);

  const sortRaw = query.sort ?? "createdAt,DESC";
  const [field, dir] = String(sortRaw).split(",");
  const direction = (dir ?? "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

  return { page, size, sort: { field, direction }, sortRaw: `${field},${direction}` };
}

module.exports = { parsePagination };
