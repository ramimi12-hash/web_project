// src/modules/common/pageResponse.js
function toPageResponse({ content, page, size, totalElements, sort }) {
  const totalPages = Math.ceil(totalElements / size);

  return {
    content,
    page,
    size,
    totalElements,
    totalPages,
    sort,
  };
}

module.exports = { toPageResponse };
