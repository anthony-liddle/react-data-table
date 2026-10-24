import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { PersistenceDemo, TwoPersistedTables } from './support/persistence-demo.tsx';

/**
 * Test-only round trips for the two persistence demos (hidden from the
 * sidebar by `!dev`). The visible stories have no play function, because one
 * would overwrite the state a visitor arrives with; these use their own
 * persist keys and reset when done.
 */
const meta = {
  title: 'Persistence Checks',
  component: PersistenceDemo,
  tags: ['!dev', '!autodocs'],
} satisfies Meta<typeof PersistenceDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

const headers = (root: HTMLElement) =>
  [...root.querySelectorAll('thead th')].map(th => th.textContent?.trim());

/** Sort by Name, filter to Design, and show the hidden Location column. */
const changeView = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole('button', { name: /^Name/ }));
  await userEvent.selectOptions(canvas.getByLabelText('Team'), 'Design');
  await userEvent.click(canvas.getByRole('button', { name: 'Column settings' }));
  const panel = within(await within(document.body).findByRole('dialog', { name: 'Columns' }));
  await userEvent.click(panel.getByRole('checkbox', { name: 'Location' }));
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(headers(canvasElement)).toContain('Location'));
};

/** Asserts the sort and team `changeView` set survived a remount. */
const expectSortAndTeamRestored = async (root: HTMLElement) => {
  const scope = within(root);
  await waitFor(() => expect(scope.getByLabelText('Team')).toHaveValue('Design'));
  const names = [...root.querySelectorAll('tbody tr td:first-child')].map(
    td => td.textContent ?? ''
  );
  await expect(names.length).toBeGreaterThan(1);
  await expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
};

const param = (name: string) => new URL(window.location.href).searchParams.get(name);

export const UrlRoundTrip: Story = {
  args: { mechanism: 'url', persistKey: 'url-round-trip', rowCount: 120 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await changeView(canvasElement);
    await waitFor(() => expect(param('url-round-trip.team')).toBe('Design'));
    await expect(param('url-round-trip.sort')).toBe('name');

    // The button wipes localStorage before the remount, so the URL alone
    // carries the sort and team back. Columns are never in the URL.
    await userEvent.click(canvas.getByRole('button', { name: 'Reload table from URL' }));
    await expectSortAndTeamRestored(canvasElement);
    await expect(headers(canvasElement)).not.toContain('Location');

    await userEvent.click(canvas.getByRole('button', { name: 'Reset view' }));
    await waitFor(() => expect(canvas.getByLabelText('Team')).toHaveValue('all'));
  },
};

export const LocalStorageRoundTrip: Story = {
  args: { mechanism: 'localStorage', persistKey: 'local-round-trip', rowCount: 120 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await changeView(canvasElement);
    await waitFor(() => expect(localStorage.getItem('rdt:1:local-round-trip:sort')).toBe('name'));

    // The button strips the table's params before the remount, so the view
    // comes back from localStorage, columns included; restoring it writes the
    // sort straight back to the URL.
    await userEvent.click(canvas.getByRole('button', { name: 'Reload table from localStorage' }));
    await expectSortAndTeamRestored(canvasElement);
    await expect(headers(canvasElement)).toContain('Location');
    await waitFor(() => expect(param('local-round-trip.sort')).toBe('name'));

    await userEvent.click(canvas.getByRole('button', { name: 'Reset view' }));
    await waitFor(() => expect(canvas.getByLabelText('Team')).toHaveValue('all'));
  },
};

/** Two tables with their own persistKey on one page keep their views apart. */
export const TwoTablesOnOnePage: Story = {
  args: { mechanism: 'localStorage', persistKey: 'two', rowCount: 40 },
  render: ({ rowCount }) => <TwoPersistedTables rowCount={rowCount} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const left = () => canvas.getByRole('region', { name: 'two-left' });
    const right = () => canvas.getByRole('region', { name: 'two-right' });
    const sortOf = (region: HTMLElement, column: string) =>
      within(region)
        .getByRole('button', { name: new RegExp(`^${column}`) })
        .closest('th');

    await userEvent.click(within(left()).getByRole('button', { name: /^Name/ }));
    await userEvent.selectOptions(within(left()).getByLabelText('Team'), 'Design');
    await userEvent.click(within(right()).getByRole('button', { name: /^Team/ }));
    await userEvent.click(within(right()).getByRole('button', { name: /^Team/ }));
    await waitFor(() => expect(param('two-right.sort')).toBe('-team'));
    await expect(param('two-left.sort')).toBe('name');
    await expect(param('two-left.team')).toBe('Design');
    await expect(param('two-right.team')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Remount tables' }));
    await expectSortAndTeamRestored(left());
    await expect(within(right()).getByLabelText('Team')).toHaveValue('all');
    await expect(sortOf(right(), 'Team')).toHaveAttribute('aria-sort', 'descending');
    await expect(sortOf(left(), 'Name')).toHaveAttribute('aria-sort', 'ascending');
  },
};
