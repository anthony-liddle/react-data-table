'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { readPersistedString, writePersisted } from '../components/data-table/persist.ts';
import type { SortDirection } from '../components/data-table/types.ts';

interface UseTableSortProps {
  sortableColumns?: string[];
  defaultSortKey?: string;
  defaultSortDirection?: SortDirection;
  persistKey?: string;
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

// A URL or storage can hold any string; anything but 'asc'/'desc' is no direction.
const toSortDirection = (value: string | null | undefined): SortDirection =>
  value === 'asc' || value === 'desc' ? value : null;

export const useTableSort = ({
  sortableColumns,
  defaultSortKey,
  defaultSortDirection,
  persistKey,
}: UseTableSortProps) => {
  // Lazy initializer: reads persisted state on client, defaults on server
  const [sort, setSort] = useState<string | null>(() => {
    if (typeof window === 'undefined' || !persistKey) {
      return defaultSortKey ?? null;
    }
    return readValidatedSortKey(persistKey, sortableColumns) ?? defaultSortKey ?? null;
  });

  const [direction, setDirection] = useState<SortDirection>(() => {
    if (typeof window === 'undefined' || !persistKey) {
      return toSortDirection(defaultSortDirection);
    }
    // Only honor the persisted direction when the persisted sort key belongs to
    // THIS table. Otherwise a foreign `?sort=score&dir=desc` would still flip the
    // default column's direction even though the foreign key was rejected above.
    if (readValidatedSortKey(persistKey, sortableColumns) == null) {
      return toSortDirection(defaultSortDirection);
    }
    const dir = readPersistedString('dir', `tablesort:${persistKey}:dir`);
    return toSortDirection(dir) ?? toSortDirection(defaultSortDirection);
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
    writePersisted({ sort: sort, dir: direction }, `tablesort:${persistKey}:key`, sort);
    try {
      localStorage.setItem(`tablesort:${persistKey}:dir`, JSON.stringify(direction));
    } catch {
      // ignore
    }
  }, [persistKey, sort, direction]);

  const handleSort = useCallback(
    (key: string) => {
      if (sortableColumns && !sortableColumns.includes(key)) {
        return;
      }
      if (sort !== key) {
        setSort(key);
        setDirection('asc');
      } else if (direction === 'asc') {
        setDirection('desc');
      } else if (direction === 'desc') {
        setSort(null);
        setDirection(null);
      } else {
        setSort(key);
        setDirection('asc');
      }
    },
    [sort, direction, sortableColumns]
  );

  const setSortDirection = useCallback((direction: SortDirection) => {
    setDirection(toSortDirection(direction));
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
