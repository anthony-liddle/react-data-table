import type { SortDirection } from './components/data-table/types.ts';

/**
 * Every string the table renders or announces. The package ships English
 * defaults and lets consumers override any of them (or wire them into their
 * own i18n layer) via the `labels` prop on `DataTable` / `Pagination`.
 */
export interface DataTableLabels {
  /** Empty-state message shown when the table has no rows. */
  noResults: string;
  /** Range summary in the pagination footer, e.g. "Showing 1-10 of 42 results". */
  showingRangeOf: (params: { start: number; end: number; total: number }) => string;
  /** Range summary when the total is unknown, e.g. "Showing 1-10". */
  showingRange: (params: { start: number; end: number }) => string;
  /** Name of the select-all checkbox. */
  selectAll: string;
  /** Name of a row's checkbox. */
  selectRow: (params: { rowLabel: string }) => string;
  /** Names a row when `getRowLabel` isn't set. */
  rowLabel: (params: { id: string | number }) => string;
  /** Name of a row's action menu trigger. */
  rowActions: (params: { rowLabel: string }) => string;
  /** Name of the column settings button. */
  columnSettings: string;
  /** Name of the column settings panel. */
  columnsPanel: string;
  /** Name of a column's drag handle in the panel. */
  reorderColumn: (params: { column: string }) => string;
  /** Name of the previous page button. */
  previousPage: string;
  /** Name of the next page button. */
  nextPage: string;
  /** The "Page N of M" indicator (shown with `showPageCount`). */
  pageOf: (params: { page: number; pageCount: number }) => string;
  /** Read after a sorted column's name while two or more columns are sorted. */
  sortPriority: (params: { priority: number; direction: SortDirection }) => string;
}

export const defaultLabels: DataTableLabels = {
  noResults: 'No results found',
  showingRangeOf: ({ start, end, total }) => `Showing ${start}-${end} of ${total} results`,
  showingRange: ({ start, end }) => `Showing ${start}-${end}`,
  selectAll: 'Select all',
  selectRow: ({ rowLabel }) => `Select ${rowLabel}`,
  rowLabel: ({ id }) => `row ${id}`,
  rowActions: ({ rowLabel }) => `Actions for ${rowLabel}`,
  columnSettings: 'Column settings',
  columnsPanel: 'Columns',
  reorderColumn: ({ column }) => `Reorder ${column}`,
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageOf: ({ page, pageCount }) => `Page ${page} of ${pageCount}`,
  sortPriority: ({ priority, direction }) =>
    `sort priority ${priority}, ${direction === 'asc' ? 'ascending' : 'descending'}`,
};

// A key set to undefined (a locale map with gaps, say) keeps its default
// rather than replacing a function the table calls.
export const resolveLabels = (labels?: Partial<DataTableLabels>): DataTableLabels => ({
  ...defaultLabels,
  ...Object.fromEntries(Object.entries(labels ?? {}).filter(([, value]) => value !== undefined)),
});
