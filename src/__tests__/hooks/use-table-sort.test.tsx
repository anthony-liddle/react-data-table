import { act, render, renderHook } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SortItem, TableSort } from '@/components/data-table/types';
import { useTableSort } from '@/hooks/use-table-sort';
import { serializeSortBy } from '@/lib/sort-by';

const COLUMNS = ['name', 'team', 'role'];
const name: SortItem = { key: 'name', direction: 'asc' };

// Whether a URL is a link is remembered per key for the whole document, so
// every test persists under a key of its own.
let keys = 0;
const freshKey = () => `sort${++keys}`;

const setSearch = (search: string) =>
  window.history.replaceState(null, '', search ? `/?${search}` : '/');

afterEach(() => {
  localStorage.clear();
  setSearch('');
});

describe('useTableSort', () => {
  it('returns the sort prop', () => {
    const { result } = renderHook(() => useTableSort());
    const prop: TableSort = result.current;
    expect(prop.sortBy).toEqual([]);
  });

  it('keeps sortBy stable across renders with an inline defaultSortBy', () => {
    let fetches = 0;
    const Probe = ({ persistKey }: { persistKey?: string }) => {
      const sort = useTableSort({ defaultSortBy: [{ key: 'name', direction: 'asc' }], persistKey });
      const [, setRows] = useState(0);
      // A fetch effect keyed on the sort, as a consumer writes it. Capped so a
      // regression fails the test instead of looping forever.
      useEffect(() => {
        fetches += 1;
        if (fetches < 20) {
          setRows(n => n + 1);
        }
      }, [sort.sortBy]);
      return null;
    };
    render(<Probe />);
    expect(fetches).toBe(1);

    fetches = 0;
    render(<Probe persistKey={freshKey()} />);
    expect(fetches).toBe(1);
  });

  it('cycles a column on plain clicks', () => {
    const { result } = renderHook(() => useTableSort({ sortableColumns: COLUMNS }));
    act(() => result.current.onSort('name', { additive: false }));
    expect(result.current.sortBy).toEqual([name]);
    act(() => result.current.onSort('name', { additive: false }));
    expect(result.current.sortBy).toEqual([{ key: 'name', direction: 'desc' }]);
    act(() => result.current.onSort('name', { additive: false }));
    expect(result.current.sortBy).toEqual([]);
  });

  it('adds, flips and removes keys on additive clicks with multiSort', () => {
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, multiSort: true })
    );
    act(() => result.current.onSort('name', { additive: false }));
    act(() => result.current.onSort('team', { additive: true }));
    expect(serializeSortBy(result.current.sortBy)).toBe('name,team');
    act(() => result.current.onSort('team', { additive: true }));
    expect(serializeSortBy(result.current.sortBy)).toBe('name,-team');
    act(() => result.current.onSort('team', { additive: true }));
    expect(serializeSortBy(result.current.sortBy)).toBe('name');
  });

  it('builds on the first of two sort changes in one event', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, multiSort: true, onChange })
    );
    act(() => {
      result.current.onSort('name', { additive: false });
      result.current.onSort('team', { additive: true });
    });
    expect(serializeSortBy(result.current.sortBy)).toBe('name,team');
    expect(onChange.mock.calls.map(([sortBy]) => serializeSortBy(sortBy))).toEqual([
      'name',
      'name,team',
    ]);
  });

  it('ignores keys outside sortableColumns, without onChange', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useTableSort({ sortableColumns: COLUMNS, onChange }));
    act(() => result.current.onSort('score', { additive: false }));
    expect(result.current.sortBy).toEqual([]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange once per change, with the next list', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useTableSort({ sortableColumns: COLUMNS, onChange }));
    act(() => result.current.onSort('name', { additive: false }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith([name]);

    act(() => result.current.setSortBy([name]));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('does not call onChange when restoring', () => {
    const key = freshKey();
    localStorage.setItem(`rdt:1:${key}:sort`, 'name');
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, persistKey: key, onChange })
    );
    expect(result.current.sortBy).toEqual([name]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('resets to defaultSortBy and clears with setSortBy([])', () => {
    const onChange = vi.fn();
    const team: SortItem = { key: 'team', direction: 'desc' };
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, defaultSortBy: [team], onChange })
    );
    act(() => result.current.setSortBy([]));
    expect(result.current.sortBy).toEqual([]);
    act(() => result.current.reset());
    expect(result.current.sortBy).toEqual([team]);
    expect(onChange).toHaveBeenLastCalledWith([team]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('writes the view once restored', () => {
    const key = freshKey();
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, multiSort: true, persistKey: key })
    );
    expect(window.location.search).toBe(`?${key}.sort=`);

    act(() => result.current.onSort('name', { additive: false }));
    expect(window.location.search).toBe(`?${key}.sort=name`);

    act(() => result.current.onSort('team', { additive: true }));
    act(() => result.current.onSort('team', { additive: true }));
    expect(window.location.search).toBe(`?${key}.sort=name,-team`);
    expect(localStorage.getItem(`rdt:1:${key}:sort`)).toBe('name,-team');
  });

  it('takes a link over storage', () => {
    const key = freshKey();
    setSearch(`${key}.sort=-team`);
    localStorage.setItem(`rdt:1:${key}:sort`, 'name');
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, persistKey: key })
    );
    expect(result.current.sortBy).toEqual([{ key: 'team', direction: 'desc' }]);
  });

  it('restores an empty sort param as unsorted', () => {
    const key = freshKey();
    setSearch(`${key}.sort=`);
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, defaultSortBy: [name], persistKey: key })
    );
    expect(result.current.sortBy).toEqual([]);
  });

  it('drops an invalid sort param to the default', () => {
    const key = freshKey();
    setSearch(`${key}.sort=bogus`);
    const team: SortItem = { key: 'team', direction: 'asc' };
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, defaultSortBy: [team], persistKey: key })
    );
    expect(result.current.sortBy).toEqual([team]);
    expect(window.location.search).toBe(`?${key}.sort=team`);
  });

  it('treats a link without sort as the default, not storage', () => {
    const key = freshKey();
    setSearch(`${key}.page=2`);
    localStorage.setItem(`rdt:1:${key}:sort`, 'name');
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, persistKey: key })
    );
    expect(result.current.sortBy).toEqual([]);
  });

  it('drops a multi-key value in a table without multiSort', () => {
    const key = freshKey();
    localStorage.setItem(`rdt:1:${key}:sort`, 'name,team');
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, persistKey: key })
    );
    expect(result.current.sortBy).toEqual([]);
  });

  it('ignores 0.4 state', () => {
    const key = freshKey();
    setSearch('sort=name&dir=desc');
    localStorage.setItem(`tablesort:${key}:key`, JSON.stringify('name'));
    localStorage.setItem(`tablesort:${key}:dir`, JSON.stringify('desc'));
    const { result } = renderHook(() =>
      useTableSort({ sortableColumns: COLUMNS, persistKey: key })
    );
    expect(result.current.sortBy).toEqual([]);
  });

  it('hydrates with the default, then restores storage into the URL', async () => {
    const key = freshKey();
    localStorage.setItem(`rdt:1:${key}:sort`, 'name');
    const Probe = () => {
      const sort = useTableSort({ sortableColumns: COLUMNS, persistKey: key });
      return <span>{serializeSortBy(sort.sortBy) || 'unsorted'}</span>;
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(<Probe />);
    expect(container.textContent).toBe('unsorted');

    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <Probe />, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe('name');
    expect(window.location.search).toBe(`?${key}.sort=name`);
    container.remove();
  });
});
