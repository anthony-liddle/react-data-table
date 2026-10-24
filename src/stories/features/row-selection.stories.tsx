import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import { useTableSelection } from '../../hooks/use-table-selection.ts';
import { at } from '../../test-support/at.ts';
import { Demo, DemoButton, Intro, StatePanel, Toolbar } from '../support/demo-ui.tsx';
import { defaultColumns, isSuspended, members } from '../support/members.tsx';

interface RowSelectionDemoProps {
  /** Click anywhere on a row (not just its checkbox) to toggle it. */
  selectOnRowClick: boolean;
  /** Suspended members cannot be selected by any method. */
  disableSuspended: boolean;
  rowCount: number;
  /** Name each row checkbox after its member through `getRowLabel`. */
  labelRows: boolean;
}

const RowSelectionTable = ({
  selectOnRowClick,
  disableSuspended,
  rowCount,
  labelRows,
}: RowSelectionDemoProps) => {
  const rows = members.slice(0, rowCount);
  const isRowDisabled = disableSuspended ? isSuspended : undefined;
  const selection = useTableSelection(rows, { isRowDisabled });
  const disabledCount = isRowDisabled ? rows.filter(isRowDisabled).length : 0;

  return (
    <Demo>
      <Intro>
        Tick a row's checkbox, or the header checkbox to select every selectable row.
        {selectOnRowClick ? ' Clicking anywhere on a row also toggles it.' : ''}
        {disabledCount > 0
          ? ` The ${disabledCount} suspended member${disabledCount === 1 ? ' is' : 's are'} disabled and skipped by select-all.`
          : ''}{' '}
        {labelRows
          ? `Each checkbox is named for screen readers through getRowLabel, so the first row's is "Select ${at(rows, 0).name}".`
          : `This table passes no getRowLabel, so each checkbox falls back to its row id: the first row's is "Select row ${at(rows, 0).id}".`}
      </Intro>
      <StatePanel label="Selection">
        <Toolbar>
          <span data-testid="selected-count">
            {selection.selectedRows.length} of {rows.length - disabledCount} selected
          </span>
          <DemoButton onClick={selection.clearSelection}>Clear selection</DemoButton>
        </Toolbar>
        {selection.selectedRows.length > 0 && (
          <p className="demo-hint">
            {selection.selectedRows.map(member => member.name).join(', ')}
          </p>
        )}
      </StatePanel>
      <DataTable
        columns={defaultColumns}
        data={rows}
        selectOnRowClick={selectOnRowClick}
        selection={selection}
        getRowLabel={labelRows ? member => member.name : undefined}
        hideTableSettings
      />
    </Demo>
  );
};

/** Remounts on control changes so selection never points at rows that left the table. */
const RowSelectionDemo = (props: RowSelectionDemoProps) => (
  <RowSelectionTable key={`${props.disableSuspended}:${props.rowCount}`} {...props} />
);

const meta = {
  title: 'Features/Row Selection',
  component: RowSelectionDemo,
  args: { selectOnRowClick: true, disableSuspended: true, rowCount: 15, labelRows: true },
  argTypes: {
    rowCount: { control: { type: 'range', min: 5, max: members.length, step: 5 } },
  },
} satisfies Meta<typeof RowSelectionDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Selects the first row through its checkbox, then selects and clears all. */
const selectThroughCheckboxes =
  (firstRowCheckboxName: string): Story['play'] =>
  async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const count = () => canvas.getByTestId('selected-count').textContent ?? '';
    const rows = members.slice(0, args.rowCount);
    const selectable = args.disableSuspended
      ? rows.filter(m => !isSuspended(m)).length
      : rows.length;

    await userEvent.click(canvas.getByRole('checkbox', { name: firstRowCheckboxName }));
    await waitFor(() => expect(count()).toMatch(/^1 of/));

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all' }));
    await waitFor(() => expect(count()).toMatch(new RegExp(`^${selectable} of ${selectable}`)));

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select all' }));
    await waitFor(() => expect(count()).toMatch(/^0 of/));
  };

export const RowSelection: Story = {
  name: 'With row labels',
};

/** The same table without getRowLabel: checkboxes fall back to the row id. */
export const RowSelectionIdFallback: Story = {
  name: 'Id fallback',
  args: { labelRows: false },
};

/**
 * Test-only twins (hidden from the sidebar by `!dev`), so the stories above stay
 * still for visitors: each selects a row, then all, then none, and checks the
 * first checkbox's accessible name.
 */
export const RowSelectionInteraction: Story = {
  ...RowSelection,
  name: 'With row labels (interaction)',
  tags: ['!dev', '!autodocs'],
  play: selectThroughCheckboxes(`Select ${at(members, 0).name}`),
};

export const RowSelectionIdFallbackInteraction: Story = {
  ...RowSelectionIdFallback,
  name: 'Id fallback (interaction)',
  tags: ['!dev', '!autodocs'],
  play: selectThroughCheckboxes(`Select row ${at(members, 0).id}`),
};
