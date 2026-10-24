# react-data-table

[![npm](https://img.shields.io/npm/v/@anthony-liddle/react-data-table.svg)](https://www.npmjs.com/package/@anthony-liddle/react-data-table)
[![CI](https://github.com/anthony-liddle/react-data-table/actions/workflows/test.yml/badge.svg)](https://github.com/anthony-liddle/react-data-table/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)

**Storybook: [anthony-liddle.github.io/react-data-table](https://anthony-liddle.github.io/react-data-table/)**. Every feature is an interactive demo there.

```bash
npm install @anthony-liddle/react-data-table
```

A data-dense React table for admin and reporting screens. It was extracted from a production app and published as a standalone package.

## Features

- **Sorting**: click a header to cycle ascending → descending → off, and opt in to multi-column sort with Shift+click or Shift+Enter. Sort headers are keyboard-operable buttons and report `aria-sort`.
- **Grouped columns**: parent headers spanning sub-columns, with a two-row header.
- **Row selection**: checkboxes, select-all, optional click-anywhere-on-the-row, and rows that can't be selected.
- **Drag selection**: press on a row and drag to select a range.
- **Column management**: show, hide, and reorder columns from a header panel, by mouse or keyboard.
- **Pagination**: a footer with range text and an optional "Page N of M", plus hooks for offset and cursor APIs.
- **Persistence**: column layout, sort, and filters written to the URL (shareable) and to localStorage (survives reloads).
- Also: row action menus with submenus, loading skeletons, expandable rows, and overridable labels.

ESM only, strict TypeScript, React 18 or 19. No Tailwind required: the package ships its own CSS.

Upgrading from an earlier version? [MIGRATION.md](https://github.com/anthony-liddle/react-data-table/blob/main/MIGRATION.md) lists every breaking change and what to do.

## Setup

Import the stylesheet once, for example in your root layout:

```tsx
import '@anthony-liddle/react-data-table/styles.css';
```

That is the whole setup. The table needs no Tailwind and no build step of its own.

**Using Tailwind, or any cascade layers of your own?** Import the layered copy instead, from your CSS entry, after a line that orders the layers. Between Tailwind's `base` and `utilities`, preflight leaves the table alone and a utility you pass through `className` wins:

```css
@layer theme, base, react-data-table, components, utilities;
@import "tailwindcss";
@import "@anthony-liddle/react-data-table/styles.layer.css";
```

Import it here rather than from JavaScript, so the order line always comes first. A layer used before it is ordered goes to the bottom, under Tailwind's preflight, and the table loses its padding and borders. With the unlayered `styles.css`, Tailwind's utilities (which sit in a layer) can't override the table, so the layered copy is the one to use with Tailwind.

`styles.layer.css` is the same rules as `styles.css` inside `@layer react-data-table`. See [Styling](#styling) for theming and overrides.

## Quick start

```tsx
import { DataTable, type TableColumn } from '@anthony-liddle/react-data-table';

interface Member {
  id: string;
  name: string;
  email: string;
  team: string;
}

const columns: TableColumn<Member>[] = [
  { id: 'name', header: 'Name', sortKey: 'name', cell: ({ row }) => row.name },
  { id: 'email', header: 'Email', cell: ({ row }) => row.email },
  { id: 'team', header: 'Team', sortKey: 'team', cell: ({ row }) => row.team, hideByDefault: true },
];

export function Members({ members }: { members: Member[] }) {
  return <DataTable columns={columns} data={members} persistKey="members" />;
}
```

The table is controlled. You own the data, the sort, the selection, and the page, and the hooks below manage the usual cases. See the [Features stories](https://anthony-liddle.github.io/react-data-table/) for each one wired up end to end.

## `DataTable` props

| Prop | Type | Default | |
|---|---|---|---|
| `columns` | `TableColumn<T>[]` | required | Column definitions (see below) |
| `data` | `T[]` | required | Rows. Each needs a unique `id`. |
| `sort` | `TableSort` | – | `{ sortBy, onSort }`: the sorted columns in priority order, and the header click handler. `useTableSort` returns it. |
| `selection` | `TableSelection<T>` | – | Selection state and handlers; `useTableSelection` returns it. Enables checkboxes and drag selection. |
| `selectOnRowClick` | `boolean` | `false` | A click on a row toggles it, except on the controls inside it (see `onRowClick`) |
| `pagination` | `TablePagination` | – | Renders the pagination footer |
| `showPageCount` | `boolean` | `false` | Adds "Page N of M" and bordered controls to the footer |
| `actionMenu` | `TableActionMenuItem<T>[]` | – | Per-row menu: links, callbacks, one level of submenus, per-row `hidden` / `disabled` |
| `persistKey` | `string` | – | Saves column visibility and order in localStorage; give the hooks the same key (see [Persistence](#persistence)) |
| `hideTableSettings` | `boolean` | `false` | Hides the column settings panel |
| `onColumnReorder` | `(order: string[]) => void` | – | Called with the new column id order |
| `onVisibleColumnsChange` | `(columns: VisibleColumn[]) => void` | – | Called when a column is shown or hidden |
| `loading` | `boolean` | `false` | Shows skeleton rows and sets `aria-busy` |
| `maxLoadingRows` | `number` | `10` | Skeleton row count |
| `onRowClick` | `(row: T) => void` | – | Row click callback. Clicks on a control inside the row (a link, button, form control, label, `[role=button]`, `[role=checkbox]`, `[role=menuitem]` or editable content), or from a portal opened in a cell, don't count |
| `renderExpandedRow` | `(row: T) => ReactNode` | – | Content of a row's expanded panel, a full-width row beneath it. Adds a leading column with an expand button per row. Called only for expanded rows |
| `expansion` | `TableExpansion<T>` | – | Which rows are expanded; `useTableExpansion` returns it. Without it the table keeps that state itself |
| `expandOnRowClick` | `boolean` | `false` | A click on a row toggles its panel, except on the controls inside it |
| `rowClassName` | `(row: T) => string` | – | Extra classes per `<tr>` |
| `getRowTestId` | `(row: T) => string \| undefined` | – | Per-row `data-testid` for end-to-end tests |
| `getRowLabel` | `(row: T) => string` | – | Names each row for assistive technology: its checkbox is "Select ⟨label⟩" and its menu "Actions for ⟨label⟩". Without it, rows are named by `labels.rowLabel`, "row ⟨id⟩". |
| `labels` | `Partial<DataTableLabels>` | English | Overrides any string the table renders or announces (see [Labels](#labels)) |
| `linkComponent` | `ComponentType \| 'a'` | `'a'` | Renders `href` menu items, for example a router's `Link`. It must spread the props it doesn't use onto the anchor and forward its ref, which the menu needs for keyboard focus |

### Columns

```ts
interface TableColumn<T> {
  id: string;                // required, unique in the table, and stable across header text and translations
  header: string;            // header text
  sortKey?: string;          // makes the column sortable
  cell?: ({ row }) => ReactNode;
  loadingCell?: () => ReactNode;
  headerIcon?: ReactNode;
  headerClassName?: string;  // header cell classes
  cellClassName?: string;    // body cell classes
  subColumns?: TableColumn<T>[]; // makes this a grouped parent column
  hideByDefault?: boolean;   // starts hidden; can be shown from the panel
  alwaysVisible?: boolean;   // cannot be hidden (see Known issues)
}
```

## Hooks

| Hook | Returns | Use |
|---|---|---|
| `useTableSort({ sortableColumns, defaultSortBy, multiSort, persistKey, onChange })` | `{ sortBy, onSort, setSortBy, reset, isRestored }` | Pass it to the `sort` prop as it is; send `sortBy` with your query |
| `useTableSelection(rows, { isRowDisabled })` | `{ selectedRows, onToggleRow, onToggleAll, clearSelection, … }` | Pass it to the `selection` prop as it is |
| `useTableExpansion({ isRowExpandable, initialExpandedIds })` | `{ isRowExpanded, onToggleRow, expandedIds, setExpandedIds, collapseAll, … }` | Pass it to the `expansion` prop as it is, to keep rows open across a refetch or open one from outside |
| `usePagination({ pageSize, persistKey })` | `{ offset, limit, pageIndex, getPagination, reset, isRestored, … }` | Offset or page-number APIs and arrays: send `offset` / `limit`, pass `getPagination(totalCount)` to the `pagination` prop |
| `useCursorPagination({ pageSize })` | `{ variables, pageIndex, getPagination, reset }` | GraphQL connections: send `variables` (`{ first, after }`) with the query, pass `getPagination(pageInfo, totalCount?)` to the `pagination` prop, with the page info of the page `variables` asked for |
| `usePersistedFilters(key, filterDefs, { persistToStorage })` | `{ filters, setFilter, reset, isRestored }` | Any filter state, persisted like the table |

`sortBy` lists the sorted columns in priority order, each `{ key, direction }` with a lowercase `'asc'` or `'desc'`; unsorted is an empty list. If your API wants an uppercase enum, convert at the call. `reset()` returns to `defaultSortBy`, and `setSortBy([])` clears the sort.

With `multiSort: true`, Shift+click on a header (or Shift+Enter or Shift+Space on a focused one) adds that column as the next sort key, then flips it, then removes it, leaving the others in place. A plain click still makes the column the only sort. Each sorted column shows a small number with its place while two or more are sorted. Turn it on only when your API can sort by several fields.

`usePagination` hands back the `offset` and `limit` for the current page. The total row count usually arrives with that page, so the table's `pagination` prop is built from it at render time:

```tsx
const { offset, limit, getPagination, reset } = usePagination({ pageSize: 25 });
const { items, total } = useMembers({ offset, limit }); // your fetch, or rows.slice(offset, offset + limit)

<DataTable columns={columns} data={items} pagination={getPagination(total)} />;
```

Call `reset()` when the sort or filters change, so the table goes back to the first page. `useTableSort`'s `onChange` runs on every sort change except restoring a persisted one, so it's the place for that: `useTableSort({ onChange: () => reset() })`.

`TablePagination.totalCount` is optional, since cursor APIs often have no total. Without it the footer reads "Showing 11-20", ending at the page's row count (`DataTable` supplies it; a standalone `Pagination` takes `pageRowCount`), it drops "Page N of M", and Next follows `hasNextPage`. A page with no rows reads "Showing 0-0".

## Labels

Every string the table renders or announces comes from `labels`, so a translation covers screen reader names too. Pass any subset to `DataTable` or `Pagination`; the rest keep their English defaults, which `defaultLabels` exports.

| Key | Default |
|---|---|
| `noResults` | No results found |
| `showingRangeOf({ start, end, total })` | Showing {start}-{end} of {total} results |
| `selectAll` | Select all |
| `selectRow({ rowLabel })` | Select {rowLabel} |
| `rowLabel({ id })` | row {id} (used when `getRowLabel` isn't set) |
| `rowActions({ rowLabel })` | Actions for {rowLabel} |
| `columnSettings` | Column settings |
| `columnsPanel` | Columns |
| `reorderColumn({ column })` | Reorder {column} |
| `previousPage` / `nextPage` | Previous page / Next page |
| `showingRange({ start, end })` | Showing {start}-{end} (when the total is unknown) |
| `pageOf({ page, pageCount })` | Page {page} of {pageCount} |
| `expandColumn` | Details (the expand column's hidden header text) |
| `expandRow({ rowLabel })` | Details for {rowLabel} |
| `sortPriority({ priority, direction })` | sort priority {priority}, ascending / descending |

A standalone `TableActionMenu` names its trigger "Actions", or `triggerLabel`.

## Persistence

Give the table and its hooks the same `persistKey`. What is worth sharing goes in the URL, and the column layout stays in the browser:

| State | Owner | URL | localStorage |
|---|---|---|---|
| Sort | `useTableSort` | `{key}.sort=name,-team` | `rdt:1:{key}:sort` |
| Page | `usePagination` | `{key}.page=3` | none |
| Filters | `usePersistedFilters` | `{key}.{param}=…` | `rdt:1:{key}:filters` |
| Column visibility and order | `DataTable` | none | `rdt:1:{key}:columns` |

- **A link is the whole view.** When a page opens with params in a table's namespace that it didn't write itself, those params alone set the view: a state the link leaves out takes its default, and saved state isn't read. Otherwise each state reads its own param, then localStorage, then its default. The column layout is never part of a link, so it always comes from localStorage.
- **The URL shows the current view.** Once restored, and on every change, state is written back with `history.replaceState`, keeping your other params, the hash and `history.state`. The sort is always written, as `{key}.sort=` when unsorted, so the address bar gains the table's params on first load.
- **Readable, checked one param at a time.** A sort is a comma list in priority order, `-` marking descending, and the page is 1-based and absent on page 1. A param that doesn't parse, or a sort naming a column outside `sortableColumns`, takes its default while the others still apply. A page past the end is kept: the table shows its empty state and Previous still works. Storage keys carry a format version (`rdt:1:`), so a later format ignores old entries.
- **Names.** Sort keys can't contain commas or start with `-`, and filter `param` names can't contain `.`. Give each table on a page its own key, and use one `usePersistedFilters` per key.
- **Pass `sortableColumns` with a `persistKey`.** A link can name any sort key, and without the list it goes straight into your query; with it, an unknown key falls back to the default.
- **Server rendering.** The server render, and the client render that hydrates it, use the defaults, so persisted state never causes a hydration mismatch; it arrives in the render straight after. A client-only render starts from it. Each hook returns `isRestored`, false only during those first renders, so you can hold a fetch until the persisted state is in.

## Styling

Every element the table renders has a documented class, and runtime state lives on attributes, so you restyle it with ordinary CSS. Each base rule in `styles.css` is a single class, and a modifier or state adds at most one more class, attribute or pseudo-class. So one class of yours, loaded after the stylesheet, overrides a base style, and the same class with the same state overrides a stateful one. Nothing uses `!important`, and the stylesheet resets only its own elements, never your markup inside a cell.

### Theme

Colours come from shadcn-style tokens, read as full colour values: `--background`, `--foreground`, `--card`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border` and `--ring`. The package never declares them. It reads each one with a built-in default, so a theme you declare anywhere wins, even inside a cascade layer, and `.dark` on any ancestor switches the defaults. A current shadcn/ui theme applies as it is.

Older shadcn themes wrote bare HSL triplets (`--card: 0 0% 100%`) and read them as `hsl(var(--card))`. To use one here, change both together: write each value as a full colour (`--card: hsl(0 0% 100%)`), and read it as `var(--card)` everywhere in your own CSS, including a Tailwind `@theme` mapping. Changing only the values gives `hsl(hsl(...))`, which is invalid.

### Custom properties

Set these on `:root`, on any ancestor of the table, or on a single row through `rowClassName`.

| Property | Default | |
|---|---|---|
| `--rdt-radius` | `0.5rem` | Corner radius of the table container |
| `--rdt-font-size` | `0.875rem` | Body text |
| `--rdt-header-font-size` | `0.75rem` | Header text |
| `--rdt-cell-padding-x` | `0.75rem` | Horizontal cell padding |
| `--rdt-cell-padding-y` | `0.5rem` | Vertical cell padding |
| `--rdt-row-selected` | unset | Background tint for selected rows. Selected rows always show a 3px bar in `--primary` on their first cell; the tint is extra. Keep your cell text readable against it: with shadcn's default muted text, a light tint has to stay very pale to reach 4.5:1. |
| `--rdt-skeleton` | stone, light and dark | Loading placeholders |
| `--rdt-drag-selection` | `hsl(216 100% 58.4%)` | The bar beside rows in a drag range |

### Classes and state

| Block | Elements and modifiers | State |
|---|---|---|
| `rdt-table` | `__scroll`, `__table`, `__head`, `__header-row`, `__header-cell` (`--group`, `--expand`, `--select`, `--settings`, `--actions`, `--sticky`), `__header-label`, `__select-all`, `__body`, `__row` (`--clickable`), `__cell` (`--expand`, `--select`, `--actions`, `--settings`, `--sticky`), `__empty-row`, `__empty`, `__expanded-row`, `__expanded-cell` | `aria-busy` and `data-dragging` on `__table`; `data-selected`, `data-drag-range`, `data-drag-start` and `data-drag-end` on `__row` |
| `rdt-sort-header` (`--sticky`) | `__button` (spans the cell), `__content` (follows the header's `text-align`), `__label`, `__icon`, `__arrow`, `__priority` (a sorted column's place, while two or more are sorted) | `aria-sort` on the header; `data-direction="asc"` or `"desc"` on `__icon` |
| `rdt-checkbox` | `__indicator`, `__icon` | `data-state`, `data-disabled` |
| `rdt-column-panel` | `__trigger`, `__trigger-icon`, `__list`, `__item`, `__label`, `__handle`, `__handle-icon` | `data-dragging` on `__item` |
| `rdt-menu` (`--sub`) | `__item`, `__sub-trigger`, `__chevron` | `data-highlighted`, `data-disabled`, `data-state` |
| `rdt-action-menu` | `__trigger`, `__trigger-icon`, `__link`, `__content`, `__icon` (`--link`) | |
| `rdt-pagination` (`--bordered`) | `__range`, `__controls`, `__page-count`, `__button`, `__icon` | |
| `rdt-button` (`--ghost`, `--outline`) | | `:disabled` |
| `rdt-skeleton` (`--select`, `--action`, `--cell`) | | |
| `rdt-expand-button` | `__icon` (the chevron, turned while open) | `aria-expanded` |
| `rdt-visually-hidden` | | Text for screen readers only |

Inside `DataTable`, a sortable header is both `rdt-table__header-cell` and `rdt-sort-header`. The column panel and the row menus render in a portal at the end of `<body>`, so style them by their own classes, not through `.rdt-table`.

### Example

```css
/* Denser rows and square corners for every table on the page */
:root {
  --rdt-cell-padding-y: 0.25rem;
  --rdt-radius: 0;
}

/* Tint selected rows as well, in both themes. These keep shadcn's
   default muted text at 4.5:1. */
:root {
  --rdt-row-selected: oklch(0.985 0.012 250);
}

.dark {
  --rdt-row-selected: oklch(0.26 0.03 255);
}

/* Bold the sorted column's header */
.rdt-table__header-cell[aria-sort] {
  font-weight: 600;
}
```

## Accessibility

On every PR, each story is rendered in headless Chromium and checked with axe (`@storybook/addon-a11y`).

- Expandable rows have a real button, named "Details for ⟨label⟩", with `aria-expanded` and, while open, `aria-controls` pointing at the panel.
- Sort headers are buttons. The primary sorted column carries `aria-sort`; while two or more columns are sorted, each sorted header also announces its place and direction ("sort priority 2, descending").
- Header cells use `scope="col"`, and grouped parent headers use `scope="colgroup"`.
- Checkboxes, pagination buttons ("Previous page" / "Next page"), the column settings trigger, and column drag handles ("Reorder ⟨column⟩") all have accessible names.
- Row checkboxes and row menus are named after their row ("Select ⟨label⟩", "Actions for ⟨label⟩") when you pass `getRowLabel`, for example the row's name. Without it they fall back to "row ⟨id⟩", so pass it whenever rows have a human-readable name.
- The column settings panel is a dialog: Tab reaches every checkbox and handle, Space toggles a column, and a focused handle reorders with Space, the arrow keys, and Space.
- Row menus are Radix dropdown menus with arrow-key navigation.

Known gaps:

- Drag selection and click-to-select rows are mouse-only; the checkboxes are the keyboard path.
- `onRowClick` has no keyboard path of its own. Put a button in a cell if you need one. (Row expansion has its own button.)

## Known issues

- **`alwaysVisible`.** With a single header row, the pinned column still appears in the column panel with a checkbox that does nothing. With grouped columns it is left out, but then reordering has no visible effect.

## Development

```bash
pnpm install
pnpm storybook        # http://localhost:6006
pnpm test             # unit tests (Vitest + happy-dom)
pnpm test:storybook   # every story in Chromium: play functions + axe
pnpm lint             # Biome
pnpm typecheck
pnpm build            # dist/
pnpm lint:package     # publint + are-the-types-wrong
pnpm smoke            # install the packed tarball and use it
```

`pnpm test:storybook` needs Chromium once: `pnpm exec playwright install chromium`.

Releases publish from CI when a GitHub Release is published, via npm trusted publishing with provenance. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Anthony Liddle
