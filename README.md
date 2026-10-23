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

- **Sorting**: one column at a time, cycling ascending → descending → off. Sort headers are keyboard-operable buttons and report `aria-sort`.
- **Grouped columns**: parent headers spanning sub-columns, with a two-row header.
- **Row selection**: checkboxes, select-all, optional click-anywhere-on-the-row, and rows that can't be selected.
- **Drag selection**: press on a row and drag to select a range.
- **Column management**: show, hide, and reorder columns from a header panel, by mouse or keyboard.
- **Pagination**: a footer with range text and an optional "Page N of M", plus a cursor-pagination hook.
- **Persistence**: column layout, sort, and filters written to the URL (shareable) and to localStorage (survives reloads).
- Also: row action menus with submenus, loading skeletons, expandable rows, and overridable labels.

ESM only, strict TypeScript, React 18 or 19.

## Setup

The table is styled with Tailwind CSS v4 utility classes plus a small stylesheet of semantic table rules. Both need wiring up.

1. Import the stylesheet once, for example in your root layout:

   ```tsx
   import '@anthony-liddle/react-data-table/styles.css';
   ```

2. Let Tailwind see the package's class names. Add this to your CSS entry, adjusting the relative path:

   ```css
   @source "../node_modules/@anthony-liddle/react-data-table/dist";
   ```

Colours come from shadcn-style HSL tokens (`--card`, `--border`, `--accent`, `--muted-foreground`, `--drag-selection`, and so on). The stylesheet ships light and `.dark` defaults at zero specificity, so a shadcn/ui theme you already have wins automatically. For a complete reference setup, including the `@theme inline` token mapping, see [`.storybook/preview.css`](./.storybook/preview.css).

## Quick start

```tsx
import { DataTable, type BaseTableRow, type TableColumn } from '@anthony-liddle/react-data-table';

interface Member extends BaseTableRow {
  id: string;
  name: string;
  email: string;
  team: string;
}

const columns: TableColumn<Member>[] = [
  { header: 'Name', sortKey: 'name', cell: ({ row }) => row.name },
  { header: 'Email', cell: ({ row }) => row.email },
  { header: 'Team', sortKey: 'team', cell: ({ row }) => row.team, hideByDefault: true },
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
| `sort` | `{ sortKey, direction, handleSort }` | – | Sort state and handler. `useTableSort` returns these. |
| `selection` | `TableSelection<T>` | – | Selection state and handlers (`useTableSelection`). Enables checkboxes and drag selection. |
| `selectOnRowClick` | `boolean` | `false` | A click anywhere on a row toggles it |
| `pagination` | `TablePagination` | – | Renders the pagination footer |
| `showPageCount` | `boolean` | `false` | Adds "Page N of M" and bordered controls to the footer |
| `actionMenu` | `TableActionMenuItem<T>[]` | – | Per-row menu: links, callbacks, one level of submenus, per-row `hidden` / `disabled` |
| `persistKey` | `string` | – | Persists column visibility and order (see [Persistence](#persistence)) |
| `hideTableSettings` | `boolean` | `false` | Hides the column settings panel |
| `onColumnReorder` | `(order: string[]) => void` | – | Called with the new column id order |
| `onVisibleColumnsChange` | `(columns: VisibleColumn[]) => void` | – | Called when a column is shown or hidden |
| `loading` | `boolean` | `false` | Shows skeleton rows and sets `aria-busy` |
| `maxLoadingRows` | `number` | `10` | Skeleton row count |
| `onRowClick` | `(row: T) => void` | – | Row click callback |
| `renderExpandedRow` | `(row: T) => ReactNode \| null` | – | A full-width row under each row that returns non-null. Expansion state is yours. |
| `rowClassName` | `(row: T) => string` | – | Extra classes per `<tr>` |
| `getRowTestId` | `(row: T) => string \| undefined` | – | Per-row `data-test-id` for end-to-end tests |
| `getRowLabel` | `(row: T) => string` | – | Names each row's selection checkbox "Select ⟨label⟩" for assistive technology. Without it, the name falls back to "Select row ⟨id⟩". |
| `labels` | `Partial<DataTableLabels>` | English | Overrides the visible strings (empty state, page count, range text) |
| `linkComponent` | `ComponentType \| 'a'` | `'a'` | Renders `href` menu items, for example a router's `Link` |

### Columns

```ts
interface TableColumn<T> {
  header: string;            // header text; also the default column id
  id?: string;               // stable id when headers repeat or change
  sortKey?: string;          // makes the column sortable
  cell?: ({ row }) => ReactNode;
  loadingCell?: () => ReactNode;
  headerIcon?: ReactNode;
  className?: string;        // header cell classes
  rowClassName?: string;     // body cell classes
  subColumns?: TableColumn<T>[]; // makes this a grouped parent column
  hideByDefault?: boolean;   // starts hidden; can be shown from the panel
  alwaysVisible?: boolean;   // cannot be hidden (see Known issues)
}
```

## Hooks

| Hook | Returns | Use |
|---|---|---|
| `useTableSort({ sortableColumns, defaultSortKey, defaultSortDirection, persistKey })` | `{ sort, direction, handleSort, reset, … }` | Pass to the `sort` prop; feed `sort` / `direction` into your query |
| `useTableSelection(rows, { isRowDisabled })` | `{ selection, handleSelectRow, handleSelectAll, … }` | Spread into the `selection` prop |
| `usePagination(pageSize)` | `{ pagination: { first, after }, pageIndex, goToNext, goToPrevious, … }` | Cursor pagination: pass `pagination` to a connection query |
| `usePersistedFilters(key, filterDefs, { persistToStorage })` | `[filters, setFilter, resetAll, isRestored]` | Any filter state, persisted like the table |

`SortOrder` (`'ASC'` / `'DESC'`) and lowercase `'asc'` / `'desc'` are accepted everywhere a direction is.

## Persistence

With `persistKey` set, state is read from the URL first, then localStorage, and every change is written to both:

| State | URL param | localStorage key |
|---|---|---|
| Column visibility and order | `cols` | `datatable:{persistKey}` |
| Sort (`useTableSort`) | `sort`, `dir` | `tablesort:{persistKey}:key`, `…:dir` |
| Filters (`usePersistedFilters`) | one param per filter | `filters:{persistKey}` |

The URL params are not namespaced, so use one persisted table per page. A persisted sort key is honoured only if it is in `sortableColumns`, so another table's `?sort=` can't leak in. A saved column order is dropped when the column set changes in code.

## Accessibility

On every PR, each story is rendered in headless Chromium and checked with axe (`@storybook/addon-a11y`).

- Sort headers are buttons, and the sorted column's header carries `aria-sort`.
- Header cells use `scope="col"`, and grouped parent headers use `scope="colgroup"`.
- Checkboxes, pagination buttons ("Previous page" / "Next page"), the column settings trigger, and column drag handles ("Reorder ⟨column⟩") all have accessible names.
- Row checkboxes are named "Select ⟨label⟩" when you pass `getRowLabel` (for example the row's name). Without it they fall back to "Select row ⟨id⟩", so pass it whenever rows have a human-readable name.
- The column settings panel is a dialog: Tab reaches every checkbox and handle, Space toggles a column, and a focused handle reorders with Space, the arrow keys, and Space.
- Row menus are Radix dropdown menus with arrow-key navigation.

Known gaps:

- Drag selection and click-to-select rows are mouse-only; the checkboxes are the keyboard path.
- `onRowClick` (and so row expansion) has no keyboard path of its own. Put a button in a cell if you need one.
- Accessible names are English-only; the `labels` prop covers visible text.

## Known issues

- **`alwaysVisible`.** With a single header row, the pinned column still appears in the column panel with a checkbox that does nothing. With grouped columns it is left out, but then reordering has no visible effect.
- **Multi-column sort.** Not supported; `sort` holds one key.

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
