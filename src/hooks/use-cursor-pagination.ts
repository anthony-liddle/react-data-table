'use client';

import { useCallback, useState } from 'react';

import type { TablePagination } from '../components/data-table/types.ts';

/**
 * Relay-style forward pagination input (`{ first, after }`), the shape
 * GraphQL connection queries take. Pass it straight into the query's
 * variables. For offset or page-number APIs, use `usePagination` instead.
 */
export interface CursorPaginationInput {
  first: number;
  after: string | null;
}

// goToNext only needs the cursor and whether another page exists. Accepting this
// structural subset (rather than the full PageInfo) lets callers select just
// `hasNextPage`/`endCursor` without over-fetching the unused page-info fields.
// A full PageInfo is still assignable.
type NextPageInfo = { hasNextPage: boolean; endCursor?: string | null };

export interface UseCursorPaginationOptions {
  pageSize: number;
}

/**
 * Forward pagination for GraphQL connections. Send `variables` with the query,
 * then pass `getPagination(pageInfo, totalCount?)` to `DataTable`'s
 * `pagination` prop: Next follows the page info, and Previous returns to
 * exactly the page the user came from. A stack of cursors means nothing in a
 * link, so this hook doesn't persist.
 */
export const useCursorPagination = ({ pageSize }: UseCursorPaginationOptions) => {
  const [history, setHistory] = useState<(string | null)[]>([null]); // stack of cursors
  const [pageIndex, setPageIndex] = useState(0);

  const variables: CursorPaginationInput = {
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
    setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
    setPageIndex(i => Math.max(0, i - 1));
  }, []);

  const reset = useCallback(() => {
    setHistory([null]);
    setPageIndex(0);
  }, []);

  const getPagination = (
    pageInfo: NextPageInfo | null | undefined,
    totalCount?: number
  ): TablePagination => ({
    totalCount,
    pageIndex,
    pageSize,
    hasNextPage: Boolean(pageInfo?.hasNextPage),
    hasPreviousPage: pageIndex > 0,
    onNextPage: () => goToNext(pageInfo),
    onPreviousPage: goToPrevious,
  });

  return { variables, pageIndex, getPagination, reset };
};
