import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import type { TableColumn } from '../../components/data-table/types.ts';
import { at } from '../../test-support/at.ts';
import { Demo, Intro, StatePanel, Toolbar } from '../support/demo-ui.tsx';
import { type Member, memberColumn, members } from '../support/members.tsx';

interface ClickableRowsDemoProps {
  rowCount: number;
}

const ClickableRowsDemo = ({ rowCount }: ClickableRowsDemoProps) => {
  const [opened, setOpened] = useState<{ name: string; by: string; count: number } | null>(null);
  const open = (member: Member, by: string) =>
    setOpened(previous => ({ name: member.name, by, count: (previous?.count ?? 0) + 1 }));

  // The main cell holds a real link: the keyboard and screen reader path. In an
  // app it would navigate; here it records the open instead.
  const columns: TableColumn<Member>[] = [
    {
      ...memberColumn.name,
      cell: ({ row }) => (
        <a
          href={`#/members/${row.id}`}
          className="demo-link"
          onClick={event => {
            event.preventDefault();
            open(row, 'its link');
          }}
        >
          {row.name}
        </a>
      ),
    },
    memberColumn.email,
    memberColumn.team,
    memberColumn.role,
  ];

  return (
    <Demo>
      <Intro>
        Click anywhere on a row to open its member, or Tab to a name and press Enter. Rows don't
        take focus, because a focused row can't announce that it does anything, so each row's main
        cell holds a real link and <code>onRowClick</code> is the mouse shortcut for the rest of the
        row. Clicks on the link don't count as row clicks, so an open never fires twice.
      </Intro>
      <StatePanel label="Last opened">
        <Toolbar>
          <span data-testid="opened">
            {opened ? `${opened.name}, by ${opened.by} (${opened.count} opened)` : 'Nothing yet'}
          </span>
        </Toolbar>
      </StatePanel>
      <DataTable
        columns={columns}
        data={members.slice(0, rowCount)}
        onRowClick={row => open(row, 'a row click')}
        hideTableSettings
      />
    </Demo>
  );
};

const meta = {
  title: 'Features/Clickable Rows',
  component: ClickableRowsDemo,
  args: { rowCount: 10 },
  argTypes: {
    rowCount: { control: { type: 'range', min: 3, max: 40, step: 1 } },
  },
} satisfies Meta<typeof ClickableRowsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ClickableRows: Story = {};

/**
 * Test-only twin (hidden from the sidebar by `!dev`), so the story above stays
 * still for visitors: opens a member by keyboard, by its link, and by a row
 * click, and checks a link click opens once.
 */
export const ClickableRowsInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opened = () => canvas.getByTestId('opened');
    const [first, second] = [at(members, 0), at(members, 1)];

    canvas.getByRole('link', { name: first.name }).focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(opened()).toHaveTextContent(`${first.name}, by its link (1`));

    await userEvent.click(canvas.getByRole('link', { name: second.name }));
    await waitFor(() => expect(opened()).toHaveTextContent(`${second.name}, by its link (2`));

    await userEvent.click(canvas.getByText(first.email));
    await waitFor(() => expect(opened()).toHaveTextContent(`${first.name}, by a row click (3`));
  },
};
