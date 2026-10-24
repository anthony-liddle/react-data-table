/// <reference types="vite/client" />
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { DataTable } from '../components/data-table/data-table.tsx';
import { Pagination } from '../components/data-table/pagination.tsx';
import type { TableActionMenuItem, TableColumn } from '../components/data-table/types.ts';
// The unlayered stylesheet as text: the Storybook loads it inside a cascade
// layer, which any unlayered rule beats, but the default contract is unlayered.
import packageCss from '../styles.css?inline';
import { type Member, memberColumn, members } from './support/members.tsx';

/**
 * Test-only stories (hidden from the sidebar by `!dev`) for conditions a
 * feature story never meets.
 */
const meta = {
  title: 'Edge Cases',
  component: DataTable,
  tags: ['!dev', '!autodocs'],
  args: { columns: [], data: [] },
} satisfies Meta<typeof DataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = [
  { id: '1', name: 'Ada' },
  { id: '2', name: 'Bram' },
];
const columns: TableColumn<Row>[] = [{ id: 'name', header: 'Name', cell: ({ row }) => row.name }];

const onFrameRowClick = fn();

/** A table rendered by this page's React into an iframe's document. */
const TableInAFrame = () => {
  const frame = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  useEffect(() => setBody(frame.current?.contentDocument?.body ?? null), []);
  return (
    <>
      <iframe ref={frame} title="A table in a frame" style={{ width: 480, height: 200 }} />
      {body
        && createPortal(
          <DataTable columns={columns} data={rows} onRowClick={onFrameRowClick} />,
          body
        )}
    </>
  );
};

/**
 * Nodes inside the iframe come from another realm, so they fail `instanceof`
 * checks against this page's `Node`. A row click there must still count.
 */
export const RowClickInAnIframe: Story = {
  render: () => <TableInAFrame />,
  play: async ({ canvasElement }) => {
    onFrameRowClick.mockClear();
    const frame = canvasElement.querySelector('iframe') as HTMLIFrameElement;
    const cell = () => frame.contentDocument?.querySelector('tbody td');
    await waitFor(() => expect(cell()).not.toBeNull());
    (cell() as HTMLElement).click();
    await expect(onFrameRowClick).toHaveBeenCalledWith(rows[0]);
  },
};

const onChevronRowClick = fn();

/**
 * A click anywhere in the expand cell lands on its button, so a near-miss
 * beside the small chevron never counts as a row click.
 */
export const ExpandCellHitArea: Story = {
  render: () => (
    <DataTable
      columns={columns}
      data={rows}
      renderExpandedRow={row => <p>Details of {row.name}</p>}
      onRowClick={onChevronRowClick}
    />
  ),
  play: async ({ canvasElement }) => {
    const cell = canvasElement.querySelector('tbody .rdt-table__cell--expand') as HTMLElement;
    const box = cell.getBoundingClientRect();
    const corners = [
      [box.left + 2, box.top + 2],
      [box.right - 2, box.top + 2],
      [box.left + 2, box.bottom - 2],
      [box.right - 2, box.bottom - 2],
    ] as const;
    for (const [x, y] of corners) {
      await expect(document.elementFromPoint(x, y)?.closest('.rdt-expand-button')).not.toBeNull();
    }
  },
};

// The top header row's labels, left to right.
const headers = (root: HTMLElement) =>
  [...root.querySelectorAll('thead tr:first-child th')]
    .map(th => th.textContent?.trim())
    .filter(Boolean);

/** Moves a column one place down in the open column panel, by keyboard. */
const moveDownInPanel = async (canvasElement: HTMLElement, column: string) => {
  await userEvent.click(within(canvasElement).getByRole('button', { name: 'Column settings' }));
  const panel = within(await within(document.body).findByRole('dialog', { name: 'Columns' }));
  panel.getByRole('button', { name: `Reorder ${column}` }).focus();
  await userEvent.keyboard(' ');
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard(' ');
  return panel;
};

/**
 * A pinned (alwaysVisible) column stays out of the column panel and keeps its
 * place while the others are reordered around it.
 */
export const PinnedColumnReorder: Story = {
  render: () => (
    <DataTable
      columns={[
        { ...memberColumn.name, alwaysVisible: true },
        memberColumn.email,
        memberColumn.team,
        memberColumn.role,
      ]}
      data={members.slice(0, 5)}
    />
  ),
  play: async ({ canvasElement }) => {
    const panel = await moveDownInPanel(canvasElement, 'Email');
    await expect(panel.queryByRole('checkbox', { name: 'Name' })).toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(headers(canvasElement)).toEqual(['Name', 'Team', 'Email', 'Role']));
  },
};

const groupedPinned: TableColumn<Member>[] = [
  { ...memberColumn.name, alwaysVisible: true },
  { id: 'contact', header: 'Contact', subColumns: [memberColumn.email, memberColumn.role] },
  memberColumn.team,
];

/** The same with grouped columns, where reordering used to do nothing. */
export const PinnedColumnReorderGrouped: Story = {
  render: () => <DataTable columns={groupedPinned} data={members.slice(0, 5)} />,
  play: async ({ canvasElement }) => {
    await moveDownInPanel(canvasElement, 'Contact');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(headers(canvasElement)).toEqual(['Name', 'Team', 'Contact']));
  },
};

// Unset every theme token, so the package's own defaults show: what a page
// with no theme gets. `initial` makes a custom property invalid, and var()
// then falls back.
const THEME_TOKENS = [
  'background',
  'foreground',
  'card',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'border',
  'ring',
];
const noTheme = Object.fromEntries(
  THEME_TOKENS.map(token => [`--${token}`, 'initial'])
) as CSSProperties;

const NoTheme = ({ dark, children }: { dark?: boolean; children: ReactNode }) => (
  <div
    className={dark ? 'dark' : undefined}
    // A dark page under the section, as a real dark section has.
    style={{ ...noTheme, color: 'rgb(255, 0, 0)', backgroundColor: 'rgb(10, 10, 10)' }}
  >
    {children}
  </div>
);

const channels = (color: string) => (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const brightness = (color: string) => channels(color).reduce((sum, value) => sum + value, 0);

/** With no theme, a table in a `.dark` section uses the dark defaults for its text too. */
export const TextInADarkSection: Story = {
  render: () => (
    <NoTheme dark>
      <DataTable columns={columns} data={rows} />
    </NoTheme>
  ),
  play: async ({ canvasElement }) => {
    const cell = canvasElement.querySelector('tbody td') as HTMLElement;
    await expect(brightness(getComputedStyle(cell).color)).toBeGreaterThan(600);
  },
};

const paginationProps = {
  totalCount: 30,
  pageIndex: 1,
  pageSize: 10,
  hasNextPage: true,
  hasPreviousPage: true,
  onNextPage: fn(),
  onPreviousPage: fn(),
};

/** `.dark` on a component's own element works like `.dark` on an ancestor. */
export const DarkOnTheElementItself: Story = {
  render: () => (
    <NoTheme>
      <div className="dark" data-testid="inside">
        <Pagination {...paginationProps} />
      </div>
      <div data-testid="itself">
        <Pagination {...paginationProps} className="dark" />
      </div>
    </NoTheme>
  ),
  play: async ({ canvasElement }) => {
    const range = (testId: string) =>
      canvasElement.querySelector(`[data-testid="${testId}"] .rdt-pagination__range`) as Element;
    await expect(getComputedStyle(range('itself')).color).toBe(
      getComputedStyle(range('inside')).color
    );
  },
};

const menuItems: TableActionMenuItem<Row>[] = [
  { label: 'Profile', href: '#profile', icon: <span aria-hidden="true">P</span> },
  { label: 'Edit', onSelect: fn(), icon: <span aria-hidden="true">E</span> },
  {
    label: 'Move',
    icon: <span aria-hidden="true">M</span>,
    subItems: [{ label: 'To the top', onSelect: fn(), icon: <span aria-hidden="true">T</span> }],
  },
];

// The space between a menu item's icon and its label.
const labelGap = (item: Element, label: string): number => {
  const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && node.textContent?.trim() !== label) {
    node = walker.nextNode();
  }
  const icon = item.querySelector('.rdt-action-menu__icon');
  if (!node || !icon) {
    return Number.NaN;
  }
  const range = document.createRange();
  range.selectNodeContents(node);
  return Math.round(range.getBoundingClientRect().left - icon.getBoundingClientRect().right);
};

/** Open menus and the column panel follow the `.dark` section their table is in. */
export const MenusFollowADarkSection: Story = {
  render: () => (
    <div className="dark">
      <DataTable columns={columns} data={rows} actionMenu={menuItems} getRowLabel={r => r.name} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Actions for Ada' }));
    const menu = await body.findByRole('menu');
    await expect(brightness(getComputedStyle(menu).backgroundColor)).toBeLessThan(150);
    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByRole('button', { name: 'Column settings' }));
    const panel = await body.findByRole('dialog', { name: 'Columns' });
    await expect(brightness(getComputedStyle(panel).backgroundColor)).toBeLessThan(150);
    await userEvent.keyboard('{Escape}');
  },
};

/**
 * Plain items, link items and submenu items are all the same height, and their
 * labels sit the same distance from their icons.
 */
export const MenuItemHeights: Story = {
  render: () => (
    <DataTable columns={columns} data={rows} actionMenu={menuItems} getRowLabel={r => r.name} />
  ),
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Actions for Ada' }));
    const height = (element: Element) => element.getBoundingClientRect().height;
    const move = await body.findByRole('menuitem', { name: 'Move' });
    // Measure the menu before opening the submenu, which hides it from the
    // accessibility tree.
    const items = ['Profile', 'Edit', 'Move'].map(name => body.getByRole('menuitem', { name }));
    const heights = items.map(height);
    const gaps = items.map((item, i) => labelGap(item, ['Profile', 'Edit', 'Move'][i] ?? ''));
    move.focus();
    await userEvent.keyboard('{ArrowRight}');
    const sub = await body.findByRole('menuitem', { name: 'To the top' });
    heights.push(height(sub));
    gaps.push(labelGap(sub, 'To the top'));
    await expect(new Set(heights).size).toBe(1);
    await expect(gaps).toEqual([8, 8, 8, 8]);
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Escape}');
  },
};

// Real-world CSS that targets bare elements, applied to one of two identical
// tables. Each rule is wrapped as `:where(.hostile) :is(...)`, which keeps the
// original element-selector specificity while scoping it to the one copy.
const HOSTILE_CSS: Record<string, string> = {
  allUnset: ':where(.hostile) :is(button) { all: unset; }',
  designSystem:
    ':where(.hostile) :is(button) { background: rgb(0 0 255); color: rgb(255 255 255); border: 2px solid red; padding: 10px; margin: 4px; font: 20px serif; line-height: 2; text-transform: uppercase; letter-spacing: 2px; box-sizing: content-box; }',
  meyer:
    ':where(.hostile) :is(div, span, p, a, table, tbody, thead, tr, th, td, label, button) { margin: 0; padding: 0; border: 0; font-size: 100%; font: inherit; vertical-align: baseline; } :where(.hostile) :is(table) { border-collapse: collapse; border-spacing: 0; } :where(.hostile) :is(button) { all: unset; }',
  normalize:
    ':where(.hostile) :is(button) { font-family: inherit; font-size: 100%; line-height: 1.15; margin: 0; overflow: visible; text-transform: none; -webkit-appearance: button; }',
};

// What to compare on each control: everything the package sets and relies on.
const FINGERPRINT: Record<string, string[]> = {
  '.rdt-checkbox': ['box-sizing', 'width', 'height', 'border-top-width', 'margin-top'],
  '.rdt-pagination--bordered .rdt-pagination__button': [
    'width',
    'height',
    'border-top-width',
    'background-color',
    'color',
    'margin-top',
  ],
  '.rdt-pagination:not(.rdt-pagination--bordered) .rdt-pagination__button': [
    'border-top-width',
    'background-color',
    'color',
  ],
  '.rdt-sort-header__button': [
    'font-size',
    'line-height',
    'padding-left',
    'background-color',
    'border-top-width',
    'text-transform',
    'letter-spacing',
  ],
  '.rdt-action-menu__trigger': [
    'width',
    'height',
    'color',
    'background-color',
    'border-top-width',
    'padding-left',
  ],
  '.rdt-column-panel__trigger': [
    'width',
    'height',
    'color',
    'background-color',
    'border-top-width',
    'padding-left',
  ],
  '.rdt-expand-button': [
    'width',
    'height',
    'color',
    'background-color',
    'border-top-width',
    'padding-left',
  ],
  'tbody .rdt-table__row:first-child .rdt-table__cell:nth-child(3)': [
    'padding-left',
    'padding-top',
    'vertical-align',
  ],
  '.rdt-table__header-cell': ['vertical-align', 'font-weight'],
};

const fingerprint = (root: Element) =>
  Object.fromEntries(
    Object.entries(FINGERPRINT).map(([selector, props]) => {
      const element = root.querySelector(selector);
      const style = element ? getComputedStyle(element) : null;
      return [
        selector,
        style ? props.map(prop => `${prop}: ${style.getPropertyValue(prop)}`) : 'missing',
      ];
    })
  );

const selectionAll = {
  isRowSelected: (row: Row) => row.id === '2',
  onToggleRow: fn(),
  onToggleAll: fn(),
};

const HostileCopy = ({ className }: { className: string }) => (
  <div className={className}>
    <DataTable
      columns={[{ ...columns[0], sortKey: 'name' } as TableColumn<Row>]}
      data={rows}
      sort={{ sortBy: [], onSort: fn() }}
      selection={selectionAll}
      actionMenu={[{ label: 'Edit', onSelect: fn() }]}
      renderExpandedRow={row => <p>Details of {row.name}</p>}
      pagination={paginationProps}
      showPageCount
    />
    <Pagination {...paginationProps} />
  </div>
);

/**
 * Element-selector CSS from resets and design systems can't restyle the
 * package's controls: each computes exactly as in a clean copy. The story
 * loads the unlayered stylesheet while it's mounted, as a consumer would.
 */
export const HostileCss: Story = {
  render: () => (
    <>
      <style>{packageCss}</style>
      <style data-testid="hostile-css" />
      <HostileCopy className="clean" />
      <HostileCopy className="hostile" />
    </>
  ),
  play: async ({ canvasElement }) => {
    const style = canvasElement.querySelector('[data-testid="hostile-css"]') as HTMLStyleElement;
    const clean = canvasElement.querySelector('.clean') as Element;
    const hostile = canvasElement.querySelector('.hostile') as Element;
    try {
      for (const [name, css] of Object.entries(HOSTILE_CSS)) {
        style.textContent = css;
        await expect({ name, ...fingerprint(hostile) }).toEqual({ name, ...fingerprint(clean) });
      }
    } finally {
      style.textContent = '';
    }
  },
};
