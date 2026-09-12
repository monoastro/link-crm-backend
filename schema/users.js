import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

import { pkid, timestamps } from "./helpers.js";

export const userRole = pgEnum("user_role", ["admin", "editor"]);

export const users = pgTable(
    "users",
    {
        ...pkid,
        ...timestamps,

        username: varchar("username", {
            length: 255,
        }).notNull().unique(),

        password: varchar("password_hash", {
            length: 255,
        }),

        role: userRole("role").notNull().default("admin"),
    },

    (table) => [
        check("username_length_check", sql`length(trim(${table.username})) >= 2`),

        check(
            "users_password_hash_length_check",
            sql`length(${table.password}) >= 20`,
        ),
    ],
);
