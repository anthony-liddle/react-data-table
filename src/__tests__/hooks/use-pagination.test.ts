import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { usePagination } from '@/hooks/use-pagination';

// Page-based pagination: the hook owns the page index and hands back the
// offset/limit a REST endpoint (or an array slice) needs. The total row count
// usually arrives with the data the offset fetched, so the table's pagination
// prop is built at render time from that total.

describe('usePagination', () => {
  it('starts on the first page with offset 0 and a limit of one page', () => {
    const { result } = renderHook(() => usePagination({ pageSize: 10 }));
    expect(result.current.pageIndex).toBe(0);
    expect(result.current.offset).toBe(0);
    expect(result.current.limit).toBe(10);
  });

  it('moves the offset one page at a time', () => {
    const { result } = renderHook(() => usePagination({ pageSize: 10 }));
    act(() => result.current.goToNext());
    act(() => result.current.goToNext());
    expect(result.current.pageIndex).toBe(2);
    expect(result.current.offset).toBe(20);

    act(() => result.current.goToPrevious());
    expect(result.current.offset).toBe(10);
  });

  it('does not go before the first page', () => {
    const { result } = renderHook(() => usePagination({ pageSize: 10 }));
    act(() => result.current.goToPrevious());
    expect(result.current.pageIndex).toBe(0);
    expect(result.current.offset).toBe(0);
  });

  it('resets to the first page', () => {
    const { result } = renderHook(() => usePagination({ pageSize: 10 }));
    act(() => result.current.goToNext());
    act(() => result.current.reset());
    expect(result.current.offset).toBe(0);
  });

  it('builds the table pagination prop from the total row count', () => {
    const { result } = renderHook(() => usePagination({ pageSize: 10 }));
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
    const { result } = renderHook(() => usePagination({ pageSize: 10 }));
    for (let i = 0; i < advance; i++) {
      act(() => result.current.goToNext());
    }
    expect(result.current.getPagination(total).hasNextPage).toBe(expected);
  });

  it('wires the table controls to the page and ignores Next on the last page', () => {
    const { result } = renderHook(() => usePagination({ pageSize: 10 }));
    act(() => result.current.getPagination(15).onNextPage());
    expect(result.current.pageIndex).toBe(1);

    act(() => result.current.getPagination(15).onNextPage());
    expect(result.current.pageIndex).toBe(1);

    act(() => result.current.getPagination(15).onPreviousPage());
    expect(result.current.pageIndex).toBe(0);
  });
});

describe('usePagination persistence', () => {
  // Whether a URL is a link is remembered per key for the whole document, so
  // every test persists under a key of its own.
  let keys = 0;
  const freshKey = () => `page${++keys}`;
  const setSearch = (search: string) =>
    window.history.replaceState(null, '', search ? `/?${search}` : '/');

  afterEach(() => {
    setSearch('');
    localStorage.clear();
  });

  it('restores the page from the URL', () => {
    const key = freshKey();
    setSearch(`${key}.page=3`);
    const { result } = renderHook(() => usePagination({ pageSize: 10, persistKey: key }));
    expect(result.current.pageIndex).toBe(2);
    expect(result.current.offset).toBe(20);
  });

  it.each(['0', '-1', 'abc', '1.5', ''])('ignores an invalid page %j', value => {
    const key = freshKey();
    setSearch(`${key}.page=${value}`);
    const { result } = renderHook(() => usePagination({ pageSize: 10, persistKey: key }));
    expect(result.current.pageIndex).toBe(0);
  });

  it('writes the page, and removes it on page 1', () => {
    const key = freshKey();
    const { result } = renderHook(() => usePagination({ pageSize: 10, persistKey: key }));
    act(() => result.current.goToNext());
    expect(window.location.search).toBe(`?${key}.page=2`);
    act(() => result.current.goToPrevious());
    expect(window.location.search).toBe('');
  });

  it('never writes storage', () => {
    const key = freshKey();
    const { result } = renderHook(() => usePagination({ pageSize: 10, persistKey: key }));
    act(() => result.current.goToNext());
    expect(localStorage.length).toBe(0);
  });

  it('keeps a page past the end', () => {
    const key = freshKey();
    setSearch(`${key}.page=10`);
    const { result } = renderHook(() => usePagination({ pageSize: 10, persistKey: key }));
    const pagination = result.current.getPagination(25);
    expect(result.current.pageIndex).toBe(9);
    expect(pagination.hasNextPage).toBe(false);
    expect(pagination.hasPreviousPage).toBe(true);
    act(() => pagination.onPreviousPage());
    expect(result.current.pageIndex).toBe(8);
  });

  it('writes nothing without a persistKey', () => {
    const { result } = renderHook(() => usePagination({ pageSize: 10 }));
    act(() => result.current.goToNext());
    expect(window.location.search).toBe('');
    expect(result.current.isRestored).toBe(true);
  });
});
