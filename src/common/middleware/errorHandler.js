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

  // 우리가 던진 AppError
  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details || {};
  }

  // JSON 파싱 실패(잘못된 JSON body)
  // Express 기본 에러가 SyntaxError로 넘어오는 경우가 많음
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    status = 400;
    code = ERROR_CODES.BAD_REQUEST;
    message = "Invalid JSON body";
  }

  // (선택) Prisma 에러 매핑 — 나중에 DB 붙이면 활성화
  // if (err?.code === "P2002") { ... }

  // 서버 로그(민감정보는 찍지 말기)
  // 운영에서는 더 깔끔하게(메서드/경로/상태/지연시간) 로깅하면 좋음
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

  res.status(status).json({
    timestamp,
    path,
    status,
    code,
    message,
    details,
  });
}

module.exports = { errorHandler };
