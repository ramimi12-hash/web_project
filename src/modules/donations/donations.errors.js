const { ERROR_CODES } = require("../common/errorCodes");

const DONATION_ERRORS = {
  NOT_FOUND: {
    status: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: "기부 내역을 찾을 수 없습니다.",
  },
  VALIDATION: {
    status: 422,
    code: ERROR_CODES.VALIDATION_FAILED,
    message: "기부 데이터 유효성 검사 실패",
  },
  INVALID_QUERY: {
    status: 400,
    code: ERROR_CODES.INVALID_QUERY_PARAM,
    message: "쿼리 파라미터가 올바르지 않습니다.",
  },
};

module.exports = { DONATION_ERRORS };
