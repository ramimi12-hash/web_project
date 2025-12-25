// src/common/middleware/errorHandler.js
const { AppError } = require("../errors/AppError");
const { ERROR_CODES } = require("../errors/errorCodes");

/**
 * Express error-handling middleware (must be last)
 */
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const _next = next;

  const timestamp = new Date().toISOString();
  const path = req.originalUrl || req.url || "";

  // 기본값: 500
  let status = 500;
  let code = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = "Internal server error";
  let details = {};

  // ✅ 1) 우리가 던진 AppError
  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details || {};
  } else {
    // ✅ 2) 일반 Error지만 status를 붙여서 던진 경우(지금 REFRESH_TOKEN_REUSE_DETECTED 케이스)
    // e.g. const e = new Error("..."); e.status = 401; throw e;
    if (Number.isInteger(err?.status) || Number.isInteger(err?.statusCode)) {
      status = err.status || err.statusCode;

      // err.code가 있으면 사용, 없으면 status 기반으로 기본 코드 매핑
      if (err?.code && typeof err.code === "string") {
        code = err.code;
      } else {
        if (status === 400) code = ERROR_CODES.BAD_REQUEST;
        else if (status === 401) code = ERROR_CODES.UNAUTHORIZED || "UNAUTHORIZED";
        else if (status === 403) code = ERROR_CODES.FORBIDDEN || "FORBIDDEN";
        else if (status === 404) code = ERROR_CODES.RESOURCE_NOT_FOUND || "RESOURCE_NOT_FOUND";
        else if (status === 409) code = ERROR_CODES.CONFLICT || "CONFLICT";
        else code = ERROR_CODES.INTERNAL_SERVER_ERROR;
      }

      message = err.message || message;
      details = err.details || {};
    }
  }

  // ✅ 3) JSON 파싱 실패(잘못된 JSON body)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    status = 400;
    code = ERROR_CODES.BAD_REQUEST;
    message = "Invalid JSON body";
  }

  // 서버 로그
  if (status >= 500) {
    console.error("[ERROR]", err);
  } else {
    console.warn("[WARN]", {
      status,
      code,
      message,
      path,
    });
  }

  return res.status(status).json({
    timestamp,
    path,
    status,
    code,
    message,
    details,
  });
}

module.exports = { errorHandler };
