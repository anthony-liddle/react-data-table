import { describe, expect, it } from 'vitest';

import type { TableColumn } from '@/components/data-table/types';
import * as pkg from '@/index';

describe('column ids', () => {
  it('no longer exports getColumnId', () => {
    expect('getColumnId' in pkg).toBe(false);
  });

  it('requires an id on every column, sub-columns included', () => {
    // @ts-expect-error a column needs an id
    const missingId: TableColumn<{ id: string }> = { header: 'Name' };
    const missingSubId: TableColumn<{ id: string }> = {
      id: 'group',
      header: 'Group',
      // @ts-expect-error a sub-column needs an id
      subColumns: [{ header: 'Name' }],
    };
    expect([missingId.header, missingSubId.header]).toEqual(['Name', 'Group']);
  });
});
