import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import { usePagination } from '../../hooks/use-pagination.ts';
import { Demo, Intro, KeyValues, StatePanel } from '../support/demo-ui.tsx';
import { defaultColumns, members } from '../support/members.tsx';

interface PaginationDemoProps {
  pageSize: number;
  /** Total rows to page through. */
  rowCount: number;
  /** Show the "Page N of M" indicator with bordered controls. */
  showPageCount: boolean;
}

const PaginationTable = ({ pageSize, rowCount, showPageCount }: PaginationDemoProps) => {
  const { offset, limit, getPagination } = usePagination({ pageSize });
  // Stand-in for an API call: the same offset and limit pick the page.
  const rows = members.slice(0, rowCount);

  return (
    <Demo>
      <Intro>
        Page with the arrows in the footer. <code>usePagination</code> tracks the page and hands
        back the <code>offset</code> and <code>limit</code> to send to an API, or to slice an array
        with, as this demo does. <code>getPagination(total)</code> builds the footer.
      </Intro>
      <StatePanel label="Current request">
        <KeyValues
          entries={[
            ['offset', String(offset)],
            ['limit', String(limit)],
          ]}
        />
      </StatePanel>
      <DataTable
        columns={defaultColumns}
        data={rows.slice(offset, offset + limit)}
        showPageCount={showPageCount}
        hideTableSettings
        pagination={getPagination(rows.length)}
      />
    </Demo>
  );
};

/** Remounts on size changes, so paging starts over from the first page. */
const PaginationDemo = (props: PaginationDemoProps) => (
  <PaginationTable key={`${props.pageSize}:${props.rowCount}`} {...props} />
);

const meta = {
  title: 'Features/Pagination',
  component: PaginationDemo,
  args: { pageSize: 10, rowCount: members.length, showPageCount: true },
  argTypes: {
    pageSize: { control: 'select', options: [5, 10, 20, 25, 50] },
    rowCount: { control: { type: 'range', min: 0, max: members.length, step: 1 } },
  },
} satisfies Meta<typeof PaginationDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Pagination: Story = {};

/**
 * Test-only twin (hidden from the sidebar by `!dev`), so the story above stays
 * still for visitors: pages forward and back.
 */
export const PaginationInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const pages = Math.ceil(args.rowCount / args.pageSize);
    const range = (from: number, to: number) => `Showing ${from}-${to} of ${args.rowCount} results`;

    await expect(canvas.getByText(range(1, args.pageSize))).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    if (args.showPageCount) {
      await expect(canvas.getByText(`Page 1 of ${pages}`)).toBeInTheDocument();
    }

    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await waitFor(() =>
      expect(canvas.getByText(range(args.pageSize + 1, args.pageSize * 2))).toBeInTheDocument()
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Previous page' }));
    await waitFor(() => expect(canvas.getByText(range(1, args.pageSize))).toBeInTheDocument());
  },
};
