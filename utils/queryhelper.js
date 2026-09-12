import { sql, ilike, or, and } from "drizzle-orm";
import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../../config/db.js";

const JOIN_METHODS = {
  inner: "innerJoin",
  left: "leftJoin",
  right: "rightJoin",
  full: "fullJoin",
};

// Builds a base data/count query pair from a single table
export function fromTable(table) {
  return {
    dataQuery: db.select().from(table),
    countQuery: db.select({ count: sql`count(*)::int` }).from(table),
  };
}

// Builds a base data/count query pair from a join — pass this into paginateAndSearch
export function join(
  baseTable,
  joinTable,
  { on, fields, type = "inner", name } = {},
) {
  const method = JOIN_METHODS[type];
  if (!method) throw new Error(`Unknown join type: ${type}`);

  const columns = fields ?? {
    ...getTableColumns(baseTable),
    ...getTableColumns(joinTable),
  };

  const dataQuery = (fields ? db.select(fields) : db.select())
    .from(baseTable)
    [method](joinTable, on);

  const countQuery = db
    .select({ count: sql`count(*)::int` })
    .from(baseTable)
    [method](joinTable, on);

  return { dataQuery, countQuery, columns, name, baseTable };
}

export async function paginateAndSearch(
  source, // a Table, OR the { dataQuery, countQuery } object returned by join()
  {
    query = "",
    searchFields = [],
    where,
    orderBy,
    page = 1,
    pageSize = 20,
  } = {},
) {
  const { dataQuery: baseData, countQuery: baseCount } =
    source && source.dataQuery ? source : fromTable(source);

  const searchCondition =
    query.trim() !== "" && searchFields.length > 0
      ? or(...searchFields.map((field) => ilike(field, `%${query}%`)))
      : undefined;

  const conditions = [searchCondition, where].filter(Boolean);
  const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

  let dataQuery = baseData;
  let countQuery = baseCount;

  if (finalWhere) {
    dataQuery = dataQuery.where(finalWhere);
    countQuery = countQuery.where(finalWhere);
  }
  if (orderBy) dataQuery = dataQuery.orderBy(orderBy);

  const offset = (Number(page) - 1) * pageSize;
  const [items, countResult] = await Promise.all([
    dataQuery.limit(Number(pageSize)).offset(offset),
    countQuery,
  ]);

  const total = countResult[0].count;
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function buildWhereFromQuery(
  table,
  queryParams = {},
  allowedFields = [],
) {
  const columns = table.columns ?? getTableColumns(table);
  const conditions = [];

  for (const key of allowedFields) {
    if (!(key in columns)) continue; // guard against typos in allowedFields itself

    const value = queryParams[key];
    if (value === undefined || value === null || value === "") continue;

    const column = columns[key];
    conditions.push(eq(column, coerceValue(value, column)));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function coerceValue(value, column) {
  const dataType = column.dataType;

  if (dataType === "number" && !isNaN(value)) return Number(value);
  if (dataType === "boolean") return value === "true" || value === true;
  if (dataType === "date") return new Date(value);

  return value;
}
