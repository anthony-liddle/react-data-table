import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
import type { TableColumn } from '@/components/data-table/types';
import { useTableSelection } from '@/hooks/use-table-selection';

interface Row {
  id: string;
  name: string;
  locked?: boolean;
}

const rows: Row[] = ['Ada', 'Bram', 'Cleo', 'Dev', 'Eli'].map((name, i) => ({
  id: String(i + 1),
  name,
  locked: name === 'Cleo',
}));
const columns: TableColumn<Row>[] = [{ id: 'name', header: 'Name', cell: ({ row }) => row.name }];

const Table = ({ disableLocked = false }: { disableLocked?: boolean }) => {
  const selection = useTableSelection(rows, {
    isRowDisabled: disableLocked ? row => row.locked === true : undefined,
  });
  return (
    <>
      <output>{selection.selectedRows.map(row => row.name).join(',')}</output>
      <DataTable columns={columns} data={rows} selection={selection} getRowLabel={r => r.name} />
    </>
  );
};

const checkbox = (name: string) => screen.getByRole('checkbox', { name: `Select ${name}` });
const selected = () => screen.getByRole('status').textContent;

const shiftClick = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.keyboard('{Shift>}');
  await user.click(checkbox(name));
  await user.keyboard('{/Shift}');
};

describe('range selection', () => {
  it('selects the range from the last checkbox with Shift+click', async () => {
    const user = userEvent.setup();
    render(<Table />);
    await user.click(checkbox('Bram'));
    await shiftClick(user, 'Dev');
    expect(selected()).toBe('Bram,Cleo,Dev');
  });

  it('works upwards too', async () => {
    const user = userEvent.setup();
    render(<Table />);
    await user.click(checkbox('Dev'));
    await shiftClick(user, 'Ada');
    expect(selected()?.split(',').sort()).toEqual(['Ada', 'Bram', 'Cleo', 'Dev']);
  });

  it('clears the range when the clicked row was selected', async () => {
    const user = userEvent.setup();
    render(<Table />);
    await user.click(checkbox('Ada'));
    await shiftClick(user, 'Eli');
    await user.click(checkbox('Bram'));
    await shiftClick(user, 'Dev');
    expect(selected()).toBe('Ada,Eli');
  });

  it('skips disabled rows', async () => {
    const user = userEvent.setup();
    render(<Table disableLocked />);
    await user.click(checkbox('Ada'));
    await shiftClick(user, 'Eli');
    expect(selected()).toBe('Ada,Bram,Dev,Eli');
  });

  it('selects the range with Shift+Space from the keyboard', () => {
    render(<Table />);
    fireEvent.click(checkbox('Bram'));
    fireEvent.keyDown(checkbox('Dev'), { key: ' ', shiftKey: true });
    fireEvent.click(checkbox('Dev'), { detail: 0 });
    expect(selected()).toBe('Bram,Cleo,Dev');
  });

  it('forgets a Shift+Space that never became a click', () => {
    render(<Table />);
    fireEvent.click(checkbox('Ada'));
    fireEvent.keyDown(checkbox('Cleo'), { key: ' ', shiftKey: true });
    fireEvent.click(checkbox('Eli'), { detail: 0 });
    expect(selected()).toBe('Ada,Eli');
  });

  it('forgets a Shift+Space once focus leaves its checkbox', () => {
    render(<Table />);
    fireEvent.click(checkbox('Ada'));
    fireEvent.keyDown(checkbox('Cleo'), { key: ' ', shiftKey: true });
    fireEvent.blur(checkbox('Cleo'));
    fireEvent.click(checkbox('Cleo'), { detail: 0 });
    expect(selected()).toBe('Ada,Cleo');
  });

  it('toggles one row on Shift+click with no checkbox clicked before', async () => {
    const user = userEvent.setup();
    render(<Table />);
    await shiftClick(user, 'Cleo');
    expect(selected()).toBe('Cleo');
  });
});
