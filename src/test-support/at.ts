/**
 * Index into a list (query results, fixtures), failing loudly when the item is
 * missing instead of passing `undefined` along. Test and story code only; it
 * is excluded from the package build.
 */
export const at = <T>(items: ArrayLike<T>, index: number): T => {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`Expected an item at index ${index}, but the list has ${items.length}`);
  }
  return item;
};
