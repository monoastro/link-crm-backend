import { relations } from "drizzle-orm";

import { candidates } from "./candidates.js";
import { documents } from "./documents.js";
import { companies } from "./companies.js";
import { vacancies } from "./vacancies.js";

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  company: one(companies, {
    fields: [candidates.companyId],
    references: [companies.id],
  }),
  documents: many(documents),
}));

export const companiesToVacanciesRelations = relations(companies, ({ many }) => ({
  vacancies: many(vacancies),
}));

export const vacanciesToCompaniesRelations = relations(vacancies, ({ one }) => ({
  company: one(companies, {
    fields: [vacancies.companyId],
    references: [companies.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  candidate: one(candidates, {
    fields: [documents.candidateId],
    references: [candidates.id],
  }),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  parentCompany: one(companies, {
    fields: [companies.parentCompanyId],
    references: [companies.id],
    relationName: "parentChild",
  }),
  subsidiaries: many(companies, {
    relationName: "parentChild",
  }),
  candidates: many(candidates),
}));
