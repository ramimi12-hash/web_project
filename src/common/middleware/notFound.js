// src/common/middleware/notFound.js
const { AppError } = require("../errors/AppError");
const { ERROR_CODES } = require("../errors/errorCodes");

function notFound(req, res, next) {
  next(
    new AppError({
      status: 404,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: "Resource not found",
      details: {},
    })
  );
}

module.exports = { notFound };
