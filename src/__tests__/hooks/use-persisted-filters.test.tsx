import { act, renderHook } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePersistedFilters } from '@/hooks/use-persisted-filters';
import { useTableSort } from '@/hooks/use-table-sort';

const team = {
  param: 'team',
  defaultValue: 'all',
  serialize: (value: string) => (value === 'all' ? null : value),
  deserialize: (raw: string) => raw,
};
const role = {
  param: 'role',
  defaultValue: 'any',
  serialize: (value: string) => (value === 'any' ? null : value),
  deserialize: (raw: string) => {
    if (raw === 'bad') {
      throw new Error('not a role');
    }
    return raw;
  },
};
const TEAM = { team };
const TEAM_AND_ROLE = { team, role };

// Whether a URL is a link is remembered per key for the whole document, so
// every test persists under a key of its own.
let keys = 0;
const freshKey = () => `filters${++keys}`;
const setSearch = (search: string) =>
  window.history.replaceState(null, '', search ? `/?${search}` : '/');
const store = (key: string, value: Record<string, string>) =>
  localStorage.setItem(`rdt:1:${key}:filters`, JSON.stringify(value));

afterEach(() => {
  setSearch('');
  localStorage.clear();
});

describe('usePersistedFilters', () => {
  it('returns filters, setFilter, reset and isRestored', () => {
    const key = freshKey();
    const { result } = renderHook(() => usePersistedFilters(key, TEAM));
    expect(result.current.filters.team).toBe('all');
    expect(result.current.isRestored).toBe(true);
    act(() => result.current.setFilter('team', 'Design'));
    expect(result.current.filters.team).toBe('Design');
    act(() => result.current.reset());
    expect(result.current.filters.team).toBe('all');
  });

  it('reads its namespaced param', () => {
    const key = freshKey();
    setSearch(`${key}.team=Design`);
    const { result } = renderHook(() => usePersistedFilters(key, TEAM));
    expect(result.current.filters.team).toBe('Design');
  });

  it('writes its namespaced param and storage, and removes a default', () => {
    const key = freshKey();
    const { result } = renderHook(() => usePersistedFilters(key, TEAM));
    act(() => result.current.setFilter('team', 'Design'));
    expect(window.location.search).toBe(`?${key}.team=Design`);
    expect(localStorage.getItem(`rdt:1:${key}:filters`)).toBe('{"team":"Design"}');

    act(() => result.current.setFilter('team', 'all'));
    expect(window.location.search).toBe('');
    expect(localStorage.getItem(`rdt:1:${key}:filters`)).toBe('{}');
  });

  it("keeps two tables' filters apart", () => {
    const [a, b] = [freshKey(), freshKey()];
    setSearch(`${a}.team=Design&${b}.team=Sales`);
    const first = renderHook(() => usePersistedFilters(a, TEAM)).result;
    const second = renderHook(() => usePersistedFilters(b, TEAM)).result;
    expect(first.current.filters.team).toBe('Design');
    expect(second.current.filters.team).toBe('Sales');

    act(() => first.current.setFilter('team', 'Ops'));
    expect(new URLSearchParams(window.location.search).get(`${b}.team`)).toBe('Sales');
  });

  it('treats a link without the filter as its default', () => {
    const key = freshKey();
    setSearch(`${key}.sort=`);
    store(key, { team: 'Design' });
    const { result } = renderHook(() => usePersistedFilters(key, TEAM));
    expect(result.current.filters.team).toBe('all');
  });

  it('restores from storage when the URL is not a link', () => {
    const key = freshKey();
    store(key, { team: 'Design' });
    const { result } = renderHook(() => usePersistedFilters(key, TEAM));
    expect(result.current.filters.team).toBe('Design');
  });

  it('reads the URL and never writes storage when persistToStorage is false', () => {
    const key = freshKey();
    store(key, { team: 'Sales' });
    const { result } = renderHook(() =>
      usePersistedFilters(key, TEAM, { persistToStorage: false })
    );
    expect(result.current.filters.team).toBe('all');

    act(() => result.current.setFilter('team', 'Design'));
    expect(window.location.search).toBe(`?${key}.team=Design`);
    expect(localStorage.getItem(`rdt:1:${key}:filters`)).toBe('{"team":"Sales"}');
  });

  it('gives a throwing deserialize its default and keeps the other filters', () => {
    const key = freshKey();
    setSearch(`${key}.team=Design&${key}.role=bad`);
    const { result } = renderHook(() => usePersistedFilters(key, TEAM_AND_ROLE));
    expect(result.current.filters).toEqual({ team: 'Design', role: 'any' });
  });

  it('ignores 0.4 state', () => {
    const key = freshKey();
    setSearch('team=Design');
    localStorage.setItem(`filters:${key}`, JSON.stringify({ team: 'Design' }));
    const { result } = renderHook(() => usePersistedFilters(key, TEAM));
    expect(result.current.filters.team).toBe('all');
  });

  it('restores from storage when it mounts after another hook with its key has written', () => {
    const key = freshKey();
    renderHook(() => useTableSort({ persistKey: key }));
    expect(window.location.search).toBe(`?${key}.sort=`);
    store(key, { team: 'Design' });

    const { result } = renderHook(() => usePersistedFilters(key, TEAM));
    expect(result.current.filters.team).toBe('Design');
  });

  it('follows the link when it mounts after another hook has written the link back', () => {
    const key = freshKey();
    setSearch(`${key}.sort=-team`);
    renderHook(() => useTableSort({ persistKey: key, sortableColumns: ['team'] }));
    store(key, { team: 'Design' });

    const { result } = renderHook(() => usePersistedFilters(key, TEAM));
    expect(result.current.filters.team).toBe('all');
  });

  it('keeps both of two setFilter calls in one handler', () => {
    const key = freshKey();
    const { result } = renderHook(() => usePersistedFilters(key, TEAM_AND_ROLE));
    act(() => {
      result.current.setFilter('team', 'Design');
      result.current.setFilter('role', 'admin');
    });
    expect(result.current.filters).toEqual({ team: 'Design', role: 'admin' });
  });

  it('hydrates without a mismatch, then restores', async () => {
    const key = freshKey();
    store(key, { team: 'Design' });
    const Probe = () => {
      const { filters } = usePersistedFilters(key, TEAM);
      return <span>{String(filters.team)}</span>;
    };
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(<Probe />);
    expect(container.textContent).toBe('all');

    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <Probe />, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe('Design');
    container.remove();
  });
});
