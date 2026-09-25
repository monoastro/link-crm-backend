// src/modules/notifications/notificationQueries.js
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { db } from "#/config/db.js";
import { notifications } from "#/schema/index.js";

const MAX_INITIAL = 50;

export async function findNotificationsForRole(role, after) {
  if (after == null) {
    // No cursor yet — return the most recent batch, oldest-first for the client.
    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.role, role))
      .orderBy(asc(notifications.id))
      .limit(MAX_INITIAL);

    return items.reverse();
  }

  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.role, role), gt(notifications.id, after)))
    .orderBy(asc(notifications.id));
}
