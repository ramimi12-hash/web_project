const express = require("express");
const request = require("supertest");
const { animalsRouter } = require("../animals.routes");

describe("animals routes (module-only)", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/animals", animalsRouter);

  it("GET /__ping should work", async () => {
    const res = await request(app).get("/api/animals/__ping");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("POST should validate required fields", async () => {
    const res = await request(app).post("/api/animals").send({ species: "dog" });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe("VALIDATION_FAILED");
  });
});
