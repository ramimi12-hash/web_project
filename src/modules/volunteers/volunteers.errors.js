const { ERROR_CODES } = require("../common/errorCodes");

const VOL_ERRORS = {
  NOT_FOUND: {
    status: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: "봉사자를 찾을 수 없습니다.",
  },
  VALIDATION: {
    status: 422,
    code: ERROR_CODES.VALIDATION_FAILED,
    message: "봉사자 데이터 유효성 검사 실패",
  },
  INVALID_QUERY: {
    status: 400,
    code: ERROR_CODES.INVALID_QUERY_PARAM,
    message: "쿼리 파라미터가 올바르지 않습니다.",
  },
  STATE_CONFLICT: {
    status: 409,
    code: ERROR_CODES.STATE_CONFLICT,
    message: "요청한 상태 전이가 불가능합니다.",
  },
};

module.exports = { VOL_ERRORS };
