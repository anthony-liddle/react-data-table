import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../components/data-table/data-table.tsx';
import type { TableActionMenuItem } from '../components/data-table/types.ts';
import { at } from '../test-support/at.ts';
import { defaultColumns, isSuspended, type Member, members } from './support/members.tsx';

const rows = members.slice(0, 10);

/**
 * Test-only stories (hidden from the sidebar by `!dev`) that put the table into
 * states axe never sees on a fresh render: open menus, which portal to
 * `<body>`, and the dark theme. `pnpm test:storybook` runs the a11y addon over
 * each one after its play function finishes.
 */
const meta = {
  title: 'A11y Audit',
  component: DataTable,
  tags: ['!dev', '!autodocs'],
  args: { columns: [], data: [] },
} satisfies Meta<typeof DataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

const actionMenu: TableActionMenuItem<Member>[] = [
  { label: 'View profile', href: ({ row }) => `#/members/${row.id}` },
  { label: 'Edit', callbackAction: fn() },
  {
    label: 'Change role',
    subItems: [
      { label: 'Make admin', callbackAction: fn() },
      { label: 'Make viewer', callbackAction: fn() },
    ],
  },
  { label: 'Delete', callbackAction: fn(), disabled: ({ row }) => isSuspended(row) },
];

const FullTable = () => {
  const [selected, setSelected] = useState<Member[]>(rows.slice(0, 2));
  return (
    <DataTable
      columns={defaultColumns}
      data={rows}
      actionMenu={actionMenu}
      showPageCount
      sort={{ sortKey: 'name', direction: 'asc', handleSort: fn() }}
      selection={{
        selectedRows: selected,
        handleSelectRow: row =>
          setSelected(prev =>
            prev.some(r => r.id === row.id) ? prev.filter(r => r.id !== row.id) : [...prev, row]
          ),
        handleSelectAll: checked => setSelected(checked ? rows.filter(r => !isSuspended(r)) : []),
        handleDeselectAll: () => setSelected([]),
        isRowSelected: row => selected.some(r => r.id === row.id),
        isRowDisabled: isSuspended,
        findRowInSelection: row => selected.find(r => r.id === row.id),
      }}
      pagination={{
        totalCount: 42,
        pageIndex: 1,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        handleNextPage: fn(),
        handlePreviousPage: fn(),
      }}
    />
  );
};

export const ColumnMenuOpen: Story = {
  render: () => <FullTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Column settings' }));
    const dialog = within(await within(document.body).findByRole('dialog', { name: 'Columns' }));

    // Keyboard reachability: focus opens on the first column's checkbox, Space
    // toggles it, and Tab moves on to that column's drag handle.
    const nameToggle = dialog.getByRole('checkbox', { name: 'Name' });
    await waitFor(() => expect(nameToggle).toHaveFocus());
    await userEvent.keyboard(' ');
    await waitFor(() => expect(nameToggle).not.toBeChecked());
    await userEvent.keyboard(' ');
    await waitFor(() => expect(nameToggle).toBeChecked());
    await userEvent.tab();
    await expect(dialog.getByRole('button', { name: 'Reorder Name' })).toHaveFocus();
  },
};

export const RowActionSubmenuOpen: Story = {
  render: () => <FullTable />,
  parameters: {
    a11y: {
      config: {
        rules: [
          // False positive. While a Radix modal menu is open it sets
          // aria-hidden on everything outside it and traps focus inside it
          // (Tab is swallowed, outside pointer events are disabled), so the
          // focusable elements under aria-hidden cannot receive focus.
          { id: 'aria-hidden-focus', enabled: false },
        ],
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(at(canvas.getAllByRole('button', { name: 'Actions' }), 0));
    const body = within(document.body);
    await userEvent.click(await body.findByText('Change role'));
    await body.findByText('Make admin');
  },
};

export const DarkTheme: Story = {
  render: () => <FullTable />,
  globals: { theme: 'dark' },
};
