# Migrating

## 0.4 to 0.5

0.5 is the last round of breaking changes before the API settles. Each entry says what changed and what to do.

### Sort directions are lowercase only

The uppercase `SortOrder` values (`'ASC'`, `'DESC'`) and the `SortOrder` export are gone. Pass `'asc'` or `'desc'`; an uppercase value now counts as no direction. If your API takes an uppercase enum, convert at the call: `direction?.toUpperCase()`.

### `useTableSort` no longer takes `onError`

The hook's sort handler only updates state, which can't throw, so the error callback had nothing to report. Remove the option.

### Action menu items: `callbackAction` is now `onSelect`

Rename `callbackAction` to `onSelect` on action menu items and sub-items. It runs when an item is chosen by pointer or keyboard. Before 0.5, choosing an item with Enter or Space closed the menu without running it.

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
