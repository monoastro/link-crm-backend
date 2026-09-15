import { eq } from "drizzle-orm";
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
    searchFields: [candidates.name, candidates.passport],
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
