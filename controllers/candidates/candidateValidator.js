import { z } from "zod";
import { createSchemaFactory } from "drizzle-zod";

import { candidates, documents } from "#/schema/index.js";

const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
  coerce: { date: true },
});

const baseCandidateInsertSchema = createInsertSchema(candidates, {
  email: (schema) => schema.email().optional(),
  passport: (schema) => schema.min(1, "Passport is required"),
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

const documentInputSchema = createInsertSchema(documents, {
  url: (schema) => schema.url(),
}).omit({
  id: true,
  candidateId: true,
  createdAt: true,
  updatedAt: true,
});

export const createCandidateSchema = baseCandidateInsertSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    documents: z.array(documentInputSchema).optional(),
  });

export const updateCandidateSchema = createUpdateSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
