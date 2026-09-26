import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

import { pkid, timestamps } from "./helpers.js";

export const companies = t.pgTable(
  "companies",
  {
    ...pkid,
    ...timestamps,

    name: t.varchar("name", { length: 255 }).notNull(),
    country: t.varchar("country", { length: 255 }).notNull(),
    parentCompanyId: t.uuid("parent_company_id").references(() => companies.id),
  }
);
