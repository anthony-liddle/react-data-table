import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import { useTableExpansion } from '../../hooks/use-table-expansion.ts';
import { useTableSelection } from '../../hooks/use-table-selection.ts';
import { at } from '../../test-support/at.ts';
import { Demo, DemoButton, Intro, StatePanel, Toolbar } from '../support/demo-ui.tsx';
import { defaultColumns, formatDate, type Member, members } from '../support/members.tsx';

interface RowExpansionDemoProps {
  /** A click anywhere on a row, except on its controls, also toggles its panel. */
  expandOnRowClick: boolean;
  /** Adds checkboxes, so both leading columns stay in view when scrolled sideways. */
  withSelection: boolean;
  rowCount: number;
}

const MemberDetails = ({ row }: { row: Member }) => (
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
);

const RowExpansionTable = ({
  expandOnRowClick,
  withSelection,
  rowCount,
}: RowExpansionDemoProps) => {
  const rows = members.slice(0, rowCount);
  const expansion = useTableExpansion<Member>();
  const selection = useTableSelection(rows);
  const open = expansion.expandedIds
    .map(id => members.find(member => member.id === id)?.name)
    .join(', ');

  return (
    <Demo>
      <Intro>
        Open a member's details with the chevron, by mouse or by keyboard: focus it and press Enter
        or Space.
        {expandOnRowClick
          ? ' A click anywhere on a row also toggles it, except on the controls inside it.'
          : ''}{' '}
        Which rows are open is held by <code>useTableExpansion</code> here; without the{' '}
        <code>expansion</code> prop the table keeps it itself.
      </Intro>
      <StatePanel label="Expanded rows">
        <Toolbar>
          <span data-testid="expanded-state">{open || 'None'}</span>
          <DemoButton onClick={expansion.collapseAll}>Collapse all</DemoButton>
        </Toolbar>
      </StatePanel>
      <DataTable
        columns={defaultColumns}
        data={rows}
        getRowLabel={row => row.name}
        renderExpandedRow={row => <MemberDetails row={row} />}
        expansion={expansion}
        expandOnRowClick={expandOnRowClick}
        selection={withSelection ? selection : undefined}
      />
    </Demo>
  );
};

/** Remounts when the options change, so each starts with every row closed. */
const RowExpansionDemo = (props: RowExpansionDemoProps) => (
  <RowExpansionTable
    key={`${props.expandOnRowClick}:${props.withSelection}:${props.rowCount}`}
    {...props}
  />
);

const meta = {
  title: 'Features/Row Expansion',
  component: RowExpansionDemo,
  args: { expandOnRowClick: false, withSelection: false, rowCount: 10 },
  argTypes: {
    rowCount: { control: { type: 'range', min: 3, max: 40, step: 1 } },
  },
} satisfies Meta<typeof RowExpansionDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const RowExpansion: Story = {};

/**
 * Test-only twin (hidden from the sidebar by `!dev`), so the story above stays
 * still for visitors: opens and closes the first row from the keyboard. The
 * header's sort buttons come first in the tab order, so it focuses the row's
 * button directly.
 */
export const RowExpansionInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = at(members, 0);
    const button = canvas.getByRole('button', { name: `Details for ${first.name}` });

    button.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
    await expect(canvas.getByText(first.location as string)).toBeInTheDocument();
    await expect(canvas.getByTestId('expanded-state')).toHaveTextContent(first.name);

    await userEvent.keyboard(' ');
    await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'false'));
    await expect(canvas.getByTestId('expanded-state')).toHaveTextContent('None');
  },
};

/**
 * Test-only (hidden from the sidebar by `!dev`): in a narrow table scrolled
 * sideways, the expand and checkbox columns both stay in view.
 */
export const StickyLeadingColumns: Story = {
  tags: ['!dev', '!autodocs'],
  args: { withSelection: true },
  render: args => (
    <div style={{ width: 400 }}>
      <RowExpansionDemo {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.rdt-table__scroll') as HTMLElement;
    scroller.scrollLeft = 300;
    await waitFor(() => expect(scroller.scrollLeft).toBeGreaterThan(0));

    const box = (selector: string) =>
      (canvasElement.querySelector(selector) as HTMLElement).getBoundingClientRect();
    const expectStuck = async (row: number) => {
      const expandCell = box(`tbody tr:nth-child(${row}) .rdt-table__cell--expand`);
      const selectCell = box(`tbody tr:nth-child(${row}) .rdt-table__cell--select`);
      const scrollerBox = scroller.getBoundingClientRect();
      await expect(Math.abs(expandCell.left - scrollerBox.left)).toBeLessThanOrEqual(1);
      await expect(Math.abs(selectCell.left - expandCell.right)).toBeLessThanOrEqual(1);
    };
    await expectStuck(1);

    // Rows in a drag range stay stuck too. The drag hook listens for mouse
    // events (React derives onMouseEnter from mouseover).
    const nameCell = (row: number) =>
      canvasElement.querySelector(`tbody tr:nth-child(${row}) td:nth-child(3)`) as HTMLElement;
    fireEvent.mouseDown(nameCell(1));
    fireEvent.mouseOver(nameCell(2));
    await waitFor(() =>
      expect(canvasElement.querySelector('tbody tr:nth-child(1)')).toHaveAttribute(
        'data-drag-range'
      )
    );
    await expectStuck(1);
    fireEvent.mouseUp(nameCell(2));
  },
};
