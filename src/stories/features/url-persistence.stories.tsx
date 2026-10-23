import type { Meta, StoryObj } from '@storybook/react-vite';

import { members } from '../support/members.tsx';
import { PersistenceDemo } from '../support/persistence-demo.tsx';

const meta = {
  title: 'Features/URL Persistence',
  component: PersistenceDemo,
  args: { mechanism: 'url', persistKey: 'url-demo', rowCount: 40 },
  argTypes: {
    mechanism: { table: { disable: true } },
    storyId: { table: { disable: true } },
    rowCount: { control: { type: 'range', min: 5, max: members.length, step: 5 } },
  },
  // The story id builds the shareable link back to this story.
  render: (args, { id }) => <PersistenceDemo {...args} storyId={id} />,
} satisfies Meta<typeof PersistenceDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

// No play function on purpose: one would overwrite the very state a visitor
// arrived with from a shared link. The round trip is tested in
// persistence-checks.stories.tsx instead.
export const UrlPersistence: Story = { name: 'URL Persistence' };
