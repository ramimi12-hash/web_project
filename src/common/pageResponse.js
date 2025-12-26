// src/common/pageResponse.js
function toPageResponse({ content, page, size, totalElements, sort }) {
  const totalPages = Math.ceil((totalElements ?? 0) / (size ?? 1));

  return {
    content: content ?? [],
    page: page ?? 0,
    size: size ?? 20,
    totalElements: totalElements ?? 0,
    totalPages,
    sort: sort ?? null,
  };
}

module.exports = { toPageResponse };
