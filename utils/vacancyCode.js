// src/utils/vacancyCode.js
import { sql } from "drizzle-orm";

function getInitials(str) {
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("");
}

function getPrefix(companyName, position) {
  return `${getInitials(companyName)}_${getInitials(position)}_`;
}

/**
 * Serializes vacancy-code generation for one company for the duration of the
 * current transaction. The unique constraint remains the final safeguard.
 */
export async function lockVacancyCodeGeneration(tx, companyId) {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(
      hashtextextended(CAST(${companyId} AS text), 0)
    )`,
  );
}

/**
 * Generates codes like "AC_BE_001" for a batch of vacancies.
 *
 * Existing codes are supplied by the caller so the database is read once per
 * batch. New codes are then allocated in memory, grouped by their prefix.
 */
export function generateVacancyCodes({ companyName, vacancyPayloads, existingCodes = [] }) {
  const nextSequenceByPrefix = new Map();

  for (const code of existingCodes) {
    const separatorIndex = code.lastIndexOf("_");
    if (separatorIndex === -1) continue;

    const sequenceText = code.slice(separatorIndex + 1);
    if (!/^\d+$/.test(sequenceText)) continue;

    const sequence = Number(sequenceText);
    if (!Number.isSafeInteger(sequence)) continue;

    const prefix = code.slice(0, separatorIndex + 1);
    const currentMax = nextSequenceByPrefix.get(prefix) ?? 0;
    nextSequenceByPrefix.set(prefix, Math.max(currentMax, sequence));
  }

  return vacancyPayloads.map((vacancy) => {
    const prefix = getPrefix(companyName, vacancy.position);
    const sequence = (nextSequenceByPrefix.get(prefix) ?? 0) + 1;
    nextSequenceByPrefix.set(prefix, sequence);

    return {
      ...vacancy,
      code: `${prefix}${String(sequence).padStart(3, "0")}`,
    };
  });
}
