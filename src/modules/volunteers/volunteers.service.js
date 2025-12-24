const repo = require("./volunteers.repo");
const { VOL_ERRORS } = require("./volunteers.errors");

async function getOne(id) {
  const v = await repo.findById(id);
  if (!v) throw VOL_ERRORS.NOT_FOUND;
  return v;
}

async function update(id, data) {
  await getOne(id);
  return repo.updateById(id, data);
}

async function remove(id) {
  await getOne(id);
  await repo.deleteById(id);
}

async function approve(id) {
  const v = await getOne(id);
  if (v.status !== "PENDING") throw { ...VOL_ERRORS.STATE_CONFLICT, details: { currentStatus: v.status } };
  return repo.updateById(id, { status: "APPROVED" });
}

async function suspend(id) {
  const v = await getOne(id);
  if (v.status !== "APPROVED") throw { ...VOL_ERRORS.STATE_CONFLICT, details: { currentStatus: v.status } };
  return repo.updateById(id, { status: "SUSPENDED" });
}

async function reinstate(id) {
  const v = await getOne(id);
  if (v.status !== "SUSPENDED") throw { ...VOL_ERRORS.STATE_CONFLICT, details: { currentStatus: v.status } };
  return repo.updateById(id, { status: "APPROVED" });
}

module.exports = { getOne, update, remove, approve, suspend, reinstate };
