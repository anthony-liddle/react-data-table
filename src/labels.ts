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
}

export const defaultLabels: DataTableLabels = {
  noResults: 'No results found',
  showingRangeOf: ({ start, end, total }) => `Showing ${start}-${end} of ${total} results`,
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
};

export const resolveLabels = (labels?: Partial<DataTableLabels>): DataTableLabels => ({
  ...defaultLabels,
  ...labels,
});
