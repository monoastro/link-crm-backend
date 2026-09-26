// src/modules/companies/companyQueries.js
import { eq, inArray } from "drizzle-orm";
import { db } from "#/config/db.js";
import { companies, vacancies } from "#/schema/index.js";
import { paginateAndSearch } from "#/utils/queryhelper.js";
import { diffIds } from "#/utils/diffid.js";
import { generateVacancyCode } from "#/utils/vacancyCode.js";

export async function findCompanyById(id) {
  return db.query.companies.findFirst({
    where: eq(companies.id, id),
    with: { parentCompany: true, vacancies: true },
  });
}

export async function createCompany(data) {
  const { vacancies: vacancyPayloads, ...companyData } = data;

  return db.transaction(async (tx) => {
    const [company] = await tx.insert(companies).values(companyData).returning();

    if (vacancyPayloads?.length) {
      const withCodes = [];
      const reservedCodes = new Set();
      for (const v of vacancyPayloads) {
        const code = await generateVacancyCode(tx, {
          companyId: company.id,
          companyName: company.name,
          position: v.position,
          reservedCodes,
        });
        reservedCodes.add(code);
        withCodes.push({ ...v, code, companyId: company.id });
      }
      await tx.insert(vacancies).values(withCodes);
    }

    return company;
  });
}

export async function updateCompany(id, data) {
  const { vacancies: vacancyPayloads, ...companyData } = data;

  return db.transaction(async (tx) => {
    const [company] = await tx
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();

    if (vacancyPayloads) {
      const existing = await tx.select().from(vacancies).where(eq(vacancies.companyId, id));

      // client sends `code` for vacancies that already exist; new ones have no code
      const newVacancies = vacancyPayloads.filter((v) => !v.code);
      const incomingWithCode = vacancyPayloads.filter((v) => v.code);

      const { remove, add: invalidCodes, update } = diffIds(existing, incomingWithCode, {
        getId: (v) => v.code,
        isEqual: (oldV, newV) =>
          oldV.position === newV.position &&
          oldV.openings === newV.openings &&
          oldV.status === newV.status,
      });

      // codes sent by client that don't match any existing vacancy for this company —
      // treat as a client error rather than silently inserting under a fabricated identity
      if (invalidCodes.length) {
        throw new Error(
          `Unknown vacancy code(s) for this company: ${invalidCodes.map((v) => v.code).join(", ")}`
        );
      }

      if (remove.length) {
        await tx.delete(vacancies).where(inArray(vacancies.id, remove.map((v) => v.id)));
      }

      if (update.length) {
        const existingByCode = new Map(existing.map((v) => [v.code, v]));
        for (const v of update) {
          const match = existingByCode.get(v.code);
          await tx
            .update(vacancies)
            .set({
              position: v.position,
              openings: v.openings,
              status: v.status,
              updatedAt: new Date(),
            })
            .where(eq(vacancies.id, match.id));
        }
      }

      if (newVacancies.length) {
        const withCodes = [];
        const reservedCodes = new Set(existing.map((v) => v.code));
        for (const v of newVacancies) {
          const code = await generateVacancyCode(tx, {
            companyId: id,
            companyName: company.name,
            position: v.position,
            reservedCodes,
          });
          reservedCodes.add(code);
          withCodes.push({ ...v, code, companyId: id });
        }
        await tx.insert(vacancies).values(withCodes);
      }
    }

    return company;
  });
}

export async function deleteCompany(id) {
  const [company] = await db
    .delete(companies)
    .where(eq(companies.id, id))
    .returning({ id: companies.id });
  return company;
}

export async function findAllCompanies(queryParams = {}) {
  const { query, page, pageSize } = queryParams;
  return paginateAndSearch(companies, {
    query,
    searchFields: [companies.name],
    orderBy: companies.createdAt,
    page,
    pageSize,
  });
}
