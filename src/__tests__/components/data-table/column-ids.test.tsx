import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
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

  it('warns once about duplicate and missing ids', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const columns = [
        { id: 'name', header: 'Name' },
        { id: 'name', header: 'Full name' },
        { header: 'Email' },
      ] as TableColumn<{ id: string }>[];
      const { rerender } = render(<DataTable columns={columns} data={[]} />);
      rerender(<DataTable columns={columns} data={[]} />);
      const messages = error.mock.calls.map(([message]) => String(message));
      const ours = messages.filter(message => message.startsWith('react-data-table'));
      expect(ours).toHaveLength(1);
      expect(ours[0]).toContain('"name"');
      expect(ours[0]).toContain('Email');
    } finally {
      error.mockRestore();
    }
  });

  it('names a column without a header by its position, and a non-string id as such', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const columns = [
        { id: 'name', header: 'Name' },
        { id: 3, header: 'Age' },
        { header: '' },
        { id: 'contact', header: 'Contact', subColumns: [{ header: '' }] },
      ] as unknown as TableColumn<{ id: string }>[];
      render(<DataTable columns={columns} data={[]} />);
      const messages = error.mock.calls.map(([message]) => String(message));
      expect(messages.filter(message => message.startsWith('react-data-table'))).toEqual([
        'react-data-table: every column needs a unique id. Missing: column 3, column 4.1. Not a string: Age (number).',
      ]);
    } finally {
      error.mockRestore();
    }
  });
});
