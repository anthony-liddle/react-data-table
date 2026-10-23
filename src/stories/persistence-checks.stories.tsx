import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { PersistenceDemo } from './support/persistence-demo.tsx';

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
  await userEvent.click(canvas.getByText('Name'));
  await userEvent.selectOptions(canvas.getByLabelText('Team'), 'Design');
  await userEvent.click(canvas.getByRole('button', { name: 'Column settings' }));
  const panel = within(await within(document.body).findByRole('dialog', { name: 'Columns' }));
  await userEvent.click(panel.getByRole('checkbox', { name: 'Location' }));
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(headers(canvasElement)).toContain('Location'));
};

/** Asserts the view `changeView` set up survived a remount. */
const expectViewRestored = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await waitFor(() => expect(canvas.getByLabelText('Team')).toHaveValue('Design'));
  await expect(headers(canvasElement)).toContain('Location');
  const names = [...canvasElement.querySelectorAll('tbody tr td:first-child')].map(
    td => td.textContent ?? ''
  );
  await expect(names.length).toBeGreaterThan(1);
  await expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
};

export const UrlRoundTrip: Story = {
  args: { mechanism: 'url', persistKey: 'url-round-trip', rowCount: 120 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await changeView(canvasElement);
    await waitFor(() =>
      expect(new URL(window.location.href).searchParams.get('team')).toBe('Design')
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Reload table from URL' }));
    await expectViewRestored(canvasElement);
    // Restored with localStorage wiped, so the URL alone carried the view.
    await expect(localStorage.getItem('datatable:url-round-trip')).toBeNull();
    await expect(localStorage.getItem('tablesort:url-round-trip:key')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Reset view' }));
    await waitFor(() => expect(canvas.getByLabelText('Team')).toHaveValue('all'));
  },
};

export const LocalStorageRoundTrip: Story = {
  args: { mechanism: 'localStorage', persistKey: 'local-round-trip', rowCount: 120 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await changeView(canvasElement);
    await waitFor(() =>
      expect(localStorage.getItem('tablesort:local-round-trip:key')).toBe('"name"')
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Reload table from localStorage' }));
    await expectViewRestored(canvasElement);
    // The sort hook does not write on mount, so a missing ?sort= after the
    // remount shows the sort came back from localStorage, not the URL.
    await expect(new URL(window.location.href).searchParams.get('sort')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Reset view' }));
    await waitFor(() => expect(canvas.getByLabelText('Team')).toHaveValue('all'));
  },
};
