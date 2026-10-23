import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../../components/data-table/data-table.tsx';
import type { TableColumn, VisibleColumn } from '../../components/data-table/types.ts';
import { Demo, Intro, KeyValues, StatePanel } from '../support/demo-ui.tsx';
import { type Member, memberColumn, members } from '../support/members.tsx';

const columns: TableColumn<Member>[] = [
  memberColumn.name,
  memberColumn.email,
  memberColumn.team,
  memberColumn.role,
  memberColumn.status,
  memberColumn.joined,
  { ...memberColumn.location, hideByDefault: true },
  { ...memberColumn.lastActive, hideByDefault: true },
  { ...memberColumn.storage, hideByDefault: true },
];

const headerOf = (id: string) => columns.find(c => c.id === id)?.header ?? id;

interface ColumnManagementDemoProps {
  /** Hide the gear menu entirely. */
  hideTableSettings: boolean;
  rowCount: number;
  onColumnReorder: (order: string[]) => void;
  onVisibleColumnsChange: (columns: VisibleColumn[]) => void;
}

const ColumnManagementDemo = ({
  hideTableSettings,
  rowCount,
  onColumnReorder,
  onVisibleColumnsChange,
}: ColumnManagementDemoProps) => {
  const [order, setOrder] = useState(() => columns.map(c => c.id as string));
  const [visibility, setVisibility] = useState<VisibleColumn[]>(() =>
    columns.map(c => ({ id: c.id as string, visible: !c.hideByDefault }))
  );
  const hidden = visibility.filter(v => !v.visible).map(v => headerOf(v.id));

  return (
    <Demo>
      <Intro>
        Open the gear menu in the header's last cell. Tick columns on or off, and drag the ⋮⋮ handle
        to reorder them (or focus a handle, press Space, move with the arrow keys, and press Space
        again). <em>Location</em>, <em>Last active</em> and <em>Storage</em> start hidden with{' '}
        <code>hideByDefault</code>.
      </Intro>
      <StatePanel label="Column state">
        <KeyValues
          entries={[
            ['order', order.map(headerOf).join(' → ')],
            ['hidden', hidden.length > 0 ? hidden.join(', ') : 'none'],
          ]}
        />
      </StatePanel>
      <DataTable
        columns={columns}
        data={members.slice(0, rowCount)}
        hideTableSettings={hideTableSettings}
        onColumnReorder={next => {
          setOrder(next);
          onColumnReorder(next);
        }}
        onVisibleColumnsChange={next => {
          setVisibility(next);
          onVisibleColumnsChange(next);
        }}
      />
    </Demo>
  );
};

const meta = {
  title: 'Features/Column Management',
  component: ColumnManagementDemo,
  args: {
    hideTableSettings: false,
    rowCount: 10,
    onColumnReorder: fn(),
    onVisibleColumnsChange: fn(),
  },
  argTypes: {
    rowCount: { control: { type: 'range', min: 3, max: members.length, step: 1 } },
  },
} satisfies Meta<typeof ColumnManagementDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ColumnManagement: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const headers = () => [...canvasElement.querySelectorAll('thead th')].map(th => th.textContent);
    await expect(headers()).not.toContain('Location');

    await userEvent.click(canvas.getByRole('button', { name: 'Column settings' }));
    const panel = within(await within(document.body).findByRole('dialog', { name: 'Columns' }));
    await userEvent.click(panel.getByRole('checkbox', { name: 'Location' }));
    await waitFor(() => expect(headers()).toContain('Location'));
    await expect(args.onVisibleColumnsChange).toHaveBeenCalled();

    // Put it back so the story opens in its documented default state.
    await userEvent.click(panel.getByRole('checkbox', { name: 'Location' }));
    await waitFor(() => expect(headers()).not.toContain('Location'));
    await userEvent.keyboard('{Escape}');
  },
};
