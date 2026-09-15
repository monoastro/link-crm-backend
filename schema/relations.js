import { relations } from "drizzle-orm";

import { candidates } from "./candidates.js";
import { documents } from "./documents.js";
import { companies } from "./companies.js";

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  company: one(companies, {
    fields: [candidates.companyId],
    references: [companies.id],
  }),
  documents: many(documents),
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
