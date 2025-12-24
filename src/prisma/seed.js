// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function seedAnimals() {
  const speciesList = ["dog", "cat"];
  const dogBreeds = ["maltese", "poodle", "shiba", "mixed"];
  const catBreeds = ["korean shorthair", "persian", "mixed"];
  const sexes = ["M", "F", "UNKNOWN"];
  const statuses = ["SHELTERED", "TEMP_FOSTER", "ADOPTED"];

  const data = Array.from({ length: 80 }).map((_, i) => {
    const species = pick(speciesList);
    const breed = species === "dog" ? pick(dogBreeds) : pick(catBreeds);

    return {
      name: Math.random() < 0.6 ? `animal-${i + 1}` : null,
      species,
      breed,
      sex: pick(sexes),
      ageYears: Math.random() < 0.7 ? randInt(0, 15) : null,
      intakeDate: daysAgo(randInt(1, 365)),
      neutered: Math.random() < 0.5,
      status: pick(statuses),
      note: Math.random() < 0.2 ? "needs follow-up" : null,
    };
  });

  await prisma.animal.createMany({ data });
  return prisma.animal.findMany({ select: { id: true } });
}

async function seedMedical(animalIds) {
  const types = ["NEUTER", "SURGERY", "TREATMENT", "VACCINE"];

  const data = Array.from({ length: 50 }).map(() => ({
    animalId: pick(animalIds).id,
    type: pick(types),
    description: Math.random() < 0.6 ? "routine record" : null,
    performedAt: daysAgo(randInt(1, 365)),
    cost: Math.random() < 0.7 ? randInt(20000, 300000) : null,
  }));

  await prisma.medicalRecord.createMany({ data });
}

async function seedAdoptions(animalIds) {
  const statuses = ["REQUESTED", "APPROVED", "CONFIRMED", "CANCELED"];

  const data = Array.from({ length: 40 }).map(() => {
    const status = pick(statuses);
    const req = daysAgo(randInt(1, 200));
    const approvedAt = status === "APPROVED" || status === "CONFIRMED" ? daysAgo(randInt(1, 120)) : null;
    const adoptedAt = status === "CONFIRMED" ? daysAgo(randInt(1, 60)) : null;
    const canceledAt = status === "CANCELED" ? daysAgo(randInt(1, 120)) : null;

    return {
      animalId: pick(animalIds).id,
      applicantName: `applicant-${randInt(1, 200)}`,
      applicantPhone: Math.random() < 0.7 ? `010-${randInt(1000,9999)}-${randInt(1000,9999)}` : null,
      status,
      requestedAt: req,
      approvedAt,
      adoptedAt,
      canceledAt,
      cancelReason: status === "CANCELED" ? "schedule changed" : null,
    };
  });

  await prisma.adoption.createMany({ data });
}

async function seedDonations() {
  const donors = ["Kim", "Lee", "Park", "Choi", "Jung", "Anon"];

  const data = Array.from({ length: 40 }).map(() => ({
    donorName: pick(donors),
    donorContact: Math.random() < 0.5 ? `010-${randInt(1000,9999)}-${randInt(1000,9999)}` : null,
    amount: randInt(5000, 200000),
    donatedAt: daysAgo(randInt(1, 365)),
    receiptIssued: Math.random() < 0.3,
  }));

  await prisma.donation.createMany({ data });
}

async function seedVolunteers() {
  const statuses = ["PENDING", "APPROVED", "SUSPENDED"];

  const data = Array.from({ length: 20 }).map((_, i) => ({
    name: `volunteer-${i + 1}`,
    phone: Math.random() < 0.7 ? `010-${randInt(1000,9999)}-${randInt(1000,9999)}` : null,
    email: Math.random() < 0.6 ? `v${i + 1}@example.com` : null,
    status: pick(statuses),
    note: Math.random() < 0.2 ? "available weekends" : null,
  }));

  await prisma.volunteer.createMany({ data });
}

async function main() {
  const animalIds = await seedAnimals();
  await seedMedical(animalIds);
  await seedAdoptions(animalIds);
  await seedDonations();
  await seedVolunteers();

  console.log("✅ Seed complete (200+ distributed records)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
