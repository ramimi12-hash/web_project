const repo = require("./donations.repo");
const { DONATION_ERRORS } = require("./donations.errors");

async function getOne(id) {
  const d = await repo.findById(id);
  if (!d) throw DONATION_ERRORS.NOT_FOUND;
  return d;
}

async function update(id, data) {
  await getOne(id);
  return repo.updateById(id, data);
}

async function remove(id) {
  await getOne(id);
  await repo.deleteById(id);
}

module.exports = { getOne, update, remove };
