import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isLink,
  readParam,
  readStorage,
  storageKey,
  writeParams,
  writeStorage,
} from '@/lib/persistence';

// The module remembers, per key, what this document last wrote, so every test
// uses keys of its own.

const goTo = (url: string, state: unknown = null) => window.history.replaceState(state, '', url);

afterEach(() => {
  goTo('/');
  localStorage.clear();
});

describe('persistence', () => {
  it('names storage keys rdt:1:{key}:{state}', () => {
    expect(storageKey('members', 'sort')).toBe('rdt:1:members:sort');
    expect(storageKey('members', 'columns')).toBe('rdt:1:members:columns');
  });

  it('writes a namespaced param, keeping other params and the hash, with commas unencoded', () => {
    goTo('/?q=1#top');
    writeParams('members', { sort: 'name,-team' });
    expect(window.location.search).toBe('?q=1&members.sort=name,-team');
    expect(window.location.hash).toBe('#top');
    expect(readParam('members', 'sort')).toBe('name,-team');
  });

  it('writes an empty value as a present param and null as a removal', () => {
    writeParams('empty', { sort: '' });
    expect(window.location.search).toBe('?empty.sort=');
    expect(readParam('empty', 'sort')).toBe('');

    writeParams('empty', { sort: null });
    expect(window.location.search).toBe('');
    expect(readParam('empty', 'sort')).toBeNull();
  });

  it('keeps history.state', () => {
    goTo('/', { router: 1 });
    writeParams('state', { page: '2' });
    expect(window.history.state).toEqual({ router: 1 });
  });

  it("passes history.state on without Next.js's own markers, so its router syncs", () => {
    goTo('/', { __NA: true, _N: true, usr: { from: 'list' } });
    writeParams('next', { sort: 'name' });
    expect(window.history.state).toEqual({ usr: { from: 'list' } });
  });

  it('survives a replaceState that throws', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
      throw new Error('SecurityError: too many calls');
    });
    try {
      expect(() => writeParams('throws', { sort: 'name' })).not.toThrow();
    } finally {
      replaceState.mockRestore();
    }
  });

  it('keeps a no-link decision through its own writes', () => {
    expect(isLink('n')).toBe(false);
    writeParams('n', { sort: 'name' });
    expect(isLink('n')).toBe(false);
  });

  it('keeps a link decision through its own write-back', () => {
    goTo('/?l.sort=name');
    expect(isLink('l')).toBe(true);
    writeParams('l', { sort: 'name' });
    writeParams('l', { team: 'Design' });
    expect(isLink('l')).toBe(true);
  });

  it('decides afresh when the URL changes under it', () => {
    expect(isLink('f')).toBe(false);
    writeParams('f', { sort: 'name' });
    goTo('/?f.sort=-team');
    expect(isLink('f')).toBe(true);
    goTo('/');
    expect(isLink('f')).toBe(false);
  });

  it("never counts another key's params as its own", () => {
    goTo('/?users.archived.sort=name');
    expect(isLink('users')).toBe(false);
    expect(readParam('users', 'archived')).toBeNull();
    expect(isLink('users.archived')).toBe(true);
  });

  it('swallows storage errors', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    try {
      expect(readStorage('rdt:1:x:sort')).toBeNull();
      expect(() => writeStorage('rdt:1:x:sort', 'name')).not.toThrow();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('reads back what it stored', () => {
    writeStorage('rdt:1:y:sort', 'name,-team');
    expect(readStorage('rdt:1:y:sort')).toBe('name,-team');
    expect(readStorage('rdt:1:y:filters')).toBeNull();
  });
});
