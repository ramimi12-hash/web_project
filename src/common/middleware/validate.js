// src/common/middleware/validate.js
const { AppError } = require("../errors/AppError");
const { ERROR_CODES } = require("../errors/errorCodes");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const flattened = result.error.flatten();
      return next(
        new AppError({
          status: 422,
          code: ERROR_CODES.VALIDATION_FAILED,
          message: "Validation failed",
          details: flattened, // fieldErrors / formErrors 포함
        })
      );
    }

    req.validated = result.data; // 검증 통과한 값 저장
    next();
  };
}

module.exports = { validate };
