/**
 * Where persisted table state lives: URL params namespaced by the table's
 * `persistKey` (`members.sort=name,-team`) and versioned localStorage keys
 * (`rdt:1:members:sort`). Every function is safe on the server, where it reads
 * and writes nothing.
 */

export type PersistedState = 'sort' | 'filters' | 'columns';

/** The storage format version. A format change bumps it, so old entries are ignored, not misread. */
const STORAGE_VERSION = 1;

export const storageKey = (persistKey: string, state: PersistedState): string =>
  `rdt:${STORAGE_VERSION}:${persistKey}:${state}`;

const hasWindow = () => typeof window !== 'undefined';

// A param belongs to a key only when the rest of its name has no dot, so the
// keys `users` and `users.archived` can't read each other's params.
const belongsTo = (persistKey: string, param: string): boolean => {
  const prefix = `${persistKey}.`;
  if (!param.startsWith(prefix)) {
    return false;
  }
  const name = param.slice(prefix.length);
  return name !== '' && !name.includes('.');
};

// The key's params in the current URL, in a stable form for comparison.
const namespaceParams = (persistKey: string): string => {
  const own: string[] = [];
  new URLSearchParams(window.location.search).forEach((value, param) => {
    if (belongsTo(persistKey, param)) {
      own.push(`${param}=${value}`);
    }
  });
  return own.sort().join('&');
};

/** The value of `{persistKey}.{name}`: `''` when present and empty, `null` when absent. */
export const readParam = (persistKey: string, name: string): string | null =>
  hasWindow() ? new URLSearchParams(window.location.search).get(`${persistKey}.${name}`) : null;

// Per key: whether the URL was a link when this document first looked, and the
// key's params as they stood after this document's last write. A hook that
// mounts later then sees the same answer as the first one did, instead of
// taking the first hook's write-back for a link (or a link's write-back for
// its own state).
const decisions = new Map<string, { params: string; link: boolean }>();

/**
 * Whether the URL is a link for this table: it holds params in the table's
 * namespace that this document didn't write. A link is the whole view; any
 * other state reads its own param, then storage, then its default.
 */
export const isLink = (persistKey: string): boolean => {
  if (!hasWindow()) {
    return false;
  }
  const params = namespaceParams(persistKey);
  const decision = decisions.get(persistKey);
  if (decision && decision.params === params) {
    return decision.link;
  }
  const link = params !== '';
  decisions.set(persistKey, { params, link });
  return link;
};

// The current history state, for replaceState to keep, minus Next.js's own
// markers. Next's app router passes a call carrying them straight through as
// its own, so it would never see the new URL and would later put its old one
// back. Without them it restores its internals and syncs.
const routerState = (): unknown => {
  const state: unknown = window.history.state;
  if (state === null || typeof state !== 'object') {
    return state;
  }
  const { __NA: _app, _N: _pages, ...rest } = state as Record<string, unknown>;
  return rest;
};

/**
 * Set (or with `null`, remove) `{persistKey}.{name}` params, keeping every
 * other param, the hash and `history.state`. Commas stay unencoded so a sort
 * reads `name,-team`.
 */
export const writeParams = (persistKey: string, updates: Record<string, string | null>): void => {
  if (!hasWindow()) {
    return;
  }
  // Decide before the first write, so the write can't read as a link later.
  const link = isLink(persistKey);
  const params = new URLSearchParams(window.location.search);
  for (const [name, value] of Object.entries(updates)) {
    if (value === null) {
      params.delete(`${persistKey}.${name}`);
    } else {
      params.set(`${persistKey}.${name}`, value);
    }
  }
  const query = params.toString().replace(/%2C/gi, ',');
  const { pathname, hash } = window.location;
  try {
    window.history.replaceState(routerState(), '', `${pathname}${query ? `?${query}` : ''}${hash}`);
  } catch {
    // Safari throws past ~100 calls in 30 seconds, and a sandboxed frame may
    // refuse; the URL just stays as it was.
  }
  decisions.set(persistKey, { params: namespaceParams(persistKey), link });
};

/** A stored value, or `null` when absent or when storage is unavailable. */
export const readStorage = (key: string): string | null => {
  if (!hasWindow()) {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string): void => {
  if (!hasWindow()) {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage full or unavailable (private mode): the URL still carries the view.
  }
};
