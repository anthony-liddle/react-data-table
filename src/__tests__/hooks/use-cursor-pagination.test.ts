import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCursorPagination } from '@/hooks/use-cursor-pagination';

// Relay-style forward pagination for GraphQL connection queries. The hook keeps
// a stack of cursors so Previous returns to exactly the page the user came from.

const page = (endCursor: string) => ({ hasNextPage: true, endCursor });

describe('useCursorPagination', () => {
  it('requests the first page with no cursor', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    expect(result.current.variables).toEqual({ first: 10, after: null });
    expect(result.current.pageIndex).toBe(0);
  });

  it('builds the table prop from the page info', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    expect(result.current.getPagination(page('c10'))).toMatchObject({
      pageIndex: 0,
      pageSize: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('wires Next to the page info', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    act(() => result.current.getPagination(page('c1')).onNextPage());
    expect(result.current.variables.after).toBe('c1');
    expect(result.current.pageIndex).toBe(1);
  });

  it('goes back with onPreviousPage', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    act(() => result.current.getPagination(page('c10')).onNextPage());
    act(() => result.current.getPagination(page('c20')).onNextPage());
    expect(result.current.variables.after).toBe('c20');
    expect(result.current.getPagination(page('c30')).hasPreviousPage).toBe(true);

    act(() => result.current.getPagination(page('c30')).onPreviousPage());
    expect(result.current.variables.after).toBe('c10');
    expect(result.current.pageIndex).toBe(1);
  });

  it.each([
    ['there is no next page', { hasNextPage: false, endCursor: 'c10' }],
    ['the end cursor is missing', { hasNextPage: true, endCursor: null }],
    ['there is no page info', null],
  ])('stays put when %s', (_, pageInfo) => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    act(() => result.current.getPagination(pageInfo).onNextPage());
    expect(result.current.variables.after).toBeNull();
    expect(result.current.pageIndex).toBe(0);
  });

  it('ignores a second Next with the same page info, as while the next page loads', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    const shown = page('c10');
    act(() => result.current.getPagination(shown).onNextPage());
    act(() => result.current.getPagination(shown).onNextPage());
    expect(result.current.pageIndex).toBe(1);
    expect(result.current.variables.after).toBe('c10');
  });

  it('stays on the first page after Previous there, so Next goes to page 2', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    act(() => result.current.getPagination(page('c10')).onPreviousPage());
    act(() => result.current.getPagination(page('c10')).onNextPage());
    expect(result.current.pageIndex).toBe(1);
    expect(result.current.variables.after).toBe('c10');
  });

  it('has no next page without an end cursor', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    expect(result.current.getPagination({ hasNextPage: true, endCursor: null }).hasNextPage).toBe(
      false
    );
  });

  it('has no next page without page info', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    expect(result.current.getPagination(undefined).hasNextPage).toBe(false);
  });

  it('passes the total through', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    expect(result.current.getPagination(page('c'), 42).totalCount).toBe(42);
    expect(result.current.getPagination(page('c')).totalCount).toBeUndefined();
  });

  it('resets to the first page', () => {
    const { result } = renderHook(() => useCursorPagination({ pageSize: 10 }));
    act(() => result.current.getPagination(page('c10')).onNextPage());
    act(() => result.current.reset());
    expect(result.current.variables.after).toBeNull();
    expect(result.current.pageIndex).toBe(0);
  });
});
