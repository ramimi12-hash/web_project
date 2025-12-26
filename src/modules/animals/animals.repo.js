// src/modules/animals/animals.repo.js
const { prisma } = require("../common/prisma");

async function createAnimal(data) {
  return prisma.animal.create({ data });
}

async function findById(id) {
  return prisma.animal.findUnique({ where: { id } });
}

async function updateById(id, data) {
  return prisma.animal.update({ where: { id }, data });
}

async function deleteById(id) {
  return prisma.animal.delete({ where: { id } });
}

async function list({ where, orderBy, skip, take }) {
  const [content, totalElements] = await Promise.all([
    prisma.animal.findMany({ where, orderBy, skip, take }),
    prisma.animal.count({ where }),
  ]);
  return { content, totalElements };
}

module.exports = { createAnimal, findById, updateById, deleteById, list };
