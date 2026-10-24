import { describe, expect, it } from 'vitest';

import { nextSortBy, parseSortBy, serializeSortBy } from '@/lib/sort-by';

const parse = (raw: string) => parseSortBy(raw, { multiSort: true }) ?? [];

describe('nextSortBy', () => {
  it.each([
    ['', 'name', false, false, 'name'],
    ['name', 'name', false, false, '-name'],
    ['-name', 'name', false, false, ''],
    ['name', 'team', false, false, 'team'],
    // A plain click makes the column the only sort, cycled from where it was.
    ['name,team', 'team', false, true, '-team'],
    ['name,-team', 'team', false, true, ''],
    // An additive click appends, flips in place, or removes.
    ['name', 'team', true, true, 'name,team'],
    ['name,team', 'team', true, true, 'name,-team'],
    ['name,-team', 'team', true, true, 'name'],
    ['name,-team', 'name', true, true, '-name,-team'],
    ['-name,-team', 'name', true, true, '-team'],
    // Without multiSort, an additive click is a plain one.
    ['name', 'team', true, false, 'team'],
  ])(
    '%s, click %s (additive %s, multiSort %s) gives %s',
    (current, key, additive, multiSort, expected) => {
      expect(serializeSortBy(nextSortBy(parse(current), key, { additive, multiSort }))).toBe(
        expected
      );
    }
  );
});

describe('parseSortBy', () => {
  it('parses an empty value as unsorted', () => {
    expect(parseSortBy('', { multiSort: false })).toEqual([]);
  });

  it('parses keys in priority order, with - marking descending', () => {
    expect(parseSortBy('name,-team', { multiSort: true })).toEqual([
      { key: 'name', direction: 'asc' },
      { key: 'team', direction: 'desc' },
    ]);
  });

  it.each([
    ['name,,team', { multiSort: true }],
    ['name,name', { multiSort: true }],
    ['name,-name', { multiSort: true }],
    ['-', { multiSort: true }],
    ['bogus', { multiSort: true, sortableColumns: ['name', 'team'] }],
    ['name,team', { multiSort: false }],
  ])('rejects %s', (raw, options) => {
    expect(parseSortBy(raw, options)).toBeNull();
  });

  it('round-trips through serializeSortBy', () => {
    const sortBy = parse('-team,name,-role');
    expect(parse(serializeSortBy(sortBy))).toEqual(sortBy);
    expect(serializeSortBy([])).toBe('');
  });
});
