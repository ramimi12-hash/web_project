// src/modules/animals/animals.service.js
const repo = require("./animals.repo");
const { ANIMAL_ERRORS } = require("./animals.errors");

async function getOne(id) {
  const animal = await repo.findById(id);
  if (!animal) throw ANIMAL_ERRORS.NOT_FOUND;
  return animal;
}

async function update(id, data) {
  // 존재 확인 후 업데이트(404 일관성)
  await getOne(id);
  return repo.updateById(id, data);
}

async function remove(id) {
  await getOne(id);
  await repo.deleteById(id);
}

module.exports = { getOne, update, remove };
