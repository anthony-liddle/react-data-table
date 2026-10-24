import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../components/data-table/data-table.tsx';
import type { TableColumn } from '../components/data-table/types.ts';
import { type Member, memberColumn, members } from './support/members.tsx';

/**
 * Test-only stories (hidden from the sidebar by `!dev`) for conditions a
 * feature story never meets.
 */
const meta = {
  title: 'Edge Cases',
  component: DataTable,
  tags: ['!dev', '!autodocs'],
  args: { columns: [], data: [] },
} satisfies Meta<typeof DataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = [
  { id: '1', name: 'Ada' },
  { id: '2', name: 'Bram' },
];
const columns: TableColumn<Row>[] = [{ id: 'name', header: 'Name', cell: ({ row }) => row.name }];

const onFrameRowClick = fn();

/** A table rendered by this page's React into an iframe's document. */
const TableInAFrame = () => {
  const frame = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  useEffect(() => setBody(frame.current?.contentDocument?.body ?? null), []);
  return (
    <>
      <iframe ref={frame} title="A table in a frame" style={{ width: 480, height: 200 }} />
      {body
        && createPortal(
          <DataTable columns={columns} data={rows} onRowClick={onFrameRowClick} />,
          body
        )}
    </>
  );
};

/**
 * Nodes inside the iframe come from another realm, so they fail `instanceof`
 * checks against this page's `Node`. A row click there must still count.
 */
export const RowClickInAnIframe: Story = {
  render: () => <TableInAFrame />,
  play: async ({ canvasElement }) => {
    onFrameRowClick.mockClear();
    const frame = canvasElement.querySelector('iframe') as HTMLIFrameElement;
    const cell = () => frame.contentDocument?.querySelector('tbody td');
    await waitFor(() => expect(cell()).not.toBeNull());
    (cell() as HTMLElement).click();
    await expect(onFrameRowClick).toHaveBeenCalledWith(rows[0]);
  },
};

const onChevronRowClick = fn();

/**
 * A click anywhere in the expand cell lands on its button, so a near-miss
 * beside the small chevron never counts as a row click.
 */
export const ExpandCellHitArea: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={rows}
      renderExpandedRow={row => <p>Details of {row.name}</p>}
      onRowClick={onChevronRowClick}
    />
  ),
  play: async ({ canvasElement }) => {
    const cell = canvasElement.querySelector('tbody .rdt-table__cell--expand') as HTMLElement;
    const box = cell.getBoundingClientRect();
    const corners = [
      [box.left + 2, box.top + 2],
      [box.right - 2, box.top + 2],
      [box.left + 2, box.bottom - 2],
      [box.right - 2, box.bottom - 2],
    ] as const;
    for (const [x, y] of corners) {
      await expect(document.elementFromPoint(x, y)?.closest('.rdt-expand-button')).not.toBeNull();
    }
  },
};

// The top header row's labels, left to right.
const headers = (root: HTMLElement) =>
  [...root.querySelectorAll('thead tr:first-child th')]
    .map(th => th.textContent?.trim())
    .filter(Boolean);

/** Moves a column one place down in the open column panel, by keyboard. */
const moveDownInPanel = async (canvasElement: HTMLElement, column: string) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Column settings' }));
  const panel = within(await within(document.body).findByRole('dialog', { name: 'Columns' }));
  panel.getByRole('button', { name: `Reorder ${column}` }).focus();
  await userEvent.keyboard(' ');
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard(' ');
  return panel;
};

/**
 * A pinned (alwaysVisible) column stays out of the column panel and keeps its
 * place while the others are reordered around it.
 */
export const PinnedColumnReorder: Story = {
  render: () => (
    <DataTable
      columns={[
        { ...memberColumn.name, alwaysVisible: true },
        memberColumn.email,
        memberColumn.team,
        memberColumn.role,
      ]}
      data={members.slice(0, 5)}
    />
  ),
  play: async ({ canvasElement }) => {
    const panel = await moveDownInPanel(canvasElement, 'Email');
    await expect(panel.queryByRole('checkbox', { name: 'Name' })).toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(headers(canvasElement)).toEqual(['Name', 'Team', 'Email', 'Role']));
  },
};

const groupedPinned: TableColumn<Member>[] = [
  { ...memberColumn.name, alwaysVisible: true },
  { id: 'contact', header: 'Contact', subColumns: [memberColumn.email, memberColumn.role] },
  memberColumn.team,
];

/** The same with grouped columns, where reordering used to do nothing. */
export const PinnedColumnReorderGrouped: Story = {
  render: () => <DataTable columns={groupedPinned} data={members.slice(0, 5)} />,
  play: async ({ canvasElement }) => {
    await moveDownInPanel(canvasElement, 'Contact');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(headers(canvasElement)).toEqual(['Name', 'Team', 'Contact']));
  },
};
