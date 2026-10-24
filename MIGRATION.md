# Migrating

## 0.4 to 0.5

0.5 is the last round of breaking changes before the API settles. Each entry says what changed and what to do.

### Columns need an `id`

`TableColumn.id` is required, on sub-columns too. Before 0.5, a column without one took an id derived from its header text, so translating or rewording a header changed the id that saved layouts, `onVisibleColumnsChange` and the column panel key off. `getColumnId` is gone with the fallback: read `column.id`.

```diff
- { header: 'Email address', cell: ({ row }) => row.email }
+ { id: 'email', header: 'Email address', cell: ({ row }) => row.email }
```

### `page` and `of` are now `pageOf`

The "Page N of M" indicator is one label, so a language can reorder the phrase and format the numbers.

```diff
- labels={{ page: 'Página', of: 'de' }}
+ labels={{ pageOf: ({ page, pageCount }) => `Página ${page} de ${pageCount}` }}
```

Every other string the table announces is a label too now: `selectAll`, `selectRow`, `rowLabel`, `rowActions`, `columnSettings`, `columnsPanel`, `reorderColumn`, `previousPage` and `nextPage`. Their English defaults are the 0.4 text, except the row menu below.

### Row menus are named after their row

Each row's menu trigger was named "Actions", so a screen reader announced 50 identical buttons. It is now "Actions for ⟨row⟩", from `getRowLabel` or "row ⟨id⟩". Tests that find a trigger by the name "Actions" need the row in it:

```diff
- screen.getAllByRole('button', { name: 'Actions' })[0]
+ screen.getByRole('button', { name: 'Actions for Ada Lovelace' })
```

A `TableActionMenu` used on its own is still named "Actions", or takes `triggerLabel`.

### Sort directions are lowercase only

The uppercase `SortOrder` values (`'ASC'`, `'DESC'`) and the `SortOrder` export are gone. Pass `'asc'` or `'desc'`; an uppercase value now counts as no direction. If your API takes an uppercase enum, convert at the call: `direction?.toUpperCase()`.

### `useTableSort` no longer takes `onError`

The hook's sort handler only updates state, which can't throw, so the error callback had nothing to report. Remove the option.

### Action menu items: `callbackAction` is now `onSelect`

Rename `callbackAction` to `onSelect` on action menu items and sub-items. It runs when an item is chosen by pointer or keyboard. Before 0.5, choosing a plain top-level item (one without `href`) with Enter or Space closed the menu without running it.

Sub-items now take `href`, `icon` and `disabled`, with the same meaning as on items.

A plain item (one without `href`) no longer nests a `<button>` inside the menu item. Its content sits in a `<span>`, and the class `rdt-action-menu__button` is now `rdt-action-menu__content`.

### Column `className` and `rowClassName` are now `headerClassName` and `cellClassName`

A column's `className` styled its header and its `rowClassName` styled its body cells, while the table's own `rowClassName` prop styles each `<tr>`. The column options now say which cell they reach. The table-level `rowClassName` is unchanged.

```diff
- { header: 'Seats', className: 'text-right', rowClassName: 'text-right tabular-nums' }
+ { header: 'Seats', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums' }
```

### Test ids use `data-testid`

`getRowTestId` and the bordered pagination buttons now write `data-testid`, the attribute Testing Library's `getByTestId` and Playwright's `getByTestId` look up by default. Update any selector that reads `data-test-id`.

### Checkboxes lost their fixed ids

The select-all checkbox had `id="select-all"` and each row checkbox `id="select-<row id>"`. Neither was referenced, and both repeated when a page had two tables, so they are gone. Column panel checkboxes used the bare column id, which a page element with the same id could take over. They now get generated ids. Find them by role and name instead:

- select-all: `getByRole('checkbox', { name: 'Select all' })`
- a row: `getByRole('checkbox', { name: 'Select Ada Lovelace' })` with `getRowLabel`, or `'Select row 42'` without
- a column in the panel: `getByRole('checkbox', { name: 'Email' })`

### `PaginationClient` is now `Pagination`, with `onNextPage` and `onPreviousPage`

The component lost its framework-style suffix. The pagination object's `handleNextPage` and `handlePreviousPage` are now `onNextPage` and `onPreviousPage`, both on the `pagination` prop and on `Pagination`. `usePagination`'s `getPagination` returns the new names, so code that passes it straight through needs no change.

### `useTableSelection` returns the `selection` prop

The hook's result now goes straight to the table, with no renaming and no second `isRowDisabled`:

```diff
- const { selection, ...handlers } = useTableSelection(rows, { isRowDisabled });
- <DataTable selection={{ selectedRows: selection, isRowDisabled, ...handlers }} />
+ const selection = useTableSelection(rows, { isRowDisabled });
+ <DataTable selection={selection} />
```

The hook's fields are renamed to match: `selection` is `selectedRows`, `handleSelectRow` is `onToggleRow`, `handleSelectAll` is `onToggleAll`, `handleDeselectAll` is `clearSelection`, and `setSelection` is `setSelectedRows`. `isRowSelected` and `findRowInSelection` are unchanged.

If you build the `selection` prop yourself, `TableSelection` now holds only what the table uses: `isRowSelected`, `isRowDisabled` (optional), `onToggleRow` and `onToggleAll`.

### `BaseTableRow` is just `{ id }`

Rows no longer need to extend `BaseTableRow`: any interface or type with an `id` fits, including types generated from an API schema. The type lost its index signature, so code that read arbitrary fields off an untyped row now gets a type error:

```diff
- const columns: TableColumn[] = [{ header: 'Name', cell: ({ row }) => String(row.name) }];
+ const columns: TableColumn<Member>[] = [{ header: 'Name', cell: ({ row }) => row.name }];
```

Give `TableColumn`, `DataTable` and the hooks your row type and the error goes away. `BaseTableSelection`, which duplicated `BaseTableRow`, is removed.

### Internal pieces are no longer exported

These were exported in 0.4 but only make sense inside `DataTable`, so they are gone from the package root:

- `TableHeader`, `TableLoading`, `TableMenu` and `SortableHeaderClient`
- `useTableDragSelection`, `UseTableDragSelectionReturn` and `RowDragState`
- `readPersisted`, `readPersistedString` and `writePersisted`
- `reconcileColumnOrder`
- `SortOrder` and `BaseTableSelection` (see above)

If you used one of them directly, open an issue describing what for: it may belong in the public API in a form that can be kept stable.

### `--drag-selection` is now `--rdt-drag-selection`

It was the only custom property without the package prefix. Rename it where you set it.
