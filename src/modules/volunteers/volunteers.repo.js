const { prisma } = require("../common/prisma");

async function createVolunteer(data) {
  return prisma.volunteer.create({ data });
}

async function findById(id) {
  return prisma.volunteer.findUnique({ where: { id } });
}

async function updateById(id, data) {
  return prisma.volunteer.update({ where: { id }, data });
}

async function deleteById(id) {
  return prisma.volunteer.delete({ where: { id } });
}

async function list({ where, orderBy, skip, take }) {
  const [content, totalElements] = await Promise.all([
    prisma.volunteer.findMany({ where, orderBy, skip, take }),
    prisma.volunteer.count({ where }),
  ]);
  return { content, totalElements };
}

// 상태별 집계(선택)
async function countByStatus() {
  const rows = await prisma.volunteer.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return rows.map((r) => ({ status: r.status, count: r._count._all }));
}

module.exports = { createVolunteer, findById, updateById, deleteById, list, countByStatus };
