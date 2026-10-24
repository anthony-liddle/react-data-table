'use client';

import { useCallback } from 'react';

import type { TablePagination } from '../components/data-table/types.ts';
import { readParam, writeParams } from '../lib/persistence.ts';
import { usePersistedState } from './use-persisted-state.ts';

export interface UsePaginationOptions {
  pageSize: number;
  /**
   * Keeps the page in the URL as `{key}.page=3` (1-based, absent on page 1).
   * Never in localStorage: a page is worth a link, but stale on a later visit.
   */
  persistKey?: string;
}

const PAGE_NUMBER = /^[1-9]\d*$/;

/**
 * Page-based pagination for offset or page-number APIs and in-memory arrays.
 * Send `offset` and `limit` with the request (or slice the array with them),
 * then pass `getPagination(totalCount)` to `DataTable`'s `pagination` prop.
 * The total usually arrives with the page the offset fetched, which is why the
 * table's prop is built from it at render time rather than passed in up front.
 *
 * A page past the end (from an old link, say) is kept as it is: the table
 * shows its empty state and Previous still works.
 *
 * For GraphQL connection queries, use `useCursorPagination` instead.
 */
export const usePagination = ({ pageSize, persistKey }: UsePaginationOptions) => {
  const {
    value: pageIndex,
    setValue: setPageIndex,
    isRestored,
  } = usePersistedState<number>({
    persistKey,
    defaultValue: 0,
    serialize: String,
    // The page lives in the URL only, so it reads its own param, link or not.
    read: key => {
      const raw = readParam(key, 'page');
      return raw !== null && PAGE_NUMBER.test(raw) ? Number(raw) - 1 : undefined;
    },
    write: (key, index) => writeParams(key, { page: index === 0 ? null : String(index + 1) }),
  });
  const offset = pageIndex * pageSize;
  const hasPreviousPage = pageIndex > 0;

  const goToNext = useCallback(() => setPageIndex(i => i + 1), [setPageIndex]);
  const goToPrevious = useCallback(() => setPageIndex(i => Math.max(0, i - 1)), [setPageIndex]);
  const reset = useCallback(() => setPageIndex(0), [setPageIndex]);

  const getPagination = (totalCount: number): TablePagination => {
    const hasNextPage = offset + pageSize < totalCount;
    return {
      totalCount,
      pageIndex,
      pageSize,
      hasNextPage,
      hasPreviousPage,
      onNextPage: () => {
        if (hasNextPage) {
          goToNext();
        }
      },
      onPreviousPage: goToPrevious,
    };
  };

  return {
    pageIndex,
    offset,
    limit: pageSize,
    goToNext,
    goToPrevious,
    reset,
    hasPreviousPage,
    getPagination,
    isRestored,
  };
};
