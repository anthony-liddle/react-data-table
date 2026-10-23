import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import { usePagination } from '../../hooks/use-pagination.ts';
import { Demo, Intro, KeyValues, StatePanel } from '../support/demo-ui.tsx';
import { defaultColumns, fetchMemberPage, members } from '../support/members.tsx';

interface PaginationDemoProps {
  pageSize: number;
  /** Total rows the fake server holds. */
  rowCount: number;
  /** Show the "Page N of M" indicator with bordered controls. */
  showPageCount: boolean;
}

const PaginationTable = ({ pageSize, rowCount, showPageCount }: PaginationDemoProps) => {
  const { pagination, pageIndex, goToNext, goToPrevious, hasPreviousPage } =
    usePagination(pageSize);
  // Stand-in for a cursor-based server query (cursor = row offset).
  const page = fetchMemberPage(members.slice(0, rowCount), pagination.first, pagination.after);

  return (
    <Demo>
      <Intro>
        Page with the arrows in the footer. <code>usePagination</code> keeps a stack of cursors, so
        Previous returns to exactly the page you came from; the request it would send to a cursor
        API is shown below.
      </Intro>
      <StatePanel label="Next request">
        <KeyValues
          entries={[
            ['first', String(pagination.first)],
            ['after', pagination.after === null ? 'null' : `"${pagination.after}"`],
          ]}
        />
      </StatePanel>
      <DataTable
        columns={defaultColumns}
        data={page.items}
        showPageCount={showPageCount}
        hideTableSettings
        pagination={{
          totalCount: page.totalCount,
          pageIndex,
          pageSize,
          hasNextPage: page.hasNextPage,
          hasPreviousPage,
          handleNextPage: () =>
            goToNext({ hasNextPage: page.hasNextPage, endCursor: page.endCursor }),
          handlePreviousPage: goToPrevious,
        }}
      />
    </Demo>
  );
};

/** Remounts on size changes: a cursor stack built for one page size is meaningless for another. */
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

export const Pagination: Story = {
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
