import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

import { pkid, timestamps } from "./helpers.js";

export const vacancyStatusEnum = t.pgEnum("vacancy_status", ["open", "closed"]);

export const vacancies = t.pgTable(
  "vacancies",
  {
    ...pkid,
    ...timestamps,
    code: t.varchar("code", { length: 50 }).notNull(),
    position: t.varchar("name", { length: 255 }).notNull(),
    companyId: t.uuid("company_id").notNull().references(() => companies.id),
    openings: t.integer("openings").notNull().default(0),
    status: vacancyStatusEnum("status").notNull().default("open"),
  },
  (table) => ({
    uniqueCompanyCode: t.unique("vacancies_company_code_unique").on(
      table.companyId,
      table.code
    ),
  })
);
