const { prisma } = require("../common/prisma");

async function createDonation(data) {
  return prisma.donation.create({ data });
}

async function findById(id) {
  return prisma.donation.findUnique({ where: { id } });
}

async function updateById(id, data) {
  return prisma.donation.update({ where: { id }, data });
}

async function deleteById(id) {
  return prisma.donation.delete({ where: { id } });
}

async function list({ where, orderBy, skip, take }) {
  const [content, totalElements] = await Promise.all([
    prisma.donation.findMany({ where, orderBy, skip, take }),
    prisma.donation.count({ where }),
  ]);
  return { content, totalElements };
}

module.exports = { prisma, createDonation, findById, updateById, deleteById, list };
