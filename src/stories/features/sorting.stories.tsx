import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import { SortOrder } from '../../components/data-table/types.ts';
import { useTableSort } from '../../hooks/use-table-sort.ts';
import { Demo, DemoButton, Intro, StatePanel, Toolbar } from '../support/demo-ui.tsx';
import { defaultColumns, members, sortKeysOf, sortMembers } from '../support/members.tsx';

const SORT_KEYS = sortKeysOf(defaultColumns);

interface SortingDemoProps {
  /** Column sorted on first render. */
  defaultSortKey: string;
  defaultSortDirection: 'asc' | 'desc';
  rowCount: number;
}

const SortingTable = ({ defaultSortKey, defaultSortDirection, rowCount }: SortingDemoProps) => {
  const { sort, direction, handleSort, reset } = useTableSort({
    sortableColumns: SORT_KEYS,
    defaultSortKey: defaultSortKey === 'none' ? undefined : defaultSortKey,
    defaultSortDirection:
      defaultSortKey === 'none'
        ? undefined
        : defaultSortDirection === 'asc'
          ? SortOrder.Asc
          : SortOrder.Desc,
  });

  const rows = useMemo(
    () => sortMembers(members.slice(0, rowCount), sort, direction),
    [rowCount, sort, direction]
  );
  const column = defaultColumns.find(c => c.sortKey === sort);

  return (
    <Demo>
      <Intro>
        Click any header with the ⇅ icon. Each click cycles that column ascending → descending →
        unsorted. One column sorts at a time: the component's <code>sort</code> prop holds a single
        key, so multi-column sorting is not supported.
      </Intro>
      <StatePanel label="Sort state">
        <Toolbar>
          <span data-testid="sort-state">
            {column && direction
              ? `${column.header}, ${direction === SortOrder.Asc ? 'ascending' : 'descending'}`
              : 'Unsorted (original order)'}
          </span>
          <DemoButton onClick={reset}>Clear sort</DemoButton>
        </Toolbar>
      </StatePanel>
      <DataTable
        columns={defaultColumns}
        data={rows}
        sort={{ sortKey: sort, direction, handleSort }}
        hideTableSettings
      />
    </Demo>
  );
};

/** Remounts when the defaults change so the new defaults actually apply. */
const SortingDemo = (props: SortingDemoProps) => (
  <SortingTable
    key={`${props.defaultSortKey}:${props.defaultSortDirection}:${props.rowCount}`}
    {...props}
  />
);

const meta = {
  title: `Features/${'Sorting'}`,
  component: SortingDemo,
  args: { defaultSortKey: 'none', defaultSortDirection: 'asc', rowCount: 15 },
  argTypes: {
    defaultSortKey: { control: 'select', options: ['none', ...SORT_KEYS] },
    defaultSortDirection: { control: 'inline-radio', options: ['asc', 'desc'] },
    rowCount: { control: { type: 'range', min: 5, max: members.length, step: 5 } },
  },
} satisfies Meta<typeof SortingDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sorting: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstName = () => canvasElement.querySelector('tbody tr td')?.textContent;
    const original = firstName();

    await userEvent.click(canvas.getByText('Name'));
    await waitFor(() => expect(canvas.getByTestId('sort-state')).toHaveTextContent('Name, asc'));
    const ascending = firstName();
    await userEvent.click(canvas.getByText('Name'));
    await waitFor(() => expect(firstName()).not.toBe(ascending));
    await userEvent.click(canvas.getByText('Name'));
    await waitFor(() => expect(firstName()).toBe(original));
  },
};
