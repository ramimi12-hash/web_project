// src/modules/common/prisma.js
const { PrismaClient } = require("@prisma/client");

// 싱글톤 (hot-reload 환경에서도 중복 생성 최소화)
const globalForPrisma = global.__prismaGlobal || (global.__prismaGlobal = {});
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

module.exports = { prisma };
