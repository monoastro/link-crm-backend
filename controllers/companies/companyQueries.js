// src/modules/companies/companyQueries.js
import { eq } from "drizzle-orm";
import { db } from "#/config/db.js";
import { companies } from "#/schema/index.js";
import { paginateAndSearch } from "#/utils/queryhelper.js";

export async function findCompanyById(id) {
  return db.query.companies.findFirst({
    where: eq(companies.id, id),
    with: {
      parentCompany: true,
    },
  });
}

export async function createCompany(data) {
  const [company] = await db.insert(companies).values(data).returning();
  return company;
}

export async function updateCompany(id, data) {
  const [company] = await db
    .update(companies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(companies.id, id))
    .returning();
  return company;
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
