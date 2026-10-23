'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type FilterValue = string | number | boolean | string[] | null;

export interface FilterDef {
  param: string;
  defaultValue: FilterValue;
  serialize: (value: never) => string | null;
  deserialize: (raw: string) => FilterValue;
}

export interface PersistedFiltersOptions {
  /**
   * Whether values survive in `localStorage` across visits. Default `true`.
   *
   * Set `false` for state that must reset to its default on every fresh
   * landing (e.g. a tab bar that should always open on its first tab).
   * The URL half is unaffected either way — `?param=` still seeds the state
   * and still tracks it via `replaceState`, so deep links keep working.
   */
  persistToStorage?: boolean;
}

const readFilters = <T extends Record<string, FilterDef>>(
  persistKey: string,
  filters: T,
  persistToStorage: boolean
): Record<string, FilterValue> => {
  const state: Record<string, FilterValue> = {};
  const urlParams = new URLSearchParams(window.location.search);
  let stored: Record<string, string> | null = null;
  try {
    const raw = persistToStorage ? localStorage.getItem(`filters:${persistKey}`) : null;
    stored = raw ? (JSON.parse(raw) as Record<string, string>) : null;
  } catch {
    stored = null;
  }

  for (const [key, def] of Object.entries(filters)) {
    const urlValue = urlParams.get(def.param);
    const storedValue = stored?.[def.param];
    if (urlValue) {
      state[key] = def.deserialize(urlValue);
    } else if (storedValue) {
      state[key] = def.deserialize(storedValue);
    } else {
      state[key] = def.defaultValue;
    }
  }
  return state;
};

export const usePersistedFilters = <T extends Record<string, FilterDef>>(
  persistKey: string,
  filters: T,
  options: PersistedFiltersOptions = {}
): [
  { [K in keyof T]: ReturnType<T[K]['deserialize']> | T[K]['defaultValue'] },
  <K extends keyof T>(
    key: K,
    value: ReturnType<T[K]['deserialize']> | T[K]['defaultValue']
  ) => void,
  () => void,
  boolean,
] => {
  type State = { [K in keyof T]: ReturnType<T[K]['deserialize']> | T[K]['defaultValue'] };

  const { persistToStorage = true } = options;

  // Build defaults
  const defaults = useMemo(() => {
    const s: Record<string, FilterValue> = {};
    for (const [key, def] of Object.entries(filters)) {
      s[key] = def.defaultValue;
    }
    return s as State;
  }, [filters]);

  // Always initialize with defaults to avoid hydration mismatch (server
  // renders defaults, client must match on first render).
  const [state, setState] = useState<State>(defaults);
  const [isRestored, setIsRestored] = useState(false);

  // After hydration (and whenever persistKey changes), read persisted values
  // from URL params / localStorage. This is a legitimate sync from an
  // external store, so the setState-in-effect lint rule is suppressed.
  useEffect(() => {
    const persisted = readFilters(persistKey, filters, persistToStorage);
    setState(prev => ({ ...prev, ...persisted }) as State);

    setIsRestored(true);
  }, [persistKey, persistToStorage]);

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: ReturnType<T[K]['deserialize']> | T[K]['defaultValue']) => {
      setState(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetAll = useCallback(() => {
    setState(defaults);
  }, [defaults]);

  const isFirstSync = useRef(true);
  useEffect(() => {
    if (isFirstSync.current) {
      isFirstSync.current = false;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const stored: Record<string, string> = {};
    for (const [key, def] of Object.entries(filters)) {
      // biome-ignore lint/suspicious/noExplicitAny: migrated from an ESLint suppression
      const serialized = (def.serialize as (v: any) => string | null)(state[key]);
      if (serialized) {
        params.set(def.param, serialized);
        stored[def.param] = serialized;
      } else {
        params.delete(def.param);
      }
    }
    // `replaceState` takes a whole URL, so rebuilding it from pathname + query
    // alone silently drops any `#fragment` the page was sitting on the moment a
    // filter first changes. Carry the hash through.
    const qs = params.toString();
    const { pathname, hash } = window.location;
    window.history.replaceState(null, '', `${pathname}${qs ? `?${qs}` : ''}${hash}`);
    if (!persistToStorage) {
      return;
    }
    try {
      localStorage.setItem(`filters:${persistKey}`, JSON.stringify(stored));
    } catch {
      /* ignore */
    }
  }, [state]);

  return [state, setFilter, resetAll, isRestored];
};
