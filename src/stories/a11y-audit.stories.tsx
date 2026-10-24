import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../components/data-table/data-table.tsx';
import type { SortItem, TableActionMenuItem } from '../components/data-table/types.ts';
import { useTableExpansion } from '../hooks/use-table-expansion.ts';
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
  { label: 'Edit', onSelect: fn() },
  {
    label: 'Change role',
    subItems: [
      { label: 'Make admin', onSelect: fn() },
      { label: 'Make viewer', onSelect: fn() },
    ],
  },
  { label: 'Delete', onSelect: fn(), disabled: ({ row }) => isSuspended(row) },
];

const FullTable = ({
  sortBy = [{ key: 'name', direction: 'asc' }],
  expandFirst = false,
}: {
  sortBy?: SortItem[];
  /** Adds the expand column, with the first row open. */
  expandFirst?: boolean;
}) => {
  const [selected, setSelected] = useState<Member[]>(rows.slice(0, 2));
  const expansion = useTableExpansion<Member>({ initialExpandedIds: [at(rows, 0).id] });
  return (
    <DataTable
      columns={defaultColumns}
      data={rows}
      getRowLabel={row => row.name}
      renderExpandedRow={expandFirst ? row => <p>Based in {row.location}</p> : undefined}
      expansion={expansion}
      actionMenu={actionMenu}
      showPageCount
      sort={{ sortBy, onSort: fn() }}
      selection={{
        onToggleRow: row =>
          setSelected(prev =>
            prev.some(r => r.id === row.id) ? prev.filter(r => r.id !== row.id) : [...prev, row]
          ),
        onToggleAll: checked => setSelected(checked ? rows.filter(r => !isSuspended(r)) : []),
        isRowSelected: row => selected.some(r => r.id === row.id),
        isRowDisabled: isSuspended,
      }}
      pagination={{
        totalCount: 42,
        pageIndex: 1,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        onNextPage: fn(),
        onPreviousPage: fn(),
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
    await userEvent.click(canvas.getByRole('button', { name: `Actions for ${at(rows, 0).name}` }));
    const body = within(document.body);
    await userEvent.click(await body.findByText('Change role'));
    await body.findByText('Make admin');
  },
};

/** Three sorted columns: the priority numbers and their screen reader text. */
export const MultiSort: Story = {
  render: () => (
    <FullTable
      sortBy={[
        { key: 'team', direction: 'asc' },
        { key: 'role', direction: 'desc' },
        { key: 'name', direction: 'asc' },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: /Role.*sort priority 2, descending/ })
    ).toBeInTheDocument();
  },
};

/** The expand column with selection and row menus, and the first row open. */
export const ExpandedRow: Story = {
  render: () => <FullTable expandFirst />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: `Details for ${at(rows, 0).name}` });
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByText(`Based in ${at(rows, 0).location}`)).toBeInTheDocument();
  },
};

export const DarkTheme: Story = {
  render: () => <FullTable />,
  globals: { theme: 'dark' },
};
