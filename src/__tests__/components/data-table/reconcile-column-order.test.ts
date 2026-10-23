import { describe, expect, it } from 'vitest';

import { reconcileColumnOrder } from '@/components/data-table/types';

// Regression coverage for the "columns in the wrong order" bug: a persisted
// column order that predates a code-level column-set change (e.g. a release that
// adds, removes, or reworks columns) must not strand the new columns at the end.
describe('reconcileColumnOrder', () => {
  const current = ['name', 'type', 'tags', 'status', 'created', 'last-updated'];

  it('falls back to the natural order when nothing is persisted', () => {
    expect(reconcileColumnOrder(undefined, current)).toEqual(current);
    expect(reconcileColumnOrder([], current)).toEqual(current);
  });

  it('preserves a saved order that still describes exactly the current columns', () => {
    const saved = ['created', 'name', 'last-updated', 'status', 'tags', 'type'];
    expect(reconcileColumnOrder(saved, current)).toEqual(saved);
  });

  it('slots newly added columns at their natural position, not the end', () => {
    // Saved order from before type/tags/status existed.
    const stale = ['name', 'created', 'last-updated'];
    // name keeps its saved lead; type/tags/status slot back in around
    // their natural neighbours rather than being dumped after last-updated.
    expect(reconcileColumnOrder(stale, current)).toEqual([
      'name',
      'type',
      'tags',
      'status',
      'created',
      'last-updated',
    ]);
  });

  it('drops persisted ids that no longer exist', () => {
    const stale = ['name', 'legacy-column', 'created', 'last-updated'];
    expect(reconcileColumnOrder(stale, current)).not.toContain('legacy-column');
    expect(reconcileColumnOrder(stale, current)).toEqual(expect.arrayContaining(current));
    expect(reconcileColumnOrder(stale, current)).toHaveLength(current.length);
  });

  it('de-dupes a corrupted persisted order', () => {
    const dupes = ['name', 'name', 'created', 'created'];
    const result = reconcileColumnOrder(dupes, current);
    expect(new Set(result).size).toBe(result.length);
    expect(result).toHaveLength(current.length);
    expect(result).toEqual(expect.arrayContaining(current));
  });

  it('respects a user reorder while inserting one new column naturally', () => {
    // User had moved "created" to the front; then "status" was added in code.
    const saved = ['created', 'name', 'type', 'tags', 'last-updated'];
    // status is naturally after tags → slots in right after tags.
    expect(reconcileColumnOrder(saved, current)).toEqual([
      'created',
      'name',
      'type',
      'tags',
      'status',
      'last-updated',
    ]);
  });
});
