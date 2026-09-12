export function diffIds(oldIds, newIds) {
  if (!Array.isArray(oldIds) || !Array.isArray(newIds)) {
    throw new TypeError("diffIds expects two arrays");
  }

  const isValidId = (id) => typeof id === "number" || typeof id === "string";

  if ((oldIds.length && newIds.length) && ![...oldIds, ...newIds].every(isValidId)) {
    throw new TypeError("diffIds only supports number or string ids");
  }

  const normalize = (id) => (typeof id === "string" ? id.toLowerCase() : id);

  const oldSet = new Set(oldIds.map(normalize));
  const newSet = new Set(newIds.map(normalize));

  return {
    remove: oldIds.filter((id) => !newSet.has(normalize(id))),
    add: newIds.filter((id) => !oldSet.has(normalize(id))),
  };
}
