import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SortOrder as SortDirection } from '@/components/data-table/types';
import { useTableSort } from '@/hooks/use-table-sort';

// The `sort`/`dir` table params use GLOBAL (un-namespaced) URL param names, so a
// value persisted by one table can be read by another when the user navigates
// between them (a leaderboard sorts by `score`; a directory table only knows
// NAME/CREATED_AT/UPDATED_AT). Before this guard, that foreign key flowed
// straight into the query as an invalid sort enum → a failed fetch, plus a
// server/client hydration mismatch on the sort icon. The initializer must reject a persisted key that isn't a real
// column of this table and fall back to the default, and NOT leak the foreign
// direction either.

const PERSIST_KEY = 'example-table';
const KEY_STORAGE = `tablesort:${PERSIST_KEY}:key`;
const DIR_STORAGE = `tablesort:${PERSIST_KEY}:dir`;
const COLUMNS = ['NAME', 'CREATED_AT', 'UPDATED_AT'];

const setSearch = (search: string): void => {
  window.history.replaceState(null, '', search ? `/?${search}` : '/');
};

beforeEach(() => {
  localStorage.clear();
  setSearch('');
});

afterEach(() => {
  localStorage.clear();
  setSearch('');
});

describe('useTableSort persisted sort-key validation', () => {
  it('honors a persisted key that is a real column of this table', () => {
    localStorage.setItem(KEY_STORAGE, JSON.stringify('NAME'));
    const { result } = renderHook(() =>
      useTableSort({
        sortableColumns: COLUMNS,
        defaultSortKey: 'UPDATED_AT',
        defaultSortDirection: SortDirection.Desc,
        persistKey: PERSIST_KEY,
      })
    );
    expect(result.current.sort).toBe('NAME');
  });

  it('ignores a foreign key persisted in localStorage and falls back to the default', () => {
    localStorage.setItem(KEY_STORAGE, JSON.stringify('score'));
    const { result } = renderHook(() =>
      useTableSort({
        sortableColumns: COLUMNS,
        defaultSortKey: 'UPDATED_AT',
        defaultSortDirection: SortDirection.Desc,
        persistKey: PERSIST_KEY,
      })
    );
    expect(result.current.sort).toBe('UPDATED_AT');
  });

  it('ignores a foreign key leaked via the shared `?sort=` URL param', () => {
    setSearch('sort=score');
    const { result } = renderHook(() =>
      useTableSort({
        sortableColumns: COLUMNS,
        defaultSortKey: 'UPDATED_AT',
        persistKey: PERSIST_KEY,
      })
    );
    expect(result.current.sort).toBe('UPDATED_AT');
  });

  it('honors any persisted key when the table declares no sortableColumns', () => {
    localStorage.setItem(KEY_STORAGE, JSON.stringify('anything'));
    const { result } = renderHook(() =>
      useTableSort({ defaultSortKey: 'UPDATED_AT', persistKey: PERSIST_KEY })
    );
    expect(result.current.sort).toBe('anything');
  });

  it('does not leak a foreign direction when the foreign sort key was rejected', () => {
    // A leaderboard left `?sort=score&dir=desc`; this table defaults to ascending.
    // The key is rejected AND the direction must not flip the default column.
    setSearch('sort=score&dir=desc');
    const { result } = renderHook(() =>
      useTableSort({
        sortableColumns: COLUMNS,
        defaultSortKey: 'NAME',
        defaultSortDirection: SortDirection.Asc,
        persistKey: PERSIST_KEY,
      })
    );
    expect(result.current.sort).toBe('NAME');
    expect(result.current.direction).toBe('asc');
  });

  it('honors the persisted direction when the persisted sort key is a real column', () => {
    localStorage.setItem(KEY_STORAGE, JSON.stringify('NAME'));
    localStorage.setItem(DIR_STORAGE, JSON.stringify('desc'));
    const { result } = renderHook(() =>
      useTableSort({
        sortableColumns: COLUMNS,
        defaultSortKey: 'UPDATED_AT',
        defaultSortDirection: SortDirection.Asc,
        persistKey: PERSIST_KEY,
      })
    );
    expect(result.current.sort).toBe('NAME');
    expect(result.current.direction).toBe('desc');
  });
});

// The hook reports lowercase directions, the common REST and client-side
// convention. Uppercase SortOrder values are still accepted wherever a direction
// goes in, so GraphQL callers can keep passing them.
describe('useTableSort directions', () => {
  it('cycles a column ascending, descending, then unsorted', () => {
    const { result } = renderHook(() => useTableSort({ sortableColumns: COLUMNS }));

    act(() => result.current.handleSort('NAME'));
    expect(result.current.direction).toBe('asc');

    act(() => result.current.handleSort('NAME'));
    expect(result.current.direction).toBe('desc');

    act(() => result.current.handleSort('NAME'));
    expect(result.current.sort).toBeNull();
    expect(result.current.direction).toBeNull();
  });

  it.each([
    ['DESC', 'desc'],
    ['desc', 'desc'],
    ['ASC', 'asc'],
  ] as const)('reports a %s default direction as %s', (input, expected) => {
    const { result } = renderHook(() =>
      useTableSort({ defaultSortKey: 'NAME', defaultSortDirection: input })
    );
    expect(result.current.direction).toBe(expected);
  });

  it('reports a direction set from either case in lowercase', () => {
    const { result } = renderHook(() => useTableSort({ defaultSortKey: 'NAME' }));
    act(() => result.current.setSortDirection('DESC'));
    expect(result.current.direction).toBe('desc');
    act(() => result.current.setSortDirection('asc'));
    expect(result.current.direction).toBe('asc');
  });
});
