// src/modules/companies/companyValidator.js
import { z } from "zod";
import { createSchemaFactory } from "drizzle-zod";

import { companies, vacancies } from "#/schema/index.js";

const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
  coerce: { date: true },
});

const baseCompanyInsertSchema = createInsertSchema(companies, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

// base vacancy fields shared by both new and existing nested vacancies
const baseVacancyInsertSchema = createInsertSchema(vacancies, {
  position: (schema) => schema.min(2, "Position must be at least 2 characters"),
  openings: (schema) => schema.min(0, "Openings cannot be negative"),
  status: (schema) => schema, // enum validation ("open" | "closed") is automatic
});

// shared fields, without id/timestamps/companyId/code —
// code is handled separately per-branch below
const nestedVacancyFields = baseVacancyInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  companyId: true,
  code: true,
});

// existing vacancy being updated — code is required, must match a real row
const existingVacancySchema = nestedVacancyFields.extend({
  code: z.string().min(1, "code is required for an existing vacancy"),
});

// new vacancy being created — code must NOT be sent, server generates it
const newVacancySchema = nestedVacancyFields.extend({
  code: z.undefined().optional(),
});

// a nested vacancy is either an existing one (code present) or a new one (code absent)
const nestedVacancySchema = z.union([existingVacancySchema, newVacancySchema]);

// --- company schemas ---

export const createCompanySchema = baseCompanyInsertSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // on create, no vacancy should ever have a code — reuse newVacancySchema only
    vacancies: z.array(newVacancySchema).optional(),
  });

export const updateCompanySchema = createUpdateSchema(companies)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // on update, each vacancy is either existing (has code) or new (no code)
    vacancies: z.array(nestedVacancySchema).optional(),
  });
