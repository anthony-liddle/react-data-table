import type { SortDirection, SortItem } from '../components/data-table/types.ts';

const flip = (direction: SortDirection): SortDirection | null =>
  direction === 'asc' ? 'desc' : null;

/**
 * The sort after a header click. A plain click makes the column the only sort,
 * cycling it unsorted, ascending, descending, unsorted. An additive click (with
 * `multiSort`) appends an unsorted column ascending, turns an ascending one
 * descending in place, and removes a descending one; without `multiSort` it is
 * a plain click.
 */
export const nextSortBy = (
  sortBy: SortItem[],
  key: string,
  { additive, multiSort }: { additive: boolean; multiSort: boolean }
): SortItem[] => {
  const current = sortBy.find(item => item.key === key);
  if (!additive || !multiSort) {
    if (!current) {
      return [{ key, direction: 'asc' }];
    }
    const direction = flip(current.direction);
    return direction ? [{ key, direction }] : [];
  }
  if (!current) {
    return [...sortBy, { key, direction: 'asc' }];
  }
  const direction = flip(current.direction);
  return direction
    ? sortBy.map(item => (item.key === key ? { key, direction } : item))
    : sortBy.filter(item => item.key !== key);
};

/** `name,-team`: keys in priority order, `-` marking descending. Unsorted is `''`. */
export const serializeSortBy = (sortBy: SortItem[]): string =>
  sortBy.map(({ key, direction }) => (direction === 'desc' ? `-${key}` : key)).join(',');

/**
 * Parse a persisted sort, or return `null` when any of it is invalid: an empty
 * segment, a repeated key, a key outside `sortableColumns`, or more than one
 * key in a table without `multiSort`. `''` is a valid empty sort.
 */
export const parseSortBy = (
  raw: string,
  { sortableColumns, multiSort }: { sortableColumns?: string[]; multiSort: boolean }
): SortItem[] | null => {
  if (raw === '') {
    return [];
  }
  const sortBy: SortItem[] = [];
  for (const segment of raw.split(',')) {
    const descending = segment.startsWith('-');
    const key = descending ? segment.slice(1) : segment;
    if (
      key === ''
      || sortBy.some(item => item.key === key)
      || (sortableColumns && !sortableColumns.includes(key))
    ) {
      return null;
    }
    sortBy.push({ key, direction: descending ? 'desc' : 'asc' });
  }
  return sortBy.length > 1 && !multiSort ? null : sortBy;
};
