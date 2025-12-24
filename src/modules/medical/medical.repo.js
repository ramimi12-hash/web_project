const { prisma } = require("../common/prisma");

async function animalExists(animalId) {
  const a = await prisma.animal.findUnique({ where: { id: animalId }, select: { id: true } });
  return !!a;
}

async function createRecord(data) {
  return prisma.medicalRecord.create({ data });
}

async function findRecordById(id) {
  return prisma.medicalRecord.findUnique({ where: { id } });
}

async function updateRecord(id, data) {
  return prisma.medicalRecord.update({ where: { id }, data });
}

async function deleteRecord(id) {
  return prisma.medicalRecord.delete({ where: { id } });
}

async function listByAnimal({ animalId, orderBy, skip, take }) {
  const where = { animalId };
  const [content, totalElements] = await Promise.all([
    prisma.medicalRecord.findMany({ where, orderBy, skip, take }),
    prisma.medicalRecord.count({ where }),
  ]);
  return { content, totalElements };
}

async function listAll({ where, orderBy, skip, take }) {
  const [content, totalElements] = await Promise.all([
    prisma.medicalRecord.findMany({ where, orderBy, skip, take }),
    prisma.medicalRecord.count({ where }),
  ]);
  return { content, totalElements };
}

async function recentSummary(animalId, limit = 5) {
  return prisma.medicalRecord.findMany({
    where: { animalId },
    orderBy: { performedAt: "desc" },
    take: limit,
  });
}

module.exports = {
  animalExists,
  createRecord,
  findRecordById,
  updateRecord,
  deleteRecord,
  listByAnimal,
  listAll,
  recentSummary,
};
