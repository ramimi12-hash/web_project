const { prisma } = require("../common/prisma");

async function findAnimal(animalId) {
  return prisma.animal.findUnique({ where: { id: animalId } });
}

async function createAdoption(data) {
  return prisma.adoption.create({ data });
}

async function findById(id) {
  return prisma.adoption.findUnique({ where: { id } });
}

async function updateById(id, data) {
  return prisma.adoption.update({ where: { id }, data });
}

async function list({ where, orderBy, skip, take }) {
  const [content, totalElements] = await Promise.all([
    prisma.adoption.findMany({ where, orderBy, skip, take }),
    prisma.adoption.count({ where }),
  ]);
  return { content, totalElements };
}

async function listByAnimal(animalId, { orderBy, skip, take }) {
  return list({ where: { animalId }, orderBy, skip, take });
}

module.exports = { prisma, findAnimal, createAdoption, findById, updateById, list, listByAnimal };
