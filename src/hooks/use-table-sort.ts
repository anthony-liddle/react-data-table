'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { readPersistedString, writePersisted } from '../components/data-table/persist.ts';
import { SortOrder } from '../components/data-table/types.ts';

interface UseTableSortProps {
  sortableColumns?: string[];
  defaultSortKey?: string;
  defaultSortDirection?: SortOrder;
  persistKey?: string;
  /**
   * Called when the sort handler throws. Route it to your own error reporter;
   * defaults to console.error.
   */
  onError?: (context: string, error: unknown) => void;
}

// The `sort`/`dir` params are shared across every table on the site (the URL
// param names aren't namespaced), so a persisted value can belong to a DIFFERENT
// table, e.g. a leaderboard sorted by `score`. Honor a persisted
// sort key only when it names a real column of THIS table; otherwise a foreign
// key flows into the query as an invalid sort enum (fetch fails) and server and
// client disagree on the active column (hydration mismatch). Mirrors the
// `sortableColumns` guard already applied on click in `handleSort`. Returns null
// when there is no usable persisted key, which also gates the direction below so
// a rejected key can't leak its `dir` either.
const readValidatedSortKey = (
  persistKey: string,
  sortableColumns: string[] | undefined
): string | null => {
  const persisted = readPersistedString('sort', `tablesort:${persistKey}:key`);
  if (persisted != null && (!sortableColumns || sortableColumns.includes(persisted))) {
    return persisted;
  }
  return null;
};

export const useTableSort = ({
  sortableColumns,
  defaultSortKey,
  defaultSortDirection,
  persistKey,
  onError = (context, error) => console.error(context, error),
}: UseTableSortProps) => {
  // Lazy initializer: reads persisted state on client, defaults on server
  const [sort, setSort] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !persistKey) {
      return defaultSortKey ?? null;
    }
    return readValidatedSortKey(persistKey, sortableColumns) ?? defaultSortKey ?? null;
  });

  const [direction, setDirection] = useState<SortOrder | null>(() => {
    if (typeof window === 'undefined' || !persistKey) {
      return defaultSortDirection ?? null;
    }
    // Only honor the persisted direction when the persisted sort key belongs to
    // THIS table. Otherwise a foreign `?sort=score&dir=desc` would still flip the
    // default column's direction even though the foreign key was rejected above.
    if (readValidatedSortKey(persistKey, sortableColumns) == null) {
      return defaultSortDirection ?? null;
    }
    const dir = readPersistedString('dir', `tablesort:${persistKey}:dir`);
    if (dir === 'desc' || dir === 'DESC') {
      return SortOrder.Desc;
    }
    if (dir === 'asc' || dir === 'ASC') {
      return SortOrder.Asc;
    }
    return defaultSortDirection ?? null;
  });

  // Persist sort state to URL + localStorage when it changes
  const isFirstPersist = useRef(true);
  useEffect(() => {
    if (!persistKey) {
      return;
    }
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }
    const dirStr =
      direction === SortOrder.Desc ? 'desc' : direction === SortOrder.Asc ? 'asc' : null;
    writePersisted({ sort: sort, dir: dirStr }, `tablesort:${persistKey}:key`, sort);
    try {
      localStorage.setItem(`tablesort:${persistKey}:dir`, JSON.stringify(dirStr));
    } catch {
      // ignore
    }
  }, [persistKey, sort, direction]);

  const handleSort = useCallback(
    (key: string) => {
      try {
        if (!sortableColumns || sortableColumns.includes(key)) {
          if (sort !== key) {
            setSort(key);
            setDirection(SortOrder.Asc);
          } else {
            if (direction === SortOrder.Asc) {
              setDirection(SortOrder.Desc);
            } else if (direction === SortOrder.Desc) {
              setSort(null);
              setDirection(null);
            } else {
              setSort(key);
              setDirection(SortOrder.Asc);
            }
          }
        }
      } catch (error) {
        onError('useTableSort - handleSort', error);
      }
    },
    [sort, direction, sortableColumns, onError]
  );

  const setSortDirection = useCallback((direction: SortOrder) => {
    setDirection(direction);
  }, []);

  const setSortKey = useCallback((key: string) => {
    setSort(key);
  }, []);

  const reset = useCallback(() => {
    setSort(null);
    setDirection(null);
  }, []);

  return {
    sort,
    direction,
    handleSort,
    setSortDirection,
    setSortKey,
    reset,
  };
};
