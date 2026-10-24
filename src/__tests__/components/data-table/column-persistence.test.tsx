import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
import type { TableColumn } from '@/components/data-table/types';

interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
}

const columns: TableColumn<Row>[] = [
  { id: 'name', header: 'Name', cell: ({ row }) => row.name },
  { id: 'email', header: 'Email', cell: ({ row }) => row.email },
  { id: 'role', header: 'Role', cell: ({ row }) => row.role },
];
const rows: Row[] = [{ id: '1', name: 'Ada', email: 'ada@example.com', role: 'Owner' }];

// The layout a user saved: Email hidden, Role moved first.
const SIG = ['name', 'email', 'role'].join('\u001f');
const saved = { toggles: { email: false }, order: ['role', 'name', 'email'], orderSig: SIG };

// Whether a URL is a link is remembered per key for the whole document, so
// every test persists under a key of its own.
let keys = 0;
const freshKey = () => `columns${++keys}`;
const setSearch = (search: string) =>
  window.history.replaceState(null, '', search ? `/?${search}` : '/');
const headers = (root: ParentNode = document) =>
  [...root.querySelectorAll('thead th')].map(th => th.textContent).filter(Boolean);

afterEach(() => {
  setSearch('');
  localStorage.clear();
});

describe('column layout persistence', () => {
  it('restores column visibility and order from storage on the first client render', () => {
    const key = freshKey();
    localStorage.setItem(`rdt:1:${key}:columns`, JSON.stringify(saved));
    render(<DataTable columns={columns} data={rows} persistKey={key} />);
    expect(headers()).toEqual(['Role', 'Name']);
  });

  it('hydrates the default layout, then restores, without a mismatch', async () => {
    const key = freshKey();
    localStorage.setItem(`rdt:1:${key}:columns`, JSON.stringify(saved));
    const table = <DataTable columns={columns} data={rows} persistKey={key} />;
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(table);
    expect(headers(container)).toEqual(['Name', 'Email', 'Role']);

    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, table, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(headers(container)).toEqual(['Role', 'Name']);
    container.remove();
  });

  it('saves to versioned storage and never writes a URL param for columns', async () => {
    const key = freshKey();
    render(<DataTable columns={columns} data={rows} persistKey={key} />);
    await userEvent.click(screen.getByRole('button', { name: 'Column settings' }));
    const panel = await screen.findByRole('dialog', { name: 'Columns' });
    await userEvent.click(within(panel).getByRole('checkbox', { name: 'Email' }));

    expect(headers()).toEqual(['Name', 'Role']);
    expect(window.location.search).toBe('');
    expect(JSON.parse(localStorage.getItem(`rdt:1:${key}:columns`) ?? '{}')).toMatchObject({
      toggles: { email: false },
    });
  });

  it('ignores 0.4 state', () => {
    const key = freshKey();
    localStorage.setItem(`datatable:${key}`, JSON.stringify(saved));
    setSearch(`cols=${encodeURIComponent(JSON.stringify(saved))}`);
    render(<DataTable columns={columns} data={rows} persistKey={key} />);
    expect(headers()).toEqual(['Name', 'Email', 'Role']);
  });

  it('restores the layout when the URL is a link', () => {
    const key = freshKey();
    setSearch(`${key}.sort=name`);
    localStorage.setItem(`rdt:1:${key}:columns`, JSON.stringify(saved));
    render(<DataTable columns={columns} data={rows} persistKey={key} />);
    expect(headers()).toEqual(['Role', 'Name']);
  });

  it('drops a saved order when the column set changed, keeping visibility', () => {
    const key = freshKey();
    localStorage.setItem(
      `rdt:1:${key}:columns`,
      JSON.stringify({ ...saved, orderSig: ['name', 'role'].join('\u001f') })
    );
    render(<DataTable columns={columns} data={rows} persistKey={key} />);
    expect(headers()).toEqual(['Name', 'Role']);
  });
});
