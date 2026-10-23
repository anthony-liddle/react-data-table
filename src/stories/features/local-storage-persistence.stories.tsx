import type { Meta, StoryObj } from '@storybook/react-vite';

import { members } from '../support/members.tsx';
import { PersistenceDemo } from '../support/persistence-demo.tsx';

const meta = {
  title: 'Features/localStorage Persistence',
  component: PersistenceDemo,
  args: { mechanism: 'localStorage', persistKey: 'local-storage-demo', rowCount: 40 },
  argTypes: {
    mechanism: { table: { disable: true } },
    storyId: { table: { disable: true } },
    rowCount: { control: { type: 'range', min: 5, max: members.length, step: 5 } },
  },
} satisfies Meta<typeof PersistenceDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

// No play function on purpose: one would overwrite the saved view the visitor
// is reloading the page to see. The round trip is tested in
// persistence-checks.stories.tsx instead.
export const LocalStoragePersistence: Story = { name: 'localStorage Persistence' };
