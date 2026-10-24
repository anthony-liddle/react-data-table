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
 *
 * Pass the page info of the page `variables` asked for. While a previous page's
 * data stays on screen as the next one loads (keepPreviousData, say), a repeat
 * Next with the same page info is ignored, but pass `undefined` if you can tell
 * the data is a placeholder.
 */
export const useCursorPagination = ({ pageSize }: UseCursorPaginationOptions) => {
  // The cursors that led to each page; the page is the last one.
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const pageIndex = history.length - 1;

  const variables: CursorPaginationInput = {
    first: pageSize,
    after: history[pageIndex] ?? null,
  };

  const goToNext = useCallback((pageInfo: NextPageInfo | null | undefined) => {
    const endCursor = pageInfo?.hasNextPage ? pageInfo.endCursor : null;
    if (endCursor) {
      // The same cursor again means a second click before the page arrived.
      setHistory(prev => (prev[prev.length - 1] === endCursor ? prev : [...prev, endCursor]));
    }
  }, []);

  const goToPrevious = useCallback(() => {
    setHistory(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback(() => setHistory([null]), []);

  const getPagination = (
    pageInfo: NextPageInfo | null | undefined,
    totalCount?: number | null
  ): TablePagination => ({
    totalCount,
    pageIndex,
    pageSize,
    // Next needs a cursor to go to, as well as the promise of a page.
    hasNextPage: Boolean(pageInfo?.hasNextPage && pageInfo.endCursor),
    hasPreviousPage: pageIndex > 0,
    onNextPage: () => goToNext(pageInfo),
    onPreviousPage: goToPrevious,
  });

  return { variables, pageIndex, getPagination, reset };
};
