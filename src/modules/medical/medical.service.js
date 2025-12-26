const repo = require("./medical.repo");
const { MEDICAL_ERRORS } = require("./medical.errors");

async function ensureAnimal(animalId) {
  const ok = await repo.animalExists(animalId);
  if (!ok) throw MEDICAL_ERRORS.ANIMAL_NOT_FOUND;
}

async function getRecord(recordId) {
  const rec = await repo.findRecordById(recordId);
  if (!rec) throw MEDICAL_ERRORS.RECORD_NOT_FOUND;
  return rec;
}

module.exports = { ensureAnimal, getRecord };
