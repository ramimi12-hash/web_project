// src/common/errorResponse.js
function toErrorResponse({ path, status, code, message, details = {} }) {
  return {
    timestamp: new Date().toISOString(),
    path,
    status,
    code,
    message,
    details: details ?? {},
  };
}

module.exports = { toErrorResponse };
