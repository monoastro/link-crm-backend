export function diffIds(oldItems, newItems, options = {}) {
  const { getId = (item) => item, isEqual } = options;

  if (!Array.isArray(oldItems) || !Array.isArray(newItems)) {
    throw new TypeError("diffIds expects two arrays");
  }

  const isValidId = (id) => typeof id === "number" || typeof id === "string";

  const oldIds = oldItems.map(getId);
  const newIds = newItems.map(getId);

  if ((oldIds.length && newIds.length) && ![...oldIds, ...newIds].every(isValidId)) {
    throw new TypeError("diffIds only supports number or string ids");
  }

  const normalize = (id) => (typeof id === "string" ? id.toLowerCase() : id);

  const oldMap = new Map(oldItems.map((item, i) => [normalize(oldIds[i]), item]));
  const newMap = new Map(newItems.map((item, i) => [normalize(newIds[i]), item]));

  const remove = oldItems.filter((item) => !newMap.has(normalize(getId(item))));
  const add = newItems.filter((item) => !oldMap.has(normalize(getId(item))));

  const update = [];
  if (isEqual) {
    for (const [id, newItem] of newMap.entries()) {
      const oldItem = oldMap.get(id);
      if (oldItem !== undefined && !isEqual(oldItem, newItem)) {
        update.push(newItem);
      }
    }
  }

  return { remove, add, update };
}

