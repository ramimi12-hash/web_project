const repo = require("./adoptions.repo");
const { ADOPTION_ERRORS } = require("./adoptions.errors");

function now() {
  return new Date();
}

// 상태 전이 규칙
// REQUESTED -> APPROVED -> CONFIRMED
// REQUESTED/APPROVED -> CANCELED
// CONFIRMED는 원칙적으로 취소 불가(409)로 처리 (정책상 가능하게 바꾸려면 여기만 수정)
async function getOne(id) {
  const a = await repo.findById(id);
  if (!a) throw ADOPTION_ERRORS.NOT_FOUND;
  return a;
}

async function create({ animalId, applicantName, applicantPhone }) {
  const animal = await repo.findAnimal(animalId);
  if (!animal) throw ADOPTION_ERRORS.ANIMAL_NOT_FOUND;

  // 이미 입양완료/사망이면 신청 불가(409)
  if (animal.status === "ADOPTED" || animal.status === "DECEASED") {
    throw {
      ...ADOPTION_ERRORS.STATE_CONFLICT,
      details: { animalStatus: animal.status },
    };
  }

  return repo.createAdoption({
    animalId,
    applicantName,
    applicantPhone: applicantPhone ?? null,
    status: "REQUESTED",
    requestedAt: now(),
  });
}

async function approve(id) {
  const adoption = await getOne(id);
  if (adoption.status !== "REQUESTED") {
    throw { ...ADOPTION_ERRORS.STATE_CONFLICT, details: { currentStatus: adoption.status } };
  }

  return repo.updateById(id, { status: "APPROVED", approvedAt: now() });
}

async function confirm(id, adoptedAt) {
  const adoption = await getOne(id);
  if (adoption.status !== "APPROVED") {
    throw { ...ADOPTION_ERRORS.STATE_CONFLICT, details: { currentStatus: adoption.status } };
  }

  // 트랜잭션: 입양 확정 + 동물 상태 ADOPTED 동시 반영
  return repo.prisma.$transaction(async (tx) => {
    const updatedAdoption = await tx.adoption.update({
      where: { id },
      data: { status: "CONFIRMED", adoptedAt, },
    });

    await tx.animal.update({
      where: { id: adoption.animalId },
      data: { status: "ADOPTED" },
    });

    return updatedAdoption;
  });
}

async function cancel(id, cancelReason) {
  const adoption = await getOne(id);

  if (adoption.status === "CONFIRMED") {
    throw { ...ADOPTION_ERRORS.STATE_CONFLICT, details: { currentStatus: adoption.status } };
  }
  if (adoption.status === "CANCELED") {
    throw { ...ADOPTION_ERRORS.STATE_CONFLICT, details: { currentStatus: adoption.status } };
  }

  return repo.updateById(id, {
    status: "CANCELED",
    canceledAt: now(),
    cancelReason: cancelReason ?? null,
  });
}

module.exports = { getOne, create, approve, confirm, cancel };
