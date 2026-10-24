'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// False on the server and while hydrating, so those renders match the
// server's HTML; true for every other client render, including a client-only
// first render. A boolean snapshot can't trigger the re-render loop a freshly
// parsed object would.
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

interface PersistedStateOptions<T> {
  persistKey: string | undefined;
  defaultValue: T;
  /** The persisted value, or undefined when nothing usable is persisted. */
  read: (persistKey: string) => T | undefined;
  /** Persists a value. Called once restored, then on every change. */
  write: (persistKey: string, value: T) => void;
  /** Change detection for writes. Defaults to `JSON.stringify`. */
  serialize?: (value: T) => string;
}

/**
 * State restored from wherever `read` finds it, without a hydration mismatch:
 * the server and hydration renders use the default, and a client-only render
 * starts from the persisted value. Nothing is written until the value has been
 * restored, so a hydration render can't overwrite what it hasn't read yet.
 */
export const usePersistedState = <T>({
  persistKey,
  defaultValue,
  read,
  write,
  serialize = JSON.stringify,
}: PersistedStateOptions<T>) => {
  const isClient = useIsClient();
  const isRestored = !persistKey || isClient;

  // Read once per key, on the first render that may read.
  const restored = useRef<{ key: string; value: T | undefined } | null>(null);
  if (persistKey && isClient && restored.current?.key !== persistKey) {
    restored.current = { key: persistKey, value: read(persistKey) };
  }
  const persisted = persistKey && isClient ? restored.current?.value : undefined;

  // The default keeps one identity while it means the same thing, so an inline
  // literal (`defaultSortBy: [...]`) can't make every render look like a change
  // to an effect that depends on the value.
  const defaultToken = serialize(defaultValue);
  const stableDefault = useRef({ token: defaultToken, value: defaultValue });
  if (stableDefault.current.token !== defaultToken) {
    stableDefault.current = { token: defaultToken, value: defaultValue };
  }
  const fallbackValue = persisted ?? stableDefault.current.value;

  // A value set since mount, boxed so an undefined value still counts as set,
  // and keyed so a new persistKey starts from its own state rather than
  // carrying the old key's into it.
  const [local, setLocal] = useState<{ key: string | undefined; value: T } | null>(null);
  const value = local && local.key === persistKey ? local.value : fallbackValue;

  const current = useRef({ key: persistKey, fallback: fallbackValue });
  current.current = { key: persistKey, fallback: fallbackValue };
  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setLocal(prev => {
      const { key, fallback } = current.current;
      const base = prev && prev.key === key ? prev.value : fallback;
      return { key, value: typeof next === 'function' ? (next as (prev: T) => T)(base) : next };
    });
  }, []);

  const serialized = serialize(value);
  const latest = useRef({ value, write });
  latest.current = { value, write };
  const written = useRef<string | null>(null);
  useEffect(() => {
    if (!persistKey || !isClient) {
      return;
    }
    const token = `${persistKey}\u0000${serialized}`;
    if (written.current === token) {
      return;
    }
    written.current = token;
    latest.current.write(persistKey, latest.current.value);
  }, [persistKey, isClient, serialized]);

  return { value, setValue, isRestored };
};
