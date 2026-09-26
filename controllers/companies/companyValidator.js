// src/modules/companies/companyValidator.js
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { companies, vacancies } from "#/schema/index.js";

const { createInsertSchema, createUpdateSchema } = createSchemaFactory({
  coerce: { date: true },
});

const ISO_ALPHA_2_CODES = new Set(["AW", "AF", "AO", "AI", "AX", "AL", "AD", "AE", "AR", "AM", "AS", "AQ", "TF", "AG", "AU", "AT", "AZ", "BI", "BE", "BJ", "BQ", "BF", "BD", "BG", "BH", "BS", "BA", "BL", "BY", "BZ", "BM", "BO", "BR", "BB", "BN", "BT", "BV", "BW", "CF", "CA", "CC", "CH", "CL", "CN", "CI", "CM", "CD", "CG", "CK", "CO", "KM", "CV", "CR", "CU", "CW", "CX", "KY", "CY", "CZ", "DE", "DJ", "DM", "DK", "DO", "DZ", "EC", "EG", "ER", "EH", "ES", "EE", "ET", "FI", "FJ", "FK", "FR", "FO", "FM", "GA", "GB", "GE", "GG", "GH", "GI", "GN", "GP", "GM", "GW", "GQ", "GR", "GD", "GL", "GT", "GF", "GU", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IM", "IN", "IO", "IE", "IR", "IQ", "IS", "IL", "IT", "JM", "JE", "JO", "JP", "KZ", "KE", "KG", "KH", "KI", "KN", "KR", "KW", "LA", "LB", "LR", "LY", "LC", "LI", "LK", "LS", "LT", "LU", "LV", "MO", "MF", "MA", "MC", "MD", "MG", "MV", "MX", "MH", "MK", "ML", "MT", "MM", "ME", "MN", "MP", "MZ", "MR", "MS", "MQ", "MU", "MW", "MY", "YT", "NA", "NC", "NE", "NF", "NG", "NI", "NU", "NL", "NO", "NP", "NR", "NZ", "OM", "PK", "PA", "PN", "PE", "PH", "PW", "PG", "PL", "PR", "KP", "PT", "PY", "PS", "PF", "QA", "RE", "RO", "RU", "RW", "SA", "SD", "SN", "SG", "GS", "SH", "SJ", "SB", "SL", "SV", "SM", "SO", "PM", "RS", "SS", "ST", "SR", "SK", "SI", "SE", "SZ", "SX", "SC", "SY", "TC", "TD", "TG", "TH", "TJ", "TK", "TM", "TL", "TO", "TT", "TN", "TR", "TV", "TW", "TZ", "UG", "UA", "UM", "UY", "US", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "ZA", "ZM", "ZW"]);

const countrySchema = z.string()
  .length(2, "Country must be a two-letter ISO code")
  .regex(/^[A-Z]{2}$/, "Country must be an uppercase ISO code")
  .refine((code) => ISO_ALPHA_2_CODES.has(code), "Country must be a valid ISO alpha-2 code");

const baseCompanyInsertSchema = createInsertSchema(companies, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  country: () => countrySchema,
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

export const updateCompanySchema = createUpdateSchema(companies, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  country: () => countrySchema,
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // on update, each vacancy is either existing (has code) or new (no code)
    vacancies: z.array(nestedVacancySchema).optional(),
  });
