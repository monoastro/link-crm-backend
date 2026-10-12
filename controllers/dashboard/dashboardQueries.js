// src/modules/dashboard/dashboardQueries.js
import { sql, eq, desc } from "drizzle-orm";
import { db } from "#/config/db.js";
import { candidates, companies, vacancies } from "#/schema/index.js";

// ---------------------------------------------------------------------------
// Headline numbers
// ---------------------------------------------------------------------------
export async function getOverview() {
  const [cand] = await db
    .select({
      totalCandidates: sql`count(*)::int`,
      selectedCandidates: sql`count(*) filter (where ${candidates.isSelected} = true)::int`,
      deployedCandidates: sql`count(*) filter (where ${candidates.flightStatus} = 'Flown')::int`,
      unassignedCandidates: sql`count(*) filter (where ${candidates.appliedCategory} is null)::int`,
      visaExpiring30d: sql`count(*) filter (
        where ${candidates.visaExpiryDate} between current_date and current_date + interval '30 days'
      )::int`,
    })
    .from(candidates);

  const [comp] = await db
    .select({ totalCompanies: sql`count(*)::int` })
    .from(companies);

  return { ...cand, ...comp };
}

// ---------------------------------------------------------------------------
// One row per vacancy with applied / selected counts. Starts from companies
// and left joins, so a company with no vacancies still produces one row
// (with null vacancy fields). Everything company- and position-level is
// derived from these rows in JS, which avoids double counting.
// ---------------------------------------------------------------------------
export async function getVacancyRows() {
  return db
    .select({
      vacancyId: vacancies.id,
      code: vacancies.code,
      position: vacancies.position,
      status: vacancies.status,
      openings: vacancies.openings,
      companyId: companies.id,
      companyName: companies.name,
      applied: sql`count(${candidates.id})::int`,
      selected: sql`count(${candidates.id}) filter (where ${candidates.isSelected} = true)::int`,
    })
    .from(companies)
    .leftJoin(vacancies, eq(vacancies.companyId, companies.id))
    // same ::text cast as findAllCandidates, for the legacy varchar column
    .leftJoin(
      candidates,
      sql`${candidates.appliedCategory}::text = ${vacancies.id}::text`
    )
    .groupBy(vacancies.id, companies.id);
}

export function buildCompanyStats(rows) {
  const byCompany = new Map();

  for (const r of rows) {
    if (!byCompany.has(r.companyId)) {
      byCompany.set(r.companyId, {
        companyId: r.companyId,
        companyName: r.companyName,
        openVacancies: 0,
        closedVacancies: 0,
        fulfilledVacancies: 0,
        totalOpenings: 0,
        applied: 0,
        selected: 0,
      });
    }
    const c = byCompany.get(r.companyId);

    // company with no vacancies yet: keep the row, add nothing to it
    if (!r.vacancyId) continue;

    if (r.status === "open") {
      c.openVacancies += 1;
      c.totalOpenings += r.openings;
    } else {
      c.closedVacancies += 1;
    }
    if (r.openings > 0 && r.selected >= r.openings) c.fulfilledVacancies += 1;

    c.applied += r.applied;
    c.selected += r.selected;
  }

  return [...byCompany.values()]
    .map((c) => ({
      ...c,
      // selected vs. openings across the company's open vacancies
      fillRate: c.totalOpenings
        ? Math.round((c.selected / c.totalOpenings) * 100)
        : null,
    }))
    .sort((a, b) => b.applied - a.applied);
}

// Pie chart data: share of candidates per position, top N plus "Other".
export function buildPositionDistribution(rows, unassigned = 0, topN = 8) {
  const byPosition = new Map();
  for (const r of rows) {
    if (!r.vacancyId) continue; // companies with no vacancies have no position
    byPosition.set(r.position, (byPosition.get(r.position) ?? 0) + r.applied);
  }

  const sorted = [...byPosition.entries()]
    .map(([label, count]) => ({ label, count }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);

  const top = sorted.slice(0, topN);
  const otherCount = sorted.slice(topN).reduce((sum, p) => sum + p.count, 0);
  if (otherCount) top.push({ label: "Other", count: otherCount });
  if (unassigned) top.push({ label: "No position", count: unassigned });

  const total = top.reduce((sum, p) => sum + p.count, 0);
  return top.map((p) => ({
    ...p,
    percent: total ? Math.round((p.count / total) * 1000) / 10 : 0,
  }));
}

// ---------------------------------------------------------------------------
// Pipeline breakdowns (visa / medical / flight / country)
// ---------------------------------------------------------------------------
export async function countBy(column) {
  const rows = await db
    .select({ label: column, count: sql`count(*)::int` })
    .from(candidates)
    .groupBy(column)
    .orderBy(desc(sql`count(*)`));

  return rows.map((r) => ({ label: r.label ?? "Not set", count: r.count }));
}

// New candidates per month for the last N months (zero months are missing,
// the frontend fills them to keep a continuous axis).
export async function getMonthlyTrend(months = 6) {
  const month = sql`to_char(date_trunc('month', ${candidates.createdAt}), 'YYYY-MM')`;

  return db
    .select({ month, count: sql`count(*)::int` })
    .from(candidates)
    .where(
      sql`${candidates.createdAt} >= date_trunc('month', now()) - make_interval(months => ${months - 1})`
    )
    .groupBy(month)
    .orderBy(month);
}
