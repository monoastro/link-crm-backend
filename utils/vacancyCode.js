// src/utils/vacancyCode.js
import { and, eq, like } from "drizzle-orm";
import { vacancies } from "#/schema/index.js";

function getInitials(str) {
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("");
}

/**
 * Generates a code like "AC_BE_001"
 * - AC = company initials (from company name)
 * - BE = position initials (from vacancy position)
 * - 001 = next sequence number for that company+position combo
 */
export async function generateVacancyCode(tx, { companyId, companyName, position }) {
  const companyInitials = getInitials(companyName);
  const positionInitials = getInitials(position);
  const prefix = `${companyInitials}_${positionInitials}_`;

  const existing = await tx
    .select({ code: vacancies.code })
    .from(vacancies)
    .where(and(eq(vacancies.companyId, companyId), like(vacancies.code, `${prefix}%`)));

  const maxSeq = existing.reduce((max, v) => {
    const match = v.code.match(new RegExp(`^${prefix}(\\d+)$`));
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);

  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  return `${prefix}${nextSeq}`;
}
