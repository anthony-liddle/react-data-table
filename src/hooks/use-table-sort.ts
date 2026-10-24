'use client';

import { useCallback, useRef } from 'react';

import type { SortItem, TableSort } from '../components/data-table/types.ts';
import {
  isLink,
  readParam,
  readStorage,
  storageKey,
  writeParams,
  writeStorage,
} from '../lib/persistence.ts';
import { nextSortBy, parseSortBy, serializeSortBy } from '../lib/sort-by.ts';
import { usePersistedState } from './use-persisted-state.ts';

export interface UseTableSortOptions {
  /** Keys a header click may sort by. Others are ignored, and a persisted sort naming one is dropped. */
  sortableColumns?: string[];
  /** The sort before any click, and what `reset()` returns to. Defaults to unsorted. */
  defaultSortBy?: SortItem[];
  /** Lets Shift+click (or Shift+Enter) add a column as the next sort key. Default false. */
  multiSort?: boolean;
  /** Persists the sort in the URL (`{key}.sort=name,-team`) and localStorage under this key. */
  persistKey?: string;
  /** Called with the next sort on every change but a restore, e.g. to reset the page. */
  onChange?: (sortBy: SortItem[]) => void;
}

const NO_SORT: SortItem[] = [];

/**
 * Sort state for `DataTable`. Pass the result to the `sort` prop as it is, and
 * send `sortBy` with your query.
 */
export const useTableSort = ({
  sortableColumns,
  defaultSortBy = NO_SORT,
  multiSort = false,
  persistKey,
  onChange,
}: UseTableSortOptions = {}) => {
  const {
    value: sortBy,
    setValue,
    isRestored,
  } = usePersistedState<SortItem[]>({
    persistKey,
    defaultValue: defaultSortBy,
    serialize: serializeSortBy,
    read: key => {
      // A link is the whole view; otherwise the URL's own value, then storage.
      const raw = isLink(key)
        ? readParam(key, 'sort')
        : (readParam(key, 'sort') ?? readStorage(storageKey(key, 'sort')));
      return raw === null
        ? undefined
        : (parseSortBy(raw, { sortableColumns, multiSort }) ?? undefined);
    },
    write: (key, next) => {
      // Always written, even when unsorted, so a copied link is a whole view.
      const raw = serializeSortBy(next);
      writeParams(key, { sort: raw });
      writeStorage(storageKey(key, 'sort'), raw);
    },
  });

  // onChange runs from the handlers, never from an effect (which would fire on
  // a restore) or a state updater (which StrictMode runs twice).
  const latest = useRef({ sortBy, onChange });
  latest.current = { sortBy, onChange };
  const setSortBy = useCallback(
    (next: SortItem[]) => {
      const { sortBy: current, onChange: notify } = latest.current;
      if (serializeSortBy(next) === serializeSortBy(current)) {
        return;
      }
      latest.current.sortBy = next;
      setValue(next);
      notify?.(next);
    },
    [setValue]
  );

  const onSort = useCallback(
    (key: string, { additive }: { additive: boolean }) => {
      if (sortableColumns && !sortableColumns.includes(key)) {
        return;
      }
      setSortBy(nextSortBy(latest.current.sortBy, key, { additive, multiSort }));
    },
    [sortableColumns, multiSort, setSortBy]
  );

  const reset = useCallback(() => setSortBy(defaultSortBy), [defaultSortBy, setSortBy]);

  return { sortBy, onSort, setSortBy, reset, isRestored } satisfies TableSort & {
    setSortBy: (sortBy: SortItem[]) => void;
    reset: () => void;
    isRestored: boolean;
  };
};
