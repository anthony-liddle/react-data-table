import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Pagination } from '../components/data-table/pagination.tsx';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: { layout: 'padded' },
  args: {
    totalCount: 100,
    pageIndex: 2,
    pageSize: 10,
    hasNextPage: true,
    hasPreviousPage: true,
    onNextPage: fn(),
    onPreviousPage: fn(),
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPageCount: Story = {
  args: { showPageCount: true },
};

export const FirstPage: Story = {
  args: { pageIndex: 0, hasPreviousPage: false, showPageCount: true },
};

export const LastPage: Story = {
  args: { pageIndex: 9, hasNextPage: false, showPageCount: true },
};

export const NoResults: Story = {
  args: {
    totalCount: 0,
    pageIndex: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    showPageCount: true,
  },
};

/**
 * A cursor API with no total: the range ends at the page's row count, there is
 * no page count even with showPageCount, and Next follows hasNextPage.
 */
export const WithoutTotal: Story = {
  args: { totalCount: undefined, pageRowCount: 7, hasNextPage: false, showPageCount: true },
};

export const CustomLabels: Story = {
  args: {
    showPageCount: true,
    labels: {
      pageOf: ({ page, pageCount }) => `Página ${page} de ${pageCount}`,
      previousPage: 'Página anterior',
      nextPage: 'Página siguiente',
      showingRangeOf: ({ start, end, total }) => `Mostrando ${start}-${end} de ${total}`,
    },
  },
};

const InteractiveDemo = () => {
  const pageSize = 10;
  const totalCount = 42;
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <Pagination
      totalCount={totalCount}
      pageIndex={pageIndex}
      pageSize={pageSize}
      hasNextPage={(pageIndex + 1) * pageSize < totalCount}
      hasPreviousPage={pageIndex > 0}
      onNextPage={() => setPageIndex(i => i + 1)}
      onPreviousPage={() => setPageIndex(i => Math.max(0, i - 1))}
      showPageCount
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
