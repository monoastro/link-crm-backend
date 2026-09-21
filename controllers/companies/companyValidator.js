// src/modules/companies/companyValidator.js
import { createSchemaFactory } from "drizzle-zod";

import { companies } from "#/schema/index.js";

const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
  coerce: { date: true },
});

const baseCompanyInsertSchema = createInsertSchema(companies, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

export const createCompanySchema = baseCompanyInsertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCompanySchema = createUpdateSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
