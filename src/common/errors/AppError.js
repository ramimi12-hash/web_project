// src/common/errors/AppError.js
class AppError extends Error {
  /**
   * @param {object} params
   * @param {number} params.status HTTP status code
   * @param {string} params.code internal error code (e.g., VALIDATION_FAILED)
   * @param {string} params.message user-facing message
   * @param {object} [params.details] extra details (field errors, etc.)
   */
  constructor({ status, code, message, details = {} }) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

module.exports = { AppError };
