# Migrating

## 0.4 to 0.5

0.5 is the last round of breaking changes before the API settles. Each entry says what changed and what to do.

### Columns need an `id`

`TableColumn.id` is required, on sub-columns too. Before 0.5, a column without one took an id derived from its header text, so translating or rewording a header changed the id that saved layouts, `onVisibleColumnsChange` and the column panel key off. `getColumnId` is gone with the fallback: read `column.id`. Ids must be unique within a table.

If you stored 0.4 column ids, from `onVisibleColumnsChange` or `onColumnReorder` say, set each `id` to what 0.4 derived to keep them: the header lowercased, with spaces as underscores (`'Email address'` was `email_address`).

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

Every other string the table announces is a label too now: `selectAll`, `selectRow`, `rowLabel`, `rowActions`, `columnSettings`, `columnsPanel`, `reorderColumn`, `previousPage` and `nextPage`. Their English defaults are the 0.4 text, except the row menu below. If you build a whole `DataTableLabels` rather than a `Partial`, spread `defaultLabels` into it or add the new keys.

### Row menus are named after their row

Each row's menu trigger was named "Actions", so a screen reader announced 50 identical buttons. It is now "Actions for ⟨row⟩", from `getRowLabel` or "row ⟨id⟩". Tests that find a trigger by the name "Actions" need the row in it:

```diff
- screen.getAllByRole('button', { name: 'Actions' })[0]
+ screen.getByRole('button', { name: 'Actions for Ada Lovelace' })
```

A `TableActionMenu` used on its own is still named "Actions", or takes `triggerLabel`.

### Sorting takes a list: `sort` is `{ sortBy, onSort }`

`TableSort` was `{ sortKey, direction, handleSort }`, one column at a time. It is now the sorted columns in priority order, and a handler that also says whether the click added a column (Shift+click). `useTableSort` returns exactly that prop, so pass it as it is:

```diff
- const { sort, direction, handleSort } = useTableSort({ defaultSortKey: 'name', defaultSortDirection: 'asc' });
- <DataTable sort={{ sortKey: sort, direction, handleSort }} />
+ const sort = useTableSort({ defaultSortBy: [{ key: 'name', direction: 'asc' }] });
+ <DataTable sort={sort} />
```

- Send `sort.sortBy` with your query: each item is `{ key, direction }`.
- `SortDirection` is `'asc' | 'desc'`. Unsorted is an empty `sortBy`, not a `null` direction.
- `setSortKey` and `setSortDirection` are gone. Use `setSortBy`.
- `reset()` returns to `defaultSortBy` instead of unsorted, and `setSortBy([])` clears.
- To go back to page 1 when the sort changes, pass `onChange`: `useTableSort({ onChange: () => page.reset() })`. It isn't called when a persisted sort is restored, so a restored page survives.

### `usePagination` takes options, and can keep the page in the URL

```diff
- const page = usePagination(25);
+ const page = usePagination({ pageSize: 25 });
```

With `persistKey`, the page is kept in the URL as `{key}.page=3` (1-based, absent on page 1), so a copied link opens on the same page. It is never saved to localStorage. A page past the end, from an old link say, is kept as it is: the table shows its empty state and Previous still works. The hook also returns `isRestored`.

### `usePersistedFilters` returns an object, and its params are namespaced

```diff
- const [filters, setFilter, resetAll, isRestored] = usePersistedFilters('members', defs);
+ const { filters, setFilter, reset, isRestored } = usePersistedFilters('members', defs);
```

Each filter's URL param is now prefixed with the key, `?members.team=Design` rather than `?team=Design`, so two tables' filters can't collide. A filter `param` can't contain `.`. The 0.4 un-prefixed params and `filters:` storage are no longer read. A `deserialize` that throws now gives that filter its default, and the other filters still apply. `isRestored` turns true in the render straight after hydration, or on the first render of a client-only one, rather than after an effect.

### Persistence is namespaced and versioned

- **URL params carry the table's key:** `?members.sort=name,-team&members.page=3&members.team=Design` rather than `?sort=name&dir=asc&team=Design`. Two persisted tables can now share a page, as long as their keys differ.
- **Storage keys are versioned:** `rdt:1:{key}:sort`, `rdt:1:{key}:filters` and `rdt:1:{key}:columns` replace `tablesort:`, `filters:` and `datatable:`.
- **0.4 state is ignored**, not converted or cleaned up: anyone with a saved 0.4 view sees the defaults once.
- **Column layout left the URL.** The `cols` param is gone; visibility and order are saved in localStorage only.
- **A link is the whole view.** If the URL has any of a table's params, they alone set its view, and saved state isn't read.
- **Restored state is written straight back to the URL**, so the address bar gains the table's params on first load.
- **No more hydration warnings.** Server-rendered apps get the defaults on the server and in the hydrating render, then the persisted state. Each hook returns `isRestored`.

Use the same `persistKey` on the table and its hooks.

### `useCursorPagination` returns `variables` and `getPagination`

```diff
- const { pagination, goToNext, goToPrevious, hasPreviousPage, pageIndex } = useCursorPagination(25);
- const { data } = useQuery(QUERY, { variables: { ...pagination } });
- <DataTable pagination={{ totalCount, pageIndex, pageSize: 25, hasNextPage: data.pageInfo.hasNextPage,
-   hasPreviousPage, onNextPage: () => goToNext(data.pageInfo), onPreviousPage: goToPrevious }} />
+ const cursor = useCursorPagination({ pageSize: 25 });
+ const { data } = useQuery(QUERY, { variables: { ...cursor.variables } });
+ <DataTable pagination={cursor.getPagination(data?.pageInfo, data?.totalCount)} />
```

The hook takes an options object like the others. `pagination` is now `variables`, and `getPagination(pageInfo, totalCount?)` builds the table's prop with Next wired to the page info. Pass the page info of the page `variables` asked for; a repeat Next with the same page info, as while the next page loads, is ignored. `goToNext`, `goToPrevious` and `hasPreviousPage` are no longer returned: the prop's handlers cover them.

### `totalCount` is optional, and an empty page reads 0 to 0

`TablePagination.totalCount` may be left out when an API has no total. The footer then shows "Showing 11-20" (the new `showingRange` label), drops "Page N of M" and lets `hasNextPage` drive Next. A standalone `Pagination` takes `pageRowCount` to end the range; `DataTable` passes its row count. A page with no rows reads 0 to 0: an empty table's "Showing 1-0 of 0 results" is now "Showing 0-0 of 0 results", and a page past the end, which read "Showing 91-25 of 25 results", is now "Showing 0-0 of 25 results". A `null` total counts as unknown, like a missing one.

### A settings cell in every row

Without an action menu, a row's last data cell used to span two columns, reaching under the column settings button. Every row now has its own empty cell there instead (`rdt-table__cell--settings`, sticky like the header above it), and the empty, loading and expanded rows count it. If your CSS targeted that spanning last cell, target the settings cell or the last data column instead. With an action menu and `hideTableSettings`, the header row gains an empty cell over the row menus (`rdt-table__header-cell--actions`), so it has as many cells as the rows below.

### Row clicks ignore controls inside the row

`onRowClick` and `selectOnRowClick` used to fire for any click in a row, including the row's own checkbox, a link or a button in a cell. They now skip clicks that start on a link, button, form control, label, `[role=button]`, `[role=checkbox]`, `[role=menuitem]` or editable content inside the row, and clicks that bubble up from a portal opened in a cell, such as a popover. If you called `stopPropagation` in your cells to get this, you can drop it.

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
+ { id: 'seats', header: 'Seats', headerClassName: 'text-right', cellClassName: 'text-right tabular-nums' }
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
+ const columns: TableColumn<Member>[] = [{ id: 'name', header: 'Name', cell: ({ row }) => row.name }];
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
