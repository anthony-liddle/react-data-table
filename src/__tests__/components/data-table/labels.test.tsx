import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
import { TableActionMenu } from '@/components/data-table/table-action-menu';
import type { TableColumn, TablePagination, TableSelection } from '@/components/data-table/types';
import type { DataTableLabels } from '@/labels';

interface Row {
  id: string;
  name: string;
}

const columns: TableColumn<Row>[] = [{ id: 'name', header: 'Name', cell: ({ row }) => row.name }];
const rows: Row[] = [{ id: '1', name: 'Ada' }];

const selection: TableSelection<Row> = {
  isRowSelected: () => false,
  onToggleRow: vi.fn(),
  onToggleAll: vi.fn(),
};

const pagination: TablePagination = {
  totalCount: 30,
  pageIndex: 0,
  pageSize: 10,
  hasNextPage: true,
  hasPreviousPage: false,
  onNextPage: vi.fn(),
  onPreviousPage: vi.fn(),
};

const fr: Partial<DataTableLabels> = {
  selectAll: 'Tout sélectionner',
  rowLabel: ({ id }) => `ligne ${id}`,
  selectRow: ({ rowLabel }) => `Sélectionner ${rowLabel}`,
  rowActions: ({ rowLabel }) => `Actions pour ${rowLabel}`,
  columnSettings: 'Colonnes',
  columnsPanel: 'Choix des colonnes',
  reorderColumn: ({ column }) => `Déplacer ${column}`,
  previousPage: 'Page précédente',
  nextPage: 'Page suivante',
  pageOf: ({ page, pageCount }) => `Page ${page} sur ${pageCount}`,
};

const renderTable = (props: {
  labels?: Partial<DataTableLabels>;
  getRowLabel?: (row: Row) => string;
}) =>
  render(
    <DataTable
      columns={columns}
      data={rows}
      selection={selection}
      actionMenu={[{ label: 'Edit', onSelect: vi.fn() }]}
      pagination={pagination}
      showPageCount
      {...props}
    />
  );

describe('labels', () => {
  it('names every control from labels', async () => {
    renderTable({ labels: fr });

    expect(screen.getByRole('checkbox', { name: 'Tout sélectionner' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Sélectionner ligne 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions pour ligne 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page suivante' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 sur 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Colonnes' }));
    const panel = await screen.findByRole('dialog', { name: 'Choix des colonnes' });
    expect(within(panel).getByRole('button', { name: 'Déplacer Name' })).toBeInTheDocument();
  });

  it('prefers getRowLabel over labels.rowLabel', () => {
    renderTable({ labels: fr, getRowLabel: row => row.name });

    expect(screen.getByRole('checkbox', { name: 'Sélectionner Ada' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions pour Ada' })).toBeInTheDocument();
  });

  it('keeps the English defaults, naming each row menu after its row', async () => {
    renderTable({});

    expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for row 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Column settings' }));
    const panel = await screen.findByRole('dialog', { name: 'Columns' });
    expect(within(panel).getByRole('button', { name: 'Reorder Name' })).toBeInTheDocument();
  });

  it('falls back to the default for a label set to undefined', () => {
    renderTable({ labels: { selectRow: undefined, pageOf: undefined } });

    expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('names a standalone TableActionMenu Actions, or its triggerLabel', () => {
    const items = [{ label: 'Edit', onSelect: vi.fn() }];
    const { rerender } = render(<TableActionMenu items={items} row={rows[0] as Row} />);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();

    rerender(<TableActionMenu items={items} row={rows[0] as Row} triggerLabel="Actions for Ada" />);
    expect(screen.getByRole('button', { name: 'Actions for Ada' })).toBeInTheDocument();
  });

  it('replaces page and of with pageOf', () => {
    // @ts-expect-error page and of are now pageOf
    const old: Partial<DataTableLabels> = { page: 'Page' };
    expect(old).toEqual({ page: 'Page' });
  });
});
