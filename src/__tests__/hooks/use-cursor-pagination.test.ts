import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCursorPagination } from '@/hooks/use-cursor-pagination';

// Relay-style forward pagination for GraphQL connection queries. The hook keeps
// a stack of cursors so Previous returns to exactly the page the user came from.

describe('useCursorPagination', () => {
  it('requests the first page with no cursor', () => {
    const { result } = renderHook(() => useCursorPagination(10));
    expect(result.current.pagination).toEqual({ first: 10, after: null });
    expect(result.current.pageIndex).toBe(0);
    expect(result.current.hasPreviousPage).toBe(false);
  });

  it('pages forward with the end cursor and back to the cursor it came from', () => {
    const { result } = renderHook(() => useCursorPagination(10));
    act(() => result.current.goToNext({ hasNextPage: true, endCursor: 'c10' }));
    act(() => result.current.goToNext({ hasNextPage: true, endCursor: 'c20' }));
    expect(result.current.pagination.after).toBe('c20');
    expect(result.current.pageIndex).toBe(2);

    act(() => result.current.goToPrevious());
    expect(result.current.pagination.after).toBe('c10');
    expect(result.current.hasPreviousPage).toBe(true);
  });

  it.each([
    ['there is no next page', { hasNextPage: false, endCursor: 'c10' }],
    ['the end cursor is missing', { hasNextPage: true, endCursor: null }],
    ['there is no page info', null],
  ])('stays put when %s', (_, pageInfo) => {
    const { result } = renderHook(() => useCursorPagination(10));
    act(() => result.current.goToNext(pageInfo));
    expect(result.current.pagination.after).toBeNull();
    expect(result.current.pageIndex).toBe(0);
  });

  it('resets to the first page', () => {
    const { result } = renderHook(() => useCursorPagination(10));
    act(() => result.current.goToNext({ hasNextPage: true, endCursor: 'c10' }));
    act(() => result.current.reset());
    expect(result.current.pagination.after).toBeNull();
    expect(result.current.pageIndex).toBe(0);
  });
});
