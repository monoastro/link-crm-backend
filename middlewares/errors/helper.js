export function humanizeField(column) {
  return column
    .replace(/_id$/, "")
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseUniqueViolationDetail(detail) {
  // Postgres detail format: Key (column)=(value) already exists.
  const match = detail?.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
  if (!match) return null;
  const [, column, value] = match;
  return { column, value };
}

export function parseForeignKeyDetail(detail) {
  // Postgres detail format: Key (column)=(value) is not present in table "other_table".
  const match = detail?.match(
    /Key \(([^)]+)\)=\(([^)]+)\) is not present in table "([^"]+)"/,
  );
  if (!match) return null;
  const [, column, value, table] = match;
  return { column, value, table };
}
