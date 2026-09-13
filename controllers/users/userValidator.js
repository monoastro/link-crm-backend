import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "#/schema/index.js";

// Base insert schema derived from the table, with overrides for fields
// that need input-side (not storage-side) validation.
export const createUserSchema = createInsertSchema(users, {
  username: (schema) =>
    schema.trim().min(2, "Username must be at least 2 characters"),
  password: () =>
    z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"), // bcrypt's practical limit
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schema: same field rules, but everything optional since
// a PATCH-style update may only touch some fields.
export const updateUserSchema = createUpdateSchema(users, {
  username: (schema) =>
    schema.trim().min(2, "Username must be at least 2 characters"),
  password: () =>
    z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters"),
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();
