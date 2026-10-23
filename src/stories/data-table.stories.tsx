import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../components/data-table/data-table.tsx';
import type { TableActionMenuItem } from '../components/data-table/types.ts';
import { usePagination } from '../hooks/use-pagination.ts';
import { useTableSelection } from '../hooks/use-table-selection.ts';
import { useTableSort } from '../hooks/use-table-sort.ts';
import { at } from '../test-support/at.ts';
import { Demo, Intro } from './support/demo-ui.tsx';
import {
  defaultColumns,
  formatDate,
  isSuspended,
  type Member,
  members,
  sortKeysOf,
  sortMembers,
} from './support/members.tsx';

const SORT_KEYS = sortKeysOf(defaultColumns);

const meta = {
  title: 'Components/DataTable',
  component: DataTable,
  parameters: { layout: 'padded' },
  // `columns` and `data` are supplied by each story's render function.
  args: { columns: [], data: [] },
  argTypes: {
    columns: { table: { disable: true } },
    data: { table: { disable: true } },
  },
} satisfies Meta<typeof DataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

const onEdit = fn();
const onChangeRole = fn();
const onDelete = fn();

const actionMenu: TableActionMenuItem<Member>[] = [
  { label: 'View profile', href: ({ row }) => `#/members/${row.id}` },
  { label: ({ row }) => `Edit ${row.name.split(' ')[0]}`, callbackAction: onEdit },
  {
    label: 'Change role',
    subItems: [
      {
        label: 'Make admin',
        callbackAction: onChangeRole,
        hidden: ({ row }) => row.role === 'Admin',
      },
      {
        label: 'Make editor',
        callbackAction: onChangeRole,
        hidden: ({ row }) => row.role === 'Editor',
      },
      {
        label: 'Make viewer',
        callbackAction: onChangeRole,
        hidden: ({ row }) => row.role === 'Viewer',
      },
    ],
    hidden: ({ row }) => row.role === 'Owner',
  },
  {
    label: 'Remove from workspace',
    callbackAction: onDelete,
    hidden: ({ row }) => row.role === 'Owner',
    disabled: ({ row }) => isSuspended(row),
  },
];

interface PlaygroundArgs {
  withSorting: boolean;
  withSelection: boolean;
  withPagination: boolean;
  withActionMenu: boolean;
  selectOnRowClick: boolean;
  showPageCount: boolean;
  hideTableSettings: boolean;
  loading: boolean;
}

const PlaygroundTable = ({
  withSorting,
  withSelection,
  withPagination,
  withActionMenu,
  selectOnRowClick,
  showPageCount,
  hideTableSettings,
  loading,
}: PlaygroundArgs) => {
  const pageSize = 10;
  const { sort, direction, handleSort } = useTableSort({ sortableColumns: SORT_KEYS });
  const { offset, limit, reset, getPagination } = usePagination(pageSize);
  const sorted = useMemo(() => sortMembers(members, sort, direction), [sort, direction]);
  const rows = withPagination ? sorted.slice(offset, offset + limit) : sorted.slice(0, 25);
  const { selection, ...selectionHandlers } = useTableSelection(rows, {
    isRowDisabled: isSuspended,
  });

  return (
    <Demo>
      <Intro>
        Every feature at once over {members.length} rows. Use the controls panel to switch features
        on and off.
      </Intro>
      <p className="demo-note" aria-live="polite">
        {withSelection ? `${selection.length} selected` : 'Selection off'}
      </p>
      <DataTable
        columns={defaultColumns}
        data={rows}
        loading={loading}
        hideTableSettings={hideTableSettings}
        selectOnRowClick={selectOnRowClick}
        showPageCount={showPageCount}
        sort={
          withSorting
            ? {
                sortKey: sort,
                direction,
                handleSort: key => {
                  reset(); // back to page 1 when the sort changes
                  handleSort(key);
                },
              }
            : undefined
        }
        selection={
          withSelection
            ? { selectedRows: selection, isRowDisabled: isSuspended, ...selectionHandlers }
            : undefined
        }
        actionMenu={withActionMenu ? actionMenu : undefined}
        pagination={withPagination ? getPagination(sorted.length) : undefined}
      />
    </Demo>
  );
};

/** Every feature at once; toggle them from the controls panel. */
export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    withSorting: true,
    withSelection: true,
    withPagination: true,
    withActionMenu: true,
    selectOnRowClick: true,
    showPageCount: true,
    hideTableSettings: false,
    loading: false,
  },
  argTypes: {
    // Turning pagination off and on again remounts, so paging starts over.
    withPagination: { control: 'boolean' },
  },
  render: args => <PlaygroundTable key={String(args.withPagination)} {...args} />,
};

export const Loading: Story = {
  args: { loading: true, maxLoadingRows: 6 },
  render: args => (
    <Demo>
      <Intro>
        Skeleton rows stand in for data while <code>loading</code> is true. Toggle it in the
        controls; <code>maxLoadingRows</code> sets how many skeleton rows render.
      </Intro>
      <DataTable
        columns={defaultColumns}
        data={members.slice(0, 8)}
        loading={args.loading}
        maxLoadingRows={args.maxLoadingRows}
      />
    </Demo>
  ),
};

interface EmptyArgs {
  noResults: string;
}

export const Empty: StoryObj<EmptyArgs> = {
  args: { noResults: 'No members match these filters.' },
  render: ({ noResults }) => (
    <Demo>
      <Intro>
        The empty state. Its message comes from the <code>labels</code> prop; edit it in the
        controls.
      </Intro>
      <DataTable columns={defaultColumns} data={[]} labels={{ noResults }} />
    </Demo>
  ),
  play: async ({ canvasElement, args }) => {
    await expect(within(canvasElement).getByText(args.noResults)).toBeInTheDocument();
  },
};

const ExpandedRowsDemo = ({ rowCount }: { rowCount: number }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  return (
    <Demo>
      <Intro>
        Click a row to expand it. <code>renderExpandedRow</code> draws the panel; which rows are
        open is the consumer's state, toggled here from <code>onRowClick</code>.
      </Intro>
      <DataTable
        columns={defaultColumns}
        data={members.slice(0, rowCount)}
        hideTableSettings
        onRowClick={row => {
          setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(row.id)) {
              next.delete(row.id);
            } else {
              next.add(row.id);
            }
            return next;
          });
        }}
        renderExpandedRow={row =>
          expandedIds.has(row.id) ? (
            <div className="demo-expanded">
              <p>
                <span className="demo-muted">Location</span> {row.location}
              </p>
              <p>
                <span className="demo-muted">Last active</span> {formatDate(row.lastActive)}
              </p>
              <p>
                <span className="demo-muted">Storage</span> {row.storageGb.toFixed(1)} GB
              </p>
            </div>
          ) : null
        }
      />
    </Demo>
  );
};

export const ExpandedRows: StoryObj<{ rowCount: number }> = {
  args: { rowCount: 10 },
  argTypes: { rowCount: { control: { type: 'range', min: 3, max: 40, step: 1 } } },
  render: ({ rowCount }) => <ExpandedRowsDemo rowCount={rowCount} />,
};

/**
 * Test-only twin (hidden from the sidebar by `!dev`), so the story above stays
 * still for visitors: opens and closes the first row.
 */
export const ExpandedRowsInteraction: StoryObj<{ rowCount: number }> = {
  ...ExpandedRows,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = at(members, 0);
    await userEvent.click(canvas.getByText(first.name));
    await expect(canvas.getByText(first.location)).toBeInTheDocument();
    await userEvent.click(canvas.getByText(first.name));
    await waitFor(() => expect(canvas.queryByText('Last active')).not.toBeInTheDocument());
  },
};

export const WithActionMenu: StoryObj<{ rowCount: number }> = {
  args: { rowCount: 10 },
  argTypes: { rowCount: { control: { type: 'range', min: 3, max: 40, step: 1 } } },
  render: ({ rowCount }) => (
    <Demo>
      <Intro>
        Open a row's ⋮ menu. Items can be links, callbacks (logged in the Actions panel), or
        submenus, and any item can be hidden or disabled per row: <em>Change role</em> hides the
        member's current role and is absent for the Owner, and <em>Remove</em> is disabled for
        suspended members.
      </Intro>
      <DataTable
        columns={defaultColumns}
        data={members.slice(0, rowCount)}
        actionMenu={actionMenu}
        hideTableSettings
      />
    </Demo>
  ),
};

/**
 * Test-only twin (hidden from the sidebar by `!dev`), so the story above stays
 * still for visitors: opens the first row's menu and picks Edit.
 */
export const WithActionMenuInteraction: StoryObj<{ rowCount: number }> = {
  ...WithActionMenu,
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    onEdit.mockClear();
    const canvas = within(canvasElement);
    await userEvent.click(at(canvas.getAllByRole('button', { name: 'Actions' }), 0));
    const owner = at(members, 0);
    const firstName = at(owner.name.split(' '), 0);
    await userEvent.click(await within(document.body).findByText(`Edit ${firstName}`));
    await expect(onEdit).toHaveBeenCalledWith({
      row: expect.objectContaining({ id: owner.id }),
    });
  },
};
