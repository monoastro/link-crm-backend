import { sql } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";

import { pkid, timestamps } from "./helpers.js";
import { candidates } from "./candidates.js";

export const flights = t.pgTable(
  "flights",
  {
    ...pkid,
    ...timestamps,

    flightNumber: t.varchar("flight_number", { length: 20 }).notNull(),
    date: t.timestamp("date").notNull(),
    candidateId: t.uuid("candidate_id")
      .notNull()
      .references(() => candidate.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueCandidateFlight: t.unique("unique_candidate_flight").on(table.candidateId, table.flightNumber),
  }),
);
