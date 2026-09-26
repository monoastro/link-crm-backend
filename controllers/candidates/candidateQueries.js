// src/modules/candidates/candidateQueries.js
import { sql, gte, lte, ne, and, eq, notInArray, getTableColumns } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { db } from "#/config/db.js";
import { candidates, companies, vacancies, documents, notifications } from "#/schema/index.js";
import { join, paginateAndSearch, buildWhereFromQuery } from "#/utils/queryhelper.js";
import { STATUS_FIELD_RULES, STATUS_COLUMNS } from "./candidateStatusRules.js";

export async function findCandidateById(id) {
  return db.query.candidates.findFirst({
    where: eq(candidates.id, id),
    with: {
      documents: true,
      company: true,
    },
  });
}

export async function createCandidate(data) {
  const { documents: docs, ...candidateData } = data;

  return db.transaction(async (tx) => {
    const [candidate] = await tx
      .insert(candidates)
      .values(candidateData)
      .returning();

    let insertedDocs = [];
    if (docs?.length) {
      insertedDocs = await tx
        .insert(documents)
        .values(docs.map((d) => ({ ...d, candidateId: candidate.id })))
        .returning();
    }

    return { ...candidate, documents: insertedDocs };
  });
}

// ---------------------------------------------------------------------------
// Converts a stored document url (e.g. "/uploads/documents/other/uuid.pdf")
// back into its absolute path on disk, so the old file can be removed
// when it's replaced or dropped.
// ---------------------------------------------------------------------------

function urlToDiskPath(url) {
  // url looks like "/uploads/documents/other/uuid.pdf"
  // disk root is "<cwd>/src/public"
  return path.join(process.cwd(), "src", "public", url);
}

async function deleteFileIfExists(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // ENOENT just means it was already gone — nothing to worry about.
    // Anything else, log it, but don't fail the request over a file cleanup issue.
    if (err.code !== "ENOENT") {
      console.error(`Failed to delete old document file: ${filePath}`, err);
    }
  }
}

// ---------------------------------------------------------------------------
// Upserts documents by (candidateId, type) for single-instance types
// (e.g. "photo"). One row per type per candidate — replaces the file/url
// if a row already exists.
// ---------------------------------------------------------------------------

export async function upsertCandidateDocuments(candidateId, docs) {
  if (!docs?.length) return [];

  const oldFilesToDelete = [];

  const results = await db.transaction(async (tx) => {
    const upserted = [];

    for (const doc of docs) {
      const [existing] = await tx
        .select({ id: documents.id, url: documents.url })
        .from(documents)
        .where(and(eq(documents.candidateId, candidateId), eq(documents.type, doc.type)));

      if (existing) {
        const [updated] = await tx
          .update(documents)
          .set({
            fileType: doc.fileType,
            url: doc.url,
            updatedAt: new Date(),
          })
          .where(eq(documents.id, existing.id))
          .returning();

        if (existing.url && existing.url !== doc.url) {
          oldFilesToDelete.push(existing.url);
        }

        upserted.push(updated);
      } else {
        const [inserted] = await tx
          .insert(documents)
          .values({ ...doc, candidateId })
          .returning();
        upserted.push(inserted);
      }
    }

    return upserted;
  });

  await Promise.all(
    oldFilesToDelete.map((url) => deleteFileIfExists(urlToDiskPath(url)))
  );

  return results;
}

// ---------------------------------------------------------------------------
// Syncs "other" documents, which can have many rows per candidate:
//   - keepUrls: urls of existing "other" documents the user chose to keep
//     (whatever wasn't in this list gets deleted, DB row + file on disk)
//   - newDocs: freshly uploaded files to insert as new "other" rows
// Used instead of upsertCandidateDocuments for the multi-file "other" type.
// ---------------------------------------------------------------------------

export async function syncOtherDocuments(candidateId, keepUrls = [], newDocs = []) {
  const existing = await db
    .select({ id: documents.id, url: documents.url })
    .from(documents)
    .where(and(eq(documents.candidateId, candidateId), eq(documents.type, "other")));

  const toDelete = existing.filter((doc) => !keepUrls.includes(doc.url));

  const results = await db.transaction(async (tx) => {
    if (toDelete.length) {
      await tx.delete(documents).where(
        and(
          eq(documents.candidateId, candidateId),
          ne(documents.type, "photo"),
          notInArray(
            documents.id,
            existing.filter((doc) => keepUrls.includes(doc.url)).map((doc) => doc.id)
          )
        )
      );
    }

    let inserted = [];
    if (newDocs.length) {
      inserted = await tx
        .insert(documents)
        .values(newDocs.map((d) => ({ ...d, candidateId })))
        .returning();
    }

    return inserted;
  });

  // File cleanup happens after the transaction commits.
  await Promise.all(toDelete.map((doc) => deleteFileIfExists(urlToDiskPath(doc.url))));

  return results;
}

export async function deleteCandidate(id) {
  const [candidate] = await db
    .delete(candidates)
    .where(eq(candidates.id, id))
    .returning({ id: candidates.id });
  return candidate;
}

function endOfDay(dateStr) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}


export async function findAllCandidates(queryParams = {}) {
  const {
    query, page, pageSize, appliedCountry, appliedCategory, companyId,
    visaStatus, afterDate, beforeDate,
  } = queryParams;

  const eqWhere = buildWhereFromQuery(
    candidates,
    { appliedCountry, appliedCategory, companyId, visaStatus },
    ["appliedCountry", "appliedCategory", "companyId", "visaStatus"]
  );

  const dateConditions = [
    afterDate ? gte(candidates.createdAt, new Date(afterDate)) : undefined,
    beforeDate ? lte(candidates.createdAt, endOfDay(beforeDate)) : undefined,
  ].filter(Boolean);

  const where = [eqWhere, ...dateConditions].filter(Boolean).length
    ? and(...[eqWhere, ...dateConditions].filter(Boolean))
    : undefined;

  const dataQuery = db
    .select({
      ...getTableColumns(candidates),
      appliedCategoryName: vacancies.position,
      companyName: companies.name,
    })
    .from(candidates)
    .leftJoin(vacancies, eq(candidates.appliedCategory, vacancies.id))
    .leftJoin(companies, eq(candidates.companyId, companies.id));

  const countQuery = db
    .select({ count: sql`count(*)::int` })
    .from(candidates)
    .leftJoin(vacancies, eq(candidates.appliedCategory, vacancies.id))
    .leftJoin(companies, eq(candidates.companyId, companies.id));

  return paginateAndSearch(
    { dataQuery, countQuery },
    {
      query,
      searchFields: [candidates.name, candidates.passportNumber],
      where,
      orderBy: candidates.createdAt,
      page,
      pageSize,
    }
  );
}

export async function updateCandidate(id, data) {
  return db.transaction(async (tx) => {
    const [before] = await tx
      .select({
        name: candidates.name,
        ...Object.fromEntries(STATUS_COLUMNS.map((col) => [col, candidates[col]])),
      })
      .from(candidates)
      .where(eq(candidates.id, id))
      .for("update");

    if (!before) return null;

    const [candidate] = await tx
      .update(candidates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();

    const changedStatusFields = STATUS_COLUMNS.filter(
      (col) => col in data && data[col] !== before[col]
    );

    for (const field of changedStatusFields) {
      const rule = STATUS_FIELD_RULES[field];
      const from = before[field];
      const to = candidate[field];

      for (const role of rule.roles) {
        await tx.insert(notifications).values({
          role,
          type: `candidate.${field}_changed`,
          title: `${before.name}: ${rule.label} changed from ${from ?? "—"} to ${to ?? "—"}`,
          data: { candidateName: before.name, candidateId: id, field, from, to },
        });
      }
    }

    return candidate;
  });
}
