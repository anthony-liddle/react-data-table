import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
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
  const defaultSortBy = useMemo(
    () =>
      defaultSortKey === 'none' ? [] : [{ key: defaultSortKey, direction: defaultSortDirection }],
    [defaultSortKey, defaultSortDirection]
  );
  const sort = useTableSort({ sortableColumns: SORT_KEYS, defaultSortBy });

  const rows = useMemo(
    () => sortMembers(members.slice(0, rowCount), sort.sortBy),
    [rowCount, sort.sortBy]
  );
  const state = sort.sortBy
    .map(({ key, direction }) => {
      const header = defaultColumns.find(c => c.sortKey === key)?.header ?? key;
      return `${header} ${direction === 'asc' ? 'ascending' : 'descending'}`;
    })
    .join(', ');

  return (
    <Demo>
      <Intro>
        Click any header with the ⇅ icon. Each click cycles that column ascending → descending →
        unsorted, and one column sorts at a time.
      </Intro>
      <StatePanel label="Sort state">
        <Toolbar>
          <span data-testid="sort-state">{state || 'Unsorted (original order)'}</span>
          <DemoButton onClick={() => sort.setSortBy([])}>Clear sort</DemoButton>
        </Toolbar>
      </StatePanel>
      <DataTable columns={defaultColumns} data={rows} sort={sort} hideTableSettings />
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
  title: 'Features/Sorting',
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

export const Sorting: Story = {};

/**
 * Test-only twin (hidden from the sidebar by `!dev`), so the story above stays
 * still for visitors: clicks through the sort cycle on Name.
 */
export const SortingInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstName = () => canvasElement.querySelector('tbody tr td')?.textContent;
    const original = firstName();

    await userEvent.click(canvas.getByText('Name'));
    await waitFor(() =>
      expect(canvas.getByTestId('sort-state')).toHaveTextContent('Name ascending')
    );
    const ascending = firstName();
    await userEvent.click(canvas.getByText('Name'));
    await waitFor(() => expect(firstName()).not.toBe(ascending));
    await userEvent.click(canvas.getByText('Name'));
    await waitFor(() => expect(firstName()).toBe(original));
  },
};
