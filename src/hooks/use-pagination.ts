'use client';

import { useCallback, useState } from 'react';

import type { TablePagination } from '../components/data-table/types.ts';

/**
 * Page-based pagination for offset or page-number APIs and in-memory arrays.
 * Send `offset` and `limit` with the request (or slice the array with them),
 * then pass `getPagination(totalCount)` to `DataTable`'s `pagination` prop.
 * The total usually arrives with the page the offset fetched, which is why the
 * table's prop is built from it at render time rather than passed in up front.
 *
 * For GraphQL connection queries, use `useCursorPagination` instead.
 */
export const usePagination = (pageSize: number) => {
  const [pageIndex, setPageIndex] = useState(0);
  const offset = pageIndex * pageSize;
  const hasPreviousPage = pageIndex > 0;

  const goToNext = useCallback(() => setPageIndex(i => i + 1), []);
  const goToPrevious = useCallback(() => setPageIndex(i => Math.max(0, i - 1)), []);
  const reset = useCallback(() => setPageIndex(0), []);

  const getPagination = (totalCount: number): TablePagination => {
    const hasNextPage = offset + pageSize < totalCount;
    return {
      totalCount,
      pageIndex,
      pageSize,
      hasNextPage,
      hasPreviousPage,
      handleNextPage: () => {
        if (hasNextPage) {
          goToNext();
        }
      },
      handlePreviousPage: goToPrevious,
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
  };
};
