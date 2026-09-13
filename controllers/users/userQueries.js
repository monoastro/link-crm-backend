import { eq } from "drizzle-orm";
import { db } from "#/config/db.js";
import { users } from "#/schema/index.js";
import { paginateAndSearch, buildWhereFromQuery } from "#/utils/queryhelper.js";

// never select/return password — whitelist everywhere
export const safeColumns = {
  id: users.id,
  username: users.username,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export async function findUserByUsername(username) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user; // includes password hash — internal use only (e.g. login/auth check)
}

export async function findUserById(id) {
  const [user] = await db
    .select(safeColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user;
}

export async function createUser(data) {
  const [user] = await db.insert(users).values(data).returning(safeColumns);
  return user;
}

export async function deleteUser(id) {
  const [user] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return user;
}

export async function findAllUsers(queryParams = {}) {
  const { query, page, pageSize, role } = queryParams;

  const where = buildWhereFromQuery(users, { role }, ["role"]);

  return paginateAndSearch(users, {
    query,
    searchFields: [users.username],
    where,
    orderBy: users.createdAt,
    page,
    pageSize,
    fields: safeColumns,
  });
}

export async function updateUser(id, data) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(safeColumns);
  return user;
}
