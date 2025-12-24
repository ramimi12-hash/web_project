// src/modules/animals/animals.errors.js
const { ERROR_CODES } = require("../common/errorCodes");

const ANIMAL_ERRORS = {
  NOT_FOUND: {
    status: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: "해당 동물을 찾을 수 없습니다.",
  },
  VALIDATION: {
    status: 422,
    code: ERROR_CODES.VALIDATION_FAILED,
    message: "동물 데이터 유효성 검사 실패",
  },
  INVALID_QUERY: {
    status: 400,
    code: ERROR_CODES.INVALID_QUERY_PARAM,
    message: "쿼리 파라미터가 올바르지 않습니다.",
  },
  STATE_CONFLICT: {
    status: 409,
    code: ERROR_CODES.STATE_CONFLICT,
    message: "동물 상태 변경이 불가능합니다.",
  },
};

module.exports = { ANIMAL_ERRORS };
