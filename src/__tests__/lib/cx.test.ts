import { describe, expect, it } from 'vitest';

import { cx } from '@/lib/cx';

describe('cx', () => {
  it('joins the truthy parts with single spaces', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cx(false, null, undefined, '')).toBe('');
  });
});
