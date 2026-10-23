import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { PaginationClient } from '../components/data-table/pagination-client.tsx';

const meta = {
  title: 'Components/PaginationClient',
  component: PaginationClient,
  parameters: { layout: 'padded' },
  args: {
    totalCount: 100,
    pageIndex: 2,
    pageSize: 10,
    hasNextPage: true,
    hasPreviousPage: true,
    handleNextPage: fn(),
    handlePreviousPage: fn(),
  },
} satisfies Meta<typeof PaginationClient>;

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

export const CustomLabels: Story = {
  args: {
    showPageCount: true,
    labels: {
      page: 'Página',
      of: 'de',
      showingRangeOf: ({ start, end, total }) => `Mostrando ${start}-${end} de ${total}`,
    },
  },
};

const InteractiveDemo = () => {
  const pageSize = 10;
  const totalCount = 42;
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <PaginationClient
      totalCount={totalCount}
      pageIndex={pageIndex}
      pageSize={pageSize}
      hasNextPage={(pageIndex + 1) * pageSize < totalCount}
      hasPreviousPage={pageIndex > 0}
      handleNextPage={() => setPageIndex(i => i + 1)}
      handlePreviousPage={() => setPageIndex(i => Math.max(0, i - 1))}
      showPageCount
    />
  );
};

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
};
