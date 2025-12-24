function parseRange(query) {
  const from = query.from ? new Date(String(query.from)) : null;
  const to = query.to ? new Date(String(query.to)) : null;

  if (query.from && isNaN(from.getTime())) return { error: { from: "from must be ISO date" } };
  if (query.to && isNaN(to.getTime())) return { error: { to: "to must be ISO date" } };

  const limit = Math.min(Math.max(parseInt(query.limit ?? "10", 10), 1), 50);

  return { value: { from, to, limit } };
}

module.exports = { parseRange };
