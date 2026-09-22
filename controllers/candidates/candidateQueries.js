// src/modules/candidates/candidateQueries.js
import { and, eq } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import { db } from "#/config/db.js";
import { candidates, documents } from "#/schema/index.js";
import { paginateAndSearch, buildWhereFromQuery } from "#/utils/queryhelper.js";

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
// Converts a stored document url (e.g. "/uploads/documents/visa/uuid.pdf")
// back into its absolute path on disk, so the old file can be removed
// when it's replaced by a new upload.
// ---------------------------------------------------------------------------

function urlToDiskPath(url) {
  // url looks like "/uploads/documents/visa/uuid.pdf"
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
// Upserts documents by (candidateId, type):
//   - if a document of that type already exists for this candidate, replace
//     its url/fileType and delete the old file from disk
//   - otherwise insert a new row
// Relies on the unique_candidate_document constraint on (candidate_id, type).
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

        // Only queue the old file for deletion once the DB write succeeds,
        // and only if the url actually changed.
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

  // File cleanup happens after the transaction commits, so a failed
  // transaction never leaves us having deleted a file we still need.
  await Promise.all(
    oldFilesToDelete.map((url) => deleteFileIfExists(urlToDiskPath(url)))
  );

  return results;
}

export async function deleteCandidate(id) {
  const [candidate] = await db
    .delete(candidates)
    .where(eq(candidates.id, id))
    .returning({ id: candidates.id });
  return candidate;
}

export async function findAllCandidates(queryParams = {}) {
  const { query, page, pageSize, appliedCountry } = queryParams;

  const where = buildWhereFromQuery(candidates, { appliedCountry }, ["appliedCountry"]);

  return paginateAndSearch(candidates, {
    query,
    searchFields: [candidates.name, candidates.passportNumber],
    where,
    orderBy: candidates.createdAt,
    page,
    pageSize,
  });
}

export async function updateCandidate(id, data) {
  const [candidate] = await db
    .update(candidates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(candidates.id, id))
    .returning();
  return candidate;
}
