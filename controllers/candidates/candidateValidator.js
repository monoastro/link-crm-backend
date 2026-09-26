import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { candidates } from "#/schema/index.js";

const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
  coerce: { date: true },
});

const baseCandidateInsertSchema = createInsertSchema(candidates, {
  email: (schema) => schema.email().optional(),
  passportNumber: (schema) => schema.min(1, "Passport number is required"),
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  companyId: () => z.string().uuid("Company must be a valid selection"),
});

export const createCandidateSchema = baseCandidateInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCandidateSchema = createUpdateSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
