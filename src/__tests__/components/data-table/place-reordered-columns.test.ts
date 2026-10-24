import { describe, expect, it } from 'vitest';

import { placeReorderedColumns } from '@/components/data-table/types';

// The column panel lists only the columns that can move. A drag there gives
// their new order, and pinned (alwaysVisible) columns keep their places.
describe('placeReorderedColumns', () => {
  it('fills the unpinned places with the new order', () => {
    expect(
      placeReorderedColumns(['name', 'email', 'team', 'role'], new Set(['name']), [
        'team',
        'email',
        'role',
      ])
    ).toEqual(['name', 'team', 'email', 'role']);
  });

  it('keeps pinned columns anywhere in the order where they were', () => {
    expect(
      placeReorderedColumns(['email', 'name', 'team', 'actions'], new Set(['name', 'actions']), [
        'team',
        'email',
      ])
    ).toEqual(['team', 'name', 'email', 'actions']);
  });

  it('is the new order when nothing is pinned', () => {
    expect(placeReorderedColumns(['a', 'b', 'c'], new Set(), ['c', 'a', 'b'])).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});
