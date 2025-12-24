// prisma/seed.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function maybe(prob = 0.5) {
  return Math.random() < prob;
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function isoPhone() {
  return `010-${randInt(1000, 9999)}-${randInt(1000, 9999)}`;
}

async function clearAll() {
  // FK 때문에 "자식 → 부모" 순서로 삭제
  await prisma.medicalRecord.deleteMany();
  await prisma.adoption.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.animal.deleteMany();
}

async function seedAnimals(count = 100) {
  const speciesPool = ["dog", "cat", "other"];
  const dogBreeds = ["믹스", "푸들", "말티즈", "포메", "시바", "진돗개", "웰시코기"];
  const catBreeds = ["코숏", "러시안블루", "샴", "페르시안", "믹스"];
  const otherBreeds = ["unknown"];

  const sexPool = ["M", "F", "UNKNOWN"];
  const statusPool = ["SHELTERED", "TEMP_FOSTER", "ADOPTED", "DECEASED"];

  const animals = [];
  for (let i = 0; i < count; i++) {
    const species = pick(speciesPool);
    const breed =
      species === "dog" ? pick(dogBreeds) : species === "cat" ? pick(catBreeds) : pick(otherBreeds);

    // status 분포 조절(대략 보호중 많게)
    const status = (() => {
      const r = Math.random();
      if (r < 0.65) return "SHELTERED";
      if (r < 0.78) return "TEMP_FOSTER";
      if (r < 0.95) return "ADOPTED";
      return "DECEASED";
    })();

    const intake = daysAgo(randInt(0, 365));
    animals.push({
      name: maybe(0.6) ? `아이${i + 1}` : null,
      species,
      breed: maybe(0.8) ? breed : null,
      sex: pick(sexPool),
      ageYears: maybe(0.8) ? randInt(0, 18) : null,
      intakeDate: intake,
      neutered: maybe(0.55),
      status,
    });
  }

  await prisma.animal.createMany({ data: animals });
  return prisma.animal.findMany({ select: { id: true, intakeDate: true, status: true } });
}

async function seedVolunteers(count = 30) {
  const names = ["김하늘", "이서준", "박지민", "최유진", "정민수", "한지우", "오세아", "홍지수"];
  const volunteers = [];
  for (let i = 0; i < count; i++) {
    const status = (() => {
      const r = Math.random();
      if (r < 0.55) return "PENDING";
      if (r < 0.9) return "APPROVED";
      return "SUSPENDED";
    })();

    volunteers.push({
      name: `${pick(names)}${randInt(1, 99)}`,
      phone: maybe(0.9) ? isoPhone() : null,
      email: maybe(0.7) ? `vol${i + 1}@example.com` : null,
      note: maybe(0.4) ? "주말 가능" : null,
      status,
    });
  }

  await prisma.volunteer.createMany({ data: volunteers });
  return prisma.volunteer.count();
}

async function seedDonations(count = 70) {
  const donors = ["네이버", "카카오", "OO동물병원", "김기부", "박후원", "최천사", "익명"];
  const donations = [];

  for (let i = 0; i < count; i++) {
    const donatedAt = daysAgo(randInt(0, 180));
    donations.push({
      donorName: pick(donors),
      donorContact: maybe(0.35) ? isoPhone() : null,
      amount: pick([10000, 20000, 30000, 50000, 70000, 100000, 150000]),
      donatedAt,
      receiptIssued: maybe(0.4),
    });
  }

  await prisma.donation.createMany({ data: donations });
  return prisma.donation.count();
}

async function seedMedicalRecords(animals, count = 80) {
  const types = ["NEUTER", "SURGERY", "TREATMENT", "VACCINE"];
  const descMap = {
    NEUTER: "중성화 수술",
    SURGERY: "수술 처치",
    TREATMENT: "치료/처방",
    VACCINE: "예방접종",
  };
  const costMap = {
    NEUTER: [80000, 200000],
    SURGERY: [150000, 800000],
    TREATMENT: [20000, 150000],
    VACCINE: [15000, 60000],
  };

  const records = [];
  for (let i = 0; i < count; i++) {
    const a = pick(animals);
    const type = pick(types);

    // performedAt은 intakeDate 이후
    const intake = new Date(a.intakeDate);
    const performedAt = new Date(intake);
    performedAt.setDate(performedAt.getDate() + randInt(0, 60));

    const [minC, maxC] = costMap[type];
    records.push({
      animalId: a.id,
      type,
      description: maybe(0.8) ? descMap[type] : null,
      performedAt,
      cost: maybe(0.9) ? randInt(minC, maxC) : null,
    });
  }

  await prisma.medicalRecord.createMany({ data: records });
  return prisma.medicalRecord.count();
}

async function seedAdoptions(animals, count = 50) {
  const applicantNames = ["서연", "민준", "지우", "지민", "현우", "윤아", "도윤", "서준"];
  const phone = () => (maybe(0.85) ? isoPhone() : null);

  // 입양 대상은 너무 꼬이지 않게 "사망(DECEASED)" 제외 위주로 뽑기
  const candidates = animals.filter((a) => a.status !== "DECEASED");

  // 일부는 CONFIRMED로 만들어서 animal.status=ADOPTED 동기화
  const adoptions = [];
  const updatesForAnimals = new Map(); // animalId -> status

  for (let i = 0; i < count; i++) {
    const a = pick(candidates);

    // 상태 분포: requested 많고, 일부 confirmed
    const st = (() => {
      const r = Math.random();
      if (r < 0.6) return "REQUESTED";
      if (r < 0.8) return "APPROVED";
      if (r < 0.93) return "CONFIRMED";
      return "CANCELED";
    })();

    const requestedAt = daysAgo(randInt(0, 120));
    const approvedAt = st === "APPROVED" || st === "CONFIRMED" ? new Date(requestedAt.getTime() + 2 * 86400000) : null;
    const adoptedAt = st === "CONFIRMED" ? new Date(requestedAt.getTime() + randInt(3, 15) * 86400000) : null;
    const canceledAt = st === "CANCELED" ? new Date(requestedAt.getTime() + randInt(1, 7) * 86400000) : null;

    adoptions.push({
      animalId: a.id,
      applicantName: `${pick(applicantNames)}${randInt(1, 99)}`,
      applicantPhone: phone(),
      status: st,
      requestedAt,
      approvedAt,
      adoptedAt,
      canceledAt,
      cancelReason: st === "CANCELED" ? "개인 사정" : null,
    });

    if (st === "CONFIRMED") {
      updatesForAnimals.set(a.id, "ADOPTED");
    }
  }

  // 트랜잭션: Adoption 생성 + Animal 상태 일괄 업데이트
  await prisma.$transaction(async (tx) => {
    await tx.adoption.createMany({ data: adoptions });

    const updates = Array.from(updatesForAnimals.entries());
    for (const [animalId, status] of updates) {
      await tx.animal.update({ where: { id: animalId }, data: { status } });
    }
  });

  return prisma.adoption.count();
}

async function main() {
  console.log("🌱 Seeding start...");
  await clearAll();

  const animals = await seedAnimals(100);
  await seedVolunteers(30);
  await seedDonations(70);
  await seedMedicalRecords(animals, 80);
  await seedAdoptions(animals, 50);

  const counts = {
    animals: await prisma.animal.count(),
    medicalRecords: await prisma.medicalRecord.count(),
    adoptions: await prisma.adoption.count(),
    donations: await prisma.donation.count(),
    volunteers: await prisma.volunteer.count(),
  };

  console.log("✅ Seed done:", counts);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log("✅ Total rows:", total);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
