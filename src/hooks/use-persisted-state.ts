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

  // Boxed, so a value that is itself undefined still counts as set.
  const [local, setLocal] = useState<{ value: T } | null>(null);
  const value = local ? local.value : (persisted ?? defaultValue);

  const fallback = useRef(value);
  fallback.current = persisted ?? defaultValue;
  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setLocal(prev => {
      const current = prev ? prev.value : fallback.current;
      return { value: typeof next === 'function' ? (next as (prev: T) => T)(current) : next };
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
