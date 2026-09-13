import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

import { pkid, timestamps } from "./helpers.js";

export const genderEnum = t.pgEnum("gender", ["male", "female", "other"]);

export const candidate = t.pgTable(
  "candidates",
  {
    ...pkid,
    ...timestamps,

    name: t.varchar("name", { length: 255 }).notNull(),
    email: t.varchar("email", { length: 255 }).notNull().unique(),
    phone: t.varchar("phone", { length: 20 }),
    passport: t.varchar("passport", { length: 20 }).unique().notNull(),
    address: t.varchar("address", { length: 255 }),
    dob: t.timestamp("dob"),
    gender: genderEnum("gender"),
  },
  (table) => [
    t.check("name_length_check", sql`length(trim(${table.name})) >= 2`),
  ],
);

