const express = require("express");
const router = express.Router();

const { z } = require("zod");
const { asyncHandler } = require("../../common/utils/asyncHandler");
const { validate } = require("../../common/middleware/validate");

const createAnimalSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    species: z.enum(["DOG", "CAT", "ETC"]),
    neutered: z.boolean().optional(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.status(200).json({ message: "animals list" });
  })
);

router.post(
  "/",
  validate(createAnimalSchema),
  asyncHandler(async (req, res) => {
    const { name, species, neutered } = req.validated.body;
    res.status(201).json({ name, species, neutered: neutered ?? null });
  })
);

module.exports = router;
