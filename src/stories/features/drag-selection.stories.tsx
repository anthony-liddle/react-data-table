import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import { useTableSelection } from '../../hooks/use-table-selection.ts';
import { at } from '../../test-support/at.ts';
import { Demo, DemoButton, Intro, StatePanel, Toolbar } from '../support/demo-ui.tsx';
import { defaultColumns, isSuspended, members } from '../support/members.tsx';

interface DragSelectionDemoProps {
  /** Also toggle a row with a plain click (a drag never double-toggles). */
  selectOnRowClick: boolean;
  /** Suspended members are skipped when a drag range is applied. */
  disableSuspended: boolean;
  rowCount: number;
}

const DragSelectionTable = ({
  selectOnRowClick,
  disableSuspended,
  rowCount,
}: DragSelectionDemoProps) => {
  const rows = members.slice(0, rowCount);
  const isRowDisabled = disableSuspended ? isSuspended : undefined;
  const { selection, ...handlers } = useTableSelection(rows, { isRowDisabled });

  return (
    <Demo>
      <Intro>
        Press on a row, drag up or down across other rows, and release: every row in the range is
        added to the selection. The range is highlighted while you drag; leaving the table cancels
        it. Drags add to the existing selection, so you can sweep several ranges.
      </Intro>
      <StatePanel label="Selection">
        <Toolbar>
          <span data-testid="selected-count">{selection.length} selected</span>
          <DemoButton onClick={handlers.handleDeselectAll}>Clear selection</DemoButton>
        </Toolbar>
      </StatePanel>
      <DataTable
        columns={defaultColumns}
        data={rows}
        selectOnRowClick={selectOnRowClick}
        selection={{ selectedRows: selection, isRowDisabled, ...handlers }}
        hideTableSettings
      />
    </Demo>
  );
};

const DragSelectionDemo = (props: DragSelectionDemoProps) => (
  <DragSelectionTable key={`${props.disableSuspended}:${props.rowCount}`} {...props} />
);

const meta = {
  title: 'Features/Drag Selection',
  component: DragSelectionDemo,
  args: { selectOnRowClick: true, disableSuspended: true, rowCount: 15 },
  argTypes: {
    rowCount: { control: { type: 'range', min: 5, max: members.length, step: 5 } },
  },
} satisfies Meta<typeof DragSelectionDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DragSelection: Story = {};

/**
 * Test-only twin (hidden from the sidebar by `!dev`), so the story above stays
 * still for visitors: drags across four rows, then clears the selection.
 */
export const DragSelectionInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const nameCell = (i: number) =>
      at(at(canvasElement.querySelectorAll('tbody tr'), i).querySelectorAll('td'), 1);
    // Let React commit between events, since each handler reads the drag state
    // the previous event set.
    const settle = () => new Promise(resolve => setTimeout(resolve, 30));

    // Drag from the 2nd row to the 5th, then release. These are the exact
    // events the drag hook listens to (React derives onMouseEnter from mouseover).
    fireEvent.mouseDown(nameCell(1));
    await settle();
    for (const i of [2, 3, 4]) {
      fireEvent.mouseOver(nameCell(i));
      await settle();
    }
    await expect(canvasElement.querySelectorAll('tr.drag-selection-range')).toHaveLength(4);
    fireEvent.mouseUp(nameCell(4));

    const range = members.slice(1, 5);
    const expected = args.disableSuspended ? range.filter(m => !isSuspended(m)).length : 4;
    await waitFor(() =>
      expect(canvas.getByTestId('selected-count')).toHaveTextContent(`${expected} selected`)
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }));
    await waitFor(() =>
      expect(canvas.getByTestId('selected-count')).toHaveTextContent('0 selected')
    );
  },
};
