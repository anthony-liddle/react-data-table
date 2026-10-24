import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
import type { TableColumn } from '@/components/data-table/types';
import { useTableExpansion } from '@/hooks/use-table-expansion';

interface Row {
  id: string;
  name: string;
}

const columns: TableColumn<Row>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <>
        <span>{row.name}</span> <a href={`#${row.id}`}>Profile</a>{' '}
        <button type="button">Edit</button>
      </>
    ),
  },
];
const rows: Row[] = [
  { id: '1', name: 'Ada' },
  { id: '2', name: 'Bram' },
];
const details = (row: Row) => <p>Details of {row.name}</p>;

const ControlledTable = ({
  initialExpandedIds,
  isRowExpandable,
}: {
  initialExpandedIds?: string[];
  isRowExpandable?: (row: Row) => boolean;
}) => {
  const expansion = useTableExpansion<Row>({ initialExpandedIds, isRowExpandable });
  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowLabel={row => row.name}
      renderExpandedRow={details}
      expansion={expansion}
    />
  );
};

describe('row expansion', () => {
  it('expands and collapses a row from its button, uncontrolled', async () => {
    render(<DataTable columns={columns} data={rows} renderExpandedRow={details} />);
    const button = screen.getByRole('button', { name: 'Details for row 1' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Details of Ada')).toBeNull();

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Details of Ada')).toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.queryByText('Details of Ada')).toBeNull();
  });

  it('follows a controlled expansion', () => {
    render(<ControlledTable initialExpandedIds={['2']} />);
    expect(screen.getByRole('button', { name: 'Details for Bram' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByText('Details of Bram')).toBeInTheDocument();
    expect(screen.queryByText('Details of Ada')).toBeNull();
  });

  it('names the button after its row, and the column for screen readers', () => {
    render(<ControlledTable />);
    expect(screen.getByRole('button', { name: 'Details for Ada' })).toBeInTheDocument();
    const header = screen.getByRole('columnheader', { name: 'Details' });
    expect(header).toHaveClass('rdt-table__header-cell--expand');
    expect(header.querySelector('.rdt-visually-hidden')).toHaveTextContent('Details');
  });

  it('sets aria-controls only while open, pointing at the expanded row', async () => {
    render(<ControlledTable />);
    const button = screen.getByRole('button', { name: 'Details for Ada' });
    expect(button).not.toHaveAttribute('aria-controls');

    await userEvent.click(button);
    const id = button.getAttribute('aria-controls') as string;
    const expandedRow = document.getElementById(id);
    expect(expandedRow).toHaveClass('rdt-table__expanded-row');
    expect(expandedRow).toHaveTextContent('Details of Ada');
  });

  it('calls renderExpandedRow only for expanded rows', async () => {
    const spy = vi.fn(details);
    render(<DataTable columns={columns} data={rows} renderExpandedRow={spy} />);
    expect(spy).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Details for row 1' }));
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls.every(([row]) => row.id === '1')).toBe(true);
  });

  it('gives a row that is not expandable an empty cell', () => {
    const { container } = render(<ControlledTable isRowExpandable={row => row.id === '1'} />);
    const cells = container.querySelectorAll('tbody .rdt-table__cell--expand');
    expect(cells).toHaveLength(2);
    expect(within(cells[0] as HTMLElement).getByRole('button')).toBeInTheDocument();
    expect(cells[1]).toBeEmptyDOMElement();
  });

  it('keeps a row that is not expandable closed, even when its id is expanded', () => {
    const spy = vi.fn(details);
    const Table = () => {
      const expansion = useTableExpansion<Row>({
        isRowExpandable: row => row.id === '1',
        initialExpandedIds: ['1', '2'],
      });
      return (
        <DataTable columns={columns} data={rows} renderExpandedRow={spy} expansion={expansion} />
      );
    };
    render(<Table />);
    expect(screen.getByText('Details of Ada')).toBeInTheDocument();
    expect(screen.queryByText('Details of Bram')).toBeNull();
    expect(spy.mock.calls.every(([row]) => row.id === '1')).toBe(true);
  });

  it('ignores a row click on a row that is not expandable', async () => {
    const onToggleRow = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={rows}
        renderExpandedRow={details}
        expansion={{
          isRowExpanded: () => false,
          isRowExpandable: row => row.id === '1',
          onToggleRow,
        }}
        expandOnRowClick
      />
    );
    await userEvent.click(screen.getByText('Bram'));
    expect(onToggleRow).not.toHaveBeenCalled();
    expect(screen.getByText('Bram').closest('tr')).not.toHaveClass('rdt-table__row--clickable');

    await userEvent.click(screen.getByText('Ada'));
    expect(onToggleRow).toHaveBeenCalledWith(rows[0]);
  });

  it('toggles on a row click with expandOnRowClick, but not from its controls', async () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowLabel={row => row.name}
        renderExpandedRow={details}
        expandOnRowClick
      />
    );
    const button = screen.getByRole('button', { name: 'Details for Ada' });
    const [link] = screen.getAllByRole('link', { name: 'Profile' });
    const [edit] = screen.getAllByRole('button', { name: 'Edit' });
    await userEvent.click(link as HTMLElement);
    await userEvent.click(edit as HTMLElement);
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(screen.getByText('Ada'));
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Ada').closest('tr')).toHaveClass('rdt-table__row--clickable');
  });

  it('takes expandColumn and expandRow from labels', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        renderExpandedRow={details}
        labels={{ expandColumn: 'Détails', expandRow: ({ rowLabel }) => `Détails de ${rowLabel}` }}
      />
    );
    expect(screen.getByRole('columnheader', { name: 'Détails' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Détails de row 1' })).toBeInTheDocument();
  });

  it('has no expand column without renderExpandedRow', () => {
    const Table = () => {
      const expansion = useTableExpansion<Row>();
      return <DataTable columns={columns} data={rows} expansion={expansion} />;
    };
    const { container } = render(<Table />);
    expect(container.querySelector('.rdt-table__cell--expand')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Details for/ })).toBeNull();
  });
});
