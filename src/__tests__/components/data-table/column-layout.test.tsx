import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
import type { TableColumn, TableSelection } from '@/components/data-table/types';

interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
}

const flat: TableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: ({ row }) => row.name },
  { id: 'email', header: 'Email', cell: ({ row }) => row.email },
  { id: 'role', header: 'Role', cell: ({ row }) => row.role },
];
const grouped: TableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: ({ row }) => row.name },
  {
    id: 'contact',
    header: 'Contact',
    subColumns: [
      { id: 'email', header: 'Email', cell: ({ row }) => row.email },
      { id: 'role', header: 'Role', cell: ({ row }) => row.role },
    ],
  },
];
const rows: Row[] = [
  { id: '1', name: 'Ada', email: 'ada@example.com', role: 'Owner' },
  { id: '2', name: 'Bram', email: 'bram@example.com', role: 'Member' },
];
const selection: TableSelection<Row> = {
  isRowSelected: () => false,
  onToggleRow: vi.fn(),
  onToggleAll: vi.fn(),
};

// The columns a row covers, counting each cell's colspan.
const colSpan = (cell: Element) => Number(cell.getAttribute('colspan') ?? 1);
const span = (row: Element) => [...row.children].reduce((n, cell) => n + colSpan(cell), 0);

const combinations = [false, true].flatMap(withSelection =>
  [false, true].flatMap(withActionMenu =>
    [false, true].flatMap(hideTableSettings =>
      [false, true].map(isGrouped => ({
        withSelection,
        withActionMenu,
        hideTableSettings,
        isGrouped,
      }))
    )
  )
);

describe('column layout', () => {
  it.each(combinations)('every body row spans the header (%o)', options => {
    const props = {
      columns: options.isGrouped ? grouped : flat,
      selection: options.withSelection ? selection : undefined,
      actionMenu: options.withActionMenu ? [{ label: 'Edit', onSelect: vi.fn() }] : undefined,
      hideTableSettings: options.hideTableSettings,
    };
    const widths = (container: HTMLElement) => {
      const header = span(container.querySelector('thead tr') as Element);
      return { header, body: [...container.querySelectorAll('tbody > tr')].map(span) };
    };

    const withData = render(
      <DataTable
        {...props}
        data={rows}
        renderExpandedRow={row => (row.id === '1' ? <p>Details</p> : null)}
      />
    );
    const data = widths(withData.container);
    expect(data.body).toHaveLength(3);
    expect(data.body.every(width => width === data.header)).toBe(true);
    withData.unmount();

    const loading = widths(render(<DataTable {...props} data={rows} loading />).container);
    expect(loading.body.every(width => width === loading.header)).toBe(true);

    const empty = widths(render(<DataTable {...props} data={[]} />).container);
    expect(empty.body).toEqual([empty.header]);
  });

  it('puts an empty settings cell under the settings header', () => {
    const { container } = render(<DataTable columns={flat} data={rows} />);
    for (const row of container.querySelectorAll('tbody tr')) {
      const last = row.lastElementChild;
      expect(last).toHaveClass('rdt-table__cell', 'rdt-table__cell--settings');
      expect(last).toBeEmptyDOMElement();
    }
  });

  it('heads the action column when the settings are hidden', () => {
    const { container } = render(
      <DataTable
        columns={flat}
        data={rows}
        actionMenu={[{ label: 'Edit', onSelect: vi.fn() }]}
        hideTableSettings
      />
    );
    const last = container.querySelector('thead tr')?.lastElementChild;
    expect(last).toHaveClass('rdt-table__header-cell', 'rdt-table__header-cell--actions');
    expect(last).toBeEmptyDOMElement();
  });

  it('never fills a gap with colSpan 2', () => {
    const { container } = render(<DataTable columns={flat} data={rows} />);
    const loading = render(<DataTable columns={flat} data={rows} loading />).container;
    for (const cell of [
      ...container.querySelectorAll('tbody td'),
      ...loading.querySelectorAll('tbody td'),
    ]) {
      expect(colSpan(cell)).toBe(1);
    }
  });
});
