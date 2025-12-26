const { validateCreate } = require("../medical.validators");

test("validateCreate should fail without required fields", () => {
  const err = validateCreate({});
  expect(err).toBeTruthy();
  expect(err.type).toBeDefined();
  expect(err.performedAt).toBeDefined();
});
