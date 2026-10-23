import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { SortableHeaderClient } from '../components/library/sortable-header-client/index.ts';

const meta = {
  title: 'Components/SortableHeaderClient',
  component: SortableHeaderClient,
  parameters: {
    layout: 'padded',
  },
  args: {
    title: 'Member name',
    sortKey: 'name',
    onSort: fn(),
  },
  decorators: [
    Story => (
      <table className="demo-mini-table">
        <thead>
          <tr className="demo-mini-table__row">
            <Story />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="demo-mini-table__cell">Row content</td>
          </tr>
        </tbody>
      </table>
    ),
  ],
} satisfies Meta<typeof SortableHeaderClient>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inactive: Story = {};

export const SortedAscending: Story = {
  args: {
    currentSortKey: 'name',
    currentDirection: 'asc',
  },
};

export const SortedDescending: Story = {
  args: {
    currentSortKey: 'name',
    currentDirection: 'desc',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
