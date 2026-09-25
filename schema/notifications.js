// src/schema/notifications.js
import * as t from "drizzle-orm/pg-core";

export const notifications = t.pgTable(
  "notifications",
  {
    id: t.bigserial("id", { mode: "number" }).primaryKey(),
    role: t.varchar("role", { length: 100 }).notNull(),
    type: t.varchar("type", { length: 100 }).notNull(),
    title: t.varchar("title", { length: 500 }).notNull(),
    data: t.jsonb("data"),
    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [t.index("notifications_role_idx").on(table.role, table.id)],
);
