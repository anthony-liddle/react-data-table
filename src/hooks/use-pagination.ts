'use client';

import { useCallback, useState } from 'react';

/**
 * Relay-style forward pagination input (`{ first, after }`), the shape
 * GraphQL connection queries take. Pass it straight into the query's
 * variables.
 */
export interface PaginationInput {
  first: number;
  after: string | null;
}

// goToNext only needs the cursor and whether another page exists. Accepting this
// structural subset (rather than the full PageInfo) lets callers select just
// `hasNextPage`/`endCursor` without over-fetching the unused page-info fields —
// a full PageInfo is still assignable.
type NextPageInfo = { hasNextPage: boolean; endCursor?: string | null };

export const usePagination = (pageSize: number) => {
  const [history, setHistory] = useState<(string | null)[]>([null]); // stack of cursors
  const [pageIndex, setPageIndex] = useState(0);

  const pagination: PaginationInput = {
    first: pageSize,
    after: history[pageIndex] ?? null,
  };

  const goToNext = useCallback((pageInfo: NextPageInfo | null | undefined) => {
    if (pageInfo?.hasNextPage && pageInfo.endCursor) {
      setHistory(prev => [...prev, pageInfo.endCursor as string]);
      setPageIndex(i => i + 1);
    }
  }, []);

  const goToPrevious = useCallback(() => {
    setHistory(prev => prev.slice(0, -1));
    setPageIndex(i => Math.max(0, i - 1));
  }, []);

  const reset = useCallback(() => {
    setHistory([null]);
    setPageIndex(0);
  }, []);

  return {
    pagination,
    pageIndex,
    goToNext,
    goToPrevious,
    reset,
    hasPreviousPage: pageIndex > 0,
  };
};
