function isEqual(a, b) {
  // Handle Date objects (common with Drizzle timestamp columns)
  if (a instanceof Date || b instanceof Date) {
    return new Date(a).getTime() === new Date(b).getTime();
  }

  // Handle plain objects/arrays (e.g. jsonb columns)
  if (
    a !== null &&
    b !== null &&
    typeof a === 'object' &&
    typeof b === 'object'
  ) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return a === b;
}

export function comparator(existing, current) {
  const changes = {};

  for (const key of Object.keys(current)) {
    if (!(key in existing)) continue; // ignore fields that don't exist on the record

    const currentVal = current[key];
    const existingVal = existing[key];

    if (!isEqual(currentVal, existingVal)) {
      changes[key] = currentVal;
    }
  }

  return changes;
}
