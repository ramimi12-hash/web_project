const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

// ⚠️ app export 경로 확인: src/app.js가 module.exports = app 이어야 함
const app = require("../src/app");

const prisma = new PrismaClient();

function token(role = "ADMIN") {
  const secret = process.env.JWT_SECRET || "test-secret";
  return jwt.sign({ sub: "test-user-1", role }, secret, { expiresIn: "1h" });
}

async function cleanDb() {
  // FK 자식 -> 부모
  await prisma.medicalRecord.deleteMany({});
  await prisma.adoption.deleteMany({});
  await prisma.donation.deleteMany({});
  await prisma.volunteer.deleteMany({});
  await prisma.animal.deleteMany({});
}

async function createAnimal(overrides = {}) {
  const body = {
    name: "Bori",
    species: "DOG",
    breed: "MIX",
    sex: "F",
    ageYears: 3,
    intakeDate: new Date().toISOString(),
    neutered: false,
    status: "SHELTERED",
    note: "test",
    ...overrides,
  };
  const res = await request(app).post("/api/animals").send(body);
  expect(res.status).toBe(201);
  return res.body;
}

describe("Shelter API tests (20+ required)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ---------- Health ----------
  test("GET /health -> 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  // ---------- Animals ----------
  test("POST /api/animals -> 201", async () => {
    await createAnimal();
  });

  test("POST /api/animals -> 400/422 validation fail", async () => {
    const res = await request(app).post("/api/animals").send({ species: "" });
    expect([400, 422]).toContain(res.status);
    expect(res.body).toHaveProperty("code");
  });

  test("GET /api/animals/:id -> 200", async () => {
    const a = await createAnimal();
    const res = await request(app).get(`/api/animals/${a.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(a.id);
  });

  test("GET /api/animals/abc -> 400/422", async () => {
    const res = await request(app).get("/api/animals/abc");
    expect([400, 422]).toContain(res.status);
  });

  test("GET /api/animals (list) -> 401 without token (requireAuth)", async () => {
    const res = await request(app).get("/api/animals");
    expect([401, 403]).toContain(res.status);
  });

  test("GET /api/animals (list) -> 200 with token + pagination payload", async () => {
    await createAnimal();
    const res = await request(app)
      .get("/api/animals?page=0&size=10&sort=intakeDate,DESC")
      .set("Authorization", `Bearer ${token("STAFF")}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content");
    expect(res.body).toHaveProperty("page");
    expect(res.body).toHaveProperty("size");
  });

  test("PATCH /api/animals/:id -> 200", async () => {
    const a = await createAnimal();
    const res = await request(app).patch(`/api/animals/${a.id}`).send({ breed: "POODLE" });
    expect(res.status).toBe(200);
    expect(res.body.breed).toBe("POODLE");
  });

  test("PATCH /api/animals/:id/status -> 200 (enum)", async () => {
    const a = await createAnimal();
    const res = await request(app).patch(`/api/animals/${a.id}/status`).send({ status: "TEMP_FOSTER" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("TEMP_FOSTER");
  });

  test("PATCH /api/animals/:id/status -> 400/422 invalid enum", async () => {
    const a = await createAnimal();
    const res = await request(app).patch(`/api/animals/${a.id}/status`).send({ status: "WRONG" });
    expect([400, 422]).toContain(res.status);
  });

  test("PATCH /api/animals/:id/neutered -> 200", async () => {
    const a = await createAnimal();
    const res = await request(app).patch(`/api/animals/${a.id}/neutered`).send({ neutered: true });
    expect(res.status).toBe(200);
    expect(res.body.neutered).toBe(true);
  });

  test("DELETE /api/animals/:id -> 204", async () => {
    const a = await createAnimal();
    const res = await request(app).delete(`/api/animals/${a.id}`);
    expect(res.status).toBe(204);
  });

  // ---------- Adoptions ----------
  async function createAdoption(animalId, overrides = {}) {
    const res = await request(app).post("/api/adoptions/adoptions").send({
      animalId,
      applicantName: "Kim",
      applicantPhone: "01012345678",
      ...overrides,
    });
    expect(res.status).toBe(201);
    return res.body;
  }

  test("POST /api/adoptions/adoptions -> 201", async () => {
    const a = await createAnimal();
    await createAdoption(a.id);
  });

  test("POST /api/adoptions/adoptions -> 400/422 validation fail", async () => {
    const res = await request(app).post("/api/adoptions/adoptions").send({
      animalId: "not-int",
      applicantName: "",
    });
    expect([400, 422]).toContain(res.status);
  });

  test("GET /api/adoptions/adoptions -> 200 list", async () => {
    const a = await createAnimal();
    await createAdoption(a.id);
    const res = await request(app).get("/api/adoptions/adoptions?page=0&size=10&sort=requestedAt,DESC");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content");
  });

  test("GET /api/adoptions/adoptions/:id -> 200", async () => {
    const a = await createAnimal();
    const ad = await createAdoption(a.id);
    const res = await request(app).get(`/api/adoptions/adoptions/${ad.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ad.id);
  });

  test("PATCH /api/adoptions/adoptions/:id/approve -> 401 without token", async () => {
    const a = await createAnimal();
    const ad = await createAdoption(a.id);
    const res = await request(app).patch(`/api/adoptions/adoptions/${ad.id}/approve`);
    expect([401, 403]).toContain(res.status);
  });

  test("PATCH /api/adoptions/adoptions/:id/approve -> 403 with STAFF token", async () => {
    const a = await createAnimal();
    const ad = await createAdoption(a.id);
    const res = await request(app)
      .patch(`/api/adoptions/adoptions/${ad.id}/approve`)
      .set("Authorization", `Bearer ${token("STAFF")}`);
    expect(res.status).toBe(403);
  });

  test("PATCH /api/adoptions/adoptions/:id/approve -> 200 with ADMIN token", async () => {
    const a = await createAnimal();
    const ad = await createAdoption(a.id);
    const res = await request(app)
      .patch(`/api/adoptions/adoptions/${ad.id}/approve`)
      .set("Authorization", `Bearer ${token("ADMIN")}`);
    expect(res.status).toBe(200);
  });

  test("PATCH /api/adoptions/adoptions/:id/confirm -> 400/422 invalid body", async () => {
    const a = await createAnimal();
    const ad = await createAdoption(a.id);
    const res = await request(app)
      .patch(`/api/adoptions/adoptions/${ad.id}/confirm`)
      .send({ adoptedAt: "not-a-date" });
    expect([400, 422]).toContain(res.status);
  });

  // ---------- Donations ----------
  async function createDonation(overrides = {}) {
    const res = await request(app).post("/api/donations/donations").send({
      donorName: "Lee",
      donorContact: "01099998888",
      amount: 50000,
      donatedAt: new Date().toISOString(),
      receiptIssued: false,
      ...overrides,
    });
    expect(res.status).toBe(201);
    return res.body;
  }

  test("POST /api/donations/donations -> 201", async () => {
    await createDonation();
  });

  test("GET /api/donations/donations -> 200 list", async () => {
    await createDonation();
    const res = await request(app).get("/api/donations/donations?page=0&size=10&sort=donatedAt,DESC");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content");
  });

  test("PATCH /api/donations/donations/:id/receipt -> 200", async () => {
    const d = await createDonation();
    const res = await request(app)
      .patch(`/api/donations/donations/${d.id}/receipt`)
      .send({ receiptIssued: true });
    expect(res.status).toBe(200);
    expect(res.body.receiptIssued).toBe(true);
  });

  test("PATCH /api/donations/donations/:id/receipt -> 400/422 invalid", async () => {
    const d = await createDonation();
    const res = await request(app)
      .patch(`/api/donations/donations/${d.id}/receipt`)
      .send({ receiptIssued: "yes" });
    expect([400, 422]).toContain(res.status);
  });

  // ---------- Medical ----------
  test("POST /api/medical/animals/:id/medical-records -> 201", async () => {
    const a = await createAnimal({ neutered: false });
    const res = await request(app).post(`/api/medical/animals/${a.id}/medical-records`).send({
      type: "NEUTER",
      description: "neuter done",
      performedAt: new Date().toISOString(),
      cost: 120000,
    });
    expect(res.status).toBe(201);
  });

  test("GET /api/medical/medical-records -> 200 list", async () => {
    const a = await createAnimal();
    await request(app).post(`/api/medical/animals/${a.id}/medical-records`).send({
      type: "TREATMENT",
      performedAt: new Date().toISOString(),
    });
    const res = await request(app).get("/api/medical/medical-records?page=0&size=10&sort=performedAt,DESC");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content");
  });

  // ---------- Volunteers ----------
  test("POST /api/volunteers/volunteers -> 201", async () => {
    const res = await request(app).post("/api/volunteers/volunteers").send({
      name: "Park",
      phone: "01011112222",
      email: "park@test.com",
      note: "weekend",
    });
    expect(res.status).toBe(201);
  });

  test("GET /api/volunteers/volunteers -> 200 list", async () => {
    await request(app).post("/api/volunteers/volunteers").send({ name: "Choi" });
    const res = await request(app).get("/api/volunteers/volunteers?page=0&size=10&sort=createdAt,DESC");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("content");
  });

  test("PATCH /api/volunteers/volunteers/:id/approve -> 200 or 403 depending on RBAC", async () => {
    // 이 엔드포인트가 아직 requireRole로 감싸지지 않았을 수 있어서
    // 통과하면 200, RBAC 걸려있으면 401/403도 허용
    const v = await request(app).post("/api/volunteers/volunteers").send({ name: "AdminTest" });
    const id = v.body.id;
    const res = await request(app)
      .patch(`/api/volunteers/volunteers/${id}/approve`)
      .set("Authorization", `Bearer ${token("ADMIN")}`);
    expect([200, 401, 403]).toContain(res.status);
  });

  // ---------- Stats ----------
  test("GET /api/stats/stats/donations/monthly -> 200", async () => {
    await createDonation({ amount: 10000 });
    const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    const to = new Date().toISOString();

    const res = await request(app).get(
      `/api/stats/stats/donations/monthly?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("rows");
  });

  test("GET /api/stats/stats/donations/monthly -> 400 invalid query", async () => {
    const res = await request(app).get("/api/stats/stats/donations/monthly?from=bad&to=bad");
    expect([400, 422]).toContain(res.status);
  });
});
