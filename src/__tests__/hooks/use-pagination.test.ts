import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePagination } from '@/hooks/use-pagination';

// Page-based pagination: the hook owns the page index and hands back the
// offset/limit a REST endpoint (or an array slice) needs. The total row count
// usually arrives with the data the offset fetched, so the table's pagination
// prop is built at render time from that total.

describe('usePagination', () => {
  it('starts on the first page with offset 0 and a limit of one page', () => {
    const { result } = renderHook(() => usePagination(10));
    expect(result.current.pageIndex).toBe(0);
    expect(result.current.offset).toBe(0);
    expect(result.current.limit).toBe(10);
  });

  it('moves the offset one page at a time', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    expect(result.current.pageIndex).toBe(2);
    expect(result.current.offset).toBe(20);

    act(() => result.current.goToPrevious());
    expect(result.current.offset).toBe(10);
  });

  it('does not go before the first page', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => result.current.goToPrevious());
    expect(result.current.pageIndex).toBe(0);
    expect(result.current.offset).toBe(0);
  });

  it('resets to the first page', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => result.current.goToNext());
    act(() => result.current.reset());
    expect(result.current.offset).toBe(0);
  });

  it('builds the table pagination prop from the total row count', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => result.current.goToNext());
    expect(result.current.getPagination(25)).toMatchObject({
      totalCount: 25,
      pageIndex: 1,
      pageSize: 10,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it.each([
    // [total, pages advanced, hasNextPage]
    [25, 2, false], // last page holds the remaining 5 rows
    [20, 1, false], // the total ends exactly on a page boundary
    [21, 1, true], // one row spills onto a third page
    [0, 0, false], // nothing to page through
  ])('with %i rows after %i pages, hasNextPage is %s', (total, advance, expected) => {
    const { result } = renderHook(() => usePagination(10));
    for (let i = 0; i < advance; i++) {
      act(() => result.current.goToNext());
    }
    expect(result.current.getPagination(total).hasNextPage).toBe(expected);
  });

  it('wires the table controls to the page and ignores Next on the last page', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => result.current.getPagination(15).handleNextPage());
    expect(result.current.pageIndex).toBe(1);

    act(() => result.current.getPagination(15).handleNextPage());
    expect(result.current.pageIndex).toBe(1);

    act(() => result.current.getPagination(15).handlePreviousPage());
    expect(result.current.pageIndex).toBe(0);
  });
});
