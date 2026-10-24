'use client';

import { useCallback, useMemo } from 'react';

import {
  isLink,
  readParam,
  readStorage,
  storageKey,
  writeParams,
  writeStorage,
} from '../lib/persistence.ts';
import { usePersistedState } from './use-persisted-state.ts';

type FilterValue = string | number | boolean | string[] | null;

export interface FilterDef {
  /** The URL param, written as `{persistKey}.{param}`. It must not contain `.`. */
  param: string;
  defaultValue: FilterValue;
  /** Returns the param's value, or null to leave the param out (usually for the default). */
  serialize: (value: never) => string | null;
  /** Turns a param back into a value. If it throws, the filter takes its default. */
  deserialize: (raw: string) => FilterValue;
}

export interface PersistedFiltersOptions {
  /**
   * Whether values survive in `localStorage` across visits. Default `true`.
   *
   * Set `false` for state that must reset to its default on every fresh
   * landing (e.g. a tab bar that should always open on its first tab).
   * The URL half is unaffected either way: `?{persistKey}.{param}=` still
   * seeds the state and still tracks it, so deep links keep working.
   */
  persistToStorage?: boolean;
}

type Filters<T extends Record<string, FilterDef>> = {
  [K in keyof T]: ReturnType<T[K]['deserialize']> | T[K]['defaultValue'];
};

// Each filter's param value, leaving out the ones that serialize to nothing.
const serializeFilters = (
  filters: Record<string, FilterDef>,
  state: Record<string, unknown>
): Record<string, string> => {
  const serialized: Record<string, string> = {};
  for (const [name, def] of Object.entries(filters)) {
    const raw = (def.serialize as (value: unknown) => string | null)(state[name]);
    if (raw) {
      serialized[def.param] = raw;
    }
  }
  return serialized;
};

const readStoredFilters = (persistKey: string): Record<string, string> => {
  try {
    const parsed: unknown = JSON.parse(readStorage(storageKey(persistKey, 'filters')) ?? '{}');
    return parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const deserialize = (def: FilterDef, raw: string): FilterValue => {
  try {
    return def.deserialize(raw);
  } catch {
    return def.defaultValue;
  }
};

/**
 * Filter state persisted like the table: each filter in the URL as
 * `{persistKey}.{param}`, and in localStorage under `rdt:1:{persistKey}:filters`.
 * A link to the table carries the whole view, so a filter it leaves out takes
 * its default; otherwise each filter reads its param, then storage.
 */
export const usePersistedFilters = <T extends Record<string, FilterDef>>(
  persistKey: string,
  filters: T,
  options: PersistedFiltersOptions = {}
) => {
  const { persistToStorage = true } = options;

  const defaults = useMemo(() => {
    const state: Record<string, FilterValue> = {};
    for (const [name, def] of Object.entries(filters)) {
      state[name] = def.defaultValue;
    }
    return state as Filters<T>;
  }, [filters]);

  const {
    value: state,
    setValue,
    isRestored,
  } = usePersistedState<Filters<T>>({
    persistKey,
    defaultValue: defaults,
    serialize: value => JSON.stringify(serializeFilters(filters, value)),
    read: key => {
      // URL-only filters, like a link, never read storage.
      const urlOnly = isLink(key) || !persistToStorage;
      const stored = urlOnly ? {} : readStoredFilters(key);
      const restored: Record<string, FilterValue> = {};
      for (const [name, def] of Object.entries(filters)) {
        const raw = readParam(key, def.param) || (urlOnly ? null : stored[def.param]);
        restored[name] = raw ? deserialize(def, raw) : def.defaultValue;
      }
      return restored as Filters<T>;
    },
    write: (key, value) => {
      const serialized = serializeFilters(filters, value);
      const updates: Record<string, string | null> = {};
      for (const def of Object.values(filters)) {
        updates[def.param] = serialized[def.param] ?? null;
      }
      writeParams(key, updates);
      if (persistToStorage) {
        writeStorage(storageKey(key, 'filters'), JSON.stringify(serialized));
      }
    },
  });

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: Filters<T>[K]) => {
      setValue(prev => ({ ...prev, [key]: value }));
    },
    [setValue]
  );

  const reset = useCallback(() => setValue(defaults), [defaults, setValue]);

  return { filters: state, setFilter, reset, isRestored };
};
