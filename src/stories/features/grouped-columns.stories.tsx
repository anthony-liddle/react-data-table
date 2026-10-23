import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import type { TableColumn } from '../../components/data-table/types.ts';
import { useTableSelection } from '../../hooks/use-table-selection.ts';
import { useTableSort } from '../../hooks/use-table-sort.ts';
import { Demo, Intro } from '../support/demo-ui.tsx';
import {
  type Member,
  memberColumn,
  members,
  sortKeysOf,
  sortMembers,
} from '../support/members.tsx';

const groupedColumns: TableColumn<Member>[] = [
  memberColumn.name,
  memberColumn.team,
  {
    id: 'activity',
    header: 'Activity',
    headerClassName: 'text-center',
    subColumns: [memberColumn.joined, memberColumn.lastActive],
  },
  {
    id: 'usage',
    header: 'Usage',
    headerClassName: 'text-center',
    subColumns: [memberColumn.projects, memberColumn.storage],
  },
  memberColumn.status,
];

const SORT_KEYS = sortKeysOf(groupedColumns);

interface GroupedColumnsDemoProps {
  withSelection: boolean;
  hideTableSettings: boolean;
  rowCount: number;
}

const GroupedColumnsDemo = ({
  withSelection,
  hideTableSettings,
  rowCount,
}: GroupedColumnsDemoProps) => {
  const { sort, direction, handleSort } = useTableSort({ sortableColumns: SORT_KEYS });
  const rows = useMemo(
    () => sortMembers(members.slice(0, rowCount), sort, direction),
    [rowCount, sort, direction]
  );
  const selection = useTableSelection(rows);

  return (
    <Demo>
      <Intro>
        <strong>Activity</strong> and <strong>Usage</strong> are parent columns spanning their
        sub-columns, which get a second header row; ungrouped columns span both rows. Sub-columns
        sort on their own (try <em>Storage</em>), and the gear menu shows or hides a whole group at
        once.
      </Intro>
      <DataTable
        columns={groupedColumns}
        data={rows}
        sort={{ sortKey: sort, direction, handleSort }}
        hideTableSettings={hideTableSettings}
        selection={withSelection ? selection : undefined}
      />
    </Demo>
  );
};

const meta = {
  title: 'Features/Grouped Columns',
  component: GroupedColumnsDemo,
  args: { withSelection: false, hideTableSettings: false, rowCount: 12 },
  argTypes: {
    rowCount: { control: { type: 'range', min: 3, max: members.length, step: 1 } },
  },
} satisfies Meta<typeof GroupedColumnsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GroupedColumns: Story = {};

/**
 * Test-only twin (hidden from the sidebar by `!dev`), so the story above stays
 * still for visitors: checks the two-row header, then sorts a sub-column.
 */
export const GroupedColumnsInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const table = canvasElement.querySelector('table') as HTMLElement;
    const inTable = within(table);
    await expect(table.querySelectorAll('thead tr')).toHaveLength(2);
    await expect(inTable.getByText('Activity').closest('th')).toHaveAttribute('colspan', '2');

    // Storage is the 6th rendered cell: Name, Team, Joined, Last active, Projects, Storage.
    const storageValues = () =>
      [...table.querySelectorAll('tbody tr td:nth-child(6)')].map(td =>
        Number.parseFloat(td.textContent ?? '')
      );
    await userEvent.click(inTable.getByText('Storage'));
    await waitFor(() =>
      expect(storageValues()).toEqual([...storageValues()].sort((a, b) => a - b))
    );
    // Two more clicks cycle through descending back to unsorted.
    await userEvent.click(inTable.getByText('Storage'));
    await userEvent.click(inTable.getByText('Storage'));
  },
};
