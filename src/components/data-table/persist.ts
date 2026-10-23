/**
 * Shared persistence helpers for DataTable state.
 * Reads from URL params first, falls back to localStorage.
 * Writes to both URL params and localStorage.
 */

const getUrlParams = (): URLSearchParams | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return new URLSearchParams(window.location.search);
};

/** Read a persisted JSON value. URL params take priority over localStorage. */
export const readPersisted = <T>(paramKey: string, storageKey: string): T | null => {
  // Try URL first
  const params = getUrlParams();
  const urlValue = params?.get(paramKey);
  if (urlValue) {
    try {
      return JSON.parse(urlValue) as T;
    } catch {
      // not valid JSON, try as plain string
    }
  }

  // Fall back to localStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  return null;
};

/** Read a plain string from URL params, fall back to localStorage JSON. */
export const readPersistedString = (paramKey: string, storageKey: string): string | null => {
  const params = getUrlParams();
  const urlValue = params?.get(paramKey);
  if (urlValue) {
    return urlValue;
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as string) : null;
    } catch {
      return null;
    }
  }
  return null;
};

/** Write state to both URL params and localStorage. */
export const writePersisted = (
  updates: Record<string, string | null>,
  storageKey: string,
  storageValue: unknown
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  // Update URL params
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(updates)) {
    if (value != null) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);

  // Update localStorage
  try {
    localStorage.setItem(storageKey, JSON.stringify(storageValue));
  } catch {
    // localStorage may be full or unavailable
  }
};
