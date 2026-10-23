/*
 * Convert a string to a key
 * @param str - The string to convert
 * @returns The key
 */
export const stringToKey = (str: string | undefined) => {
  return str?.toLowerCase().replace(/ /g, '_') || crypto.randomUUID();
};
