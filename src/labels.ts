/**
 * User-facing strings rendered by the table. The package ships English
 * defaults and lets consumers override any of them (or wire them into their
 * own i18n layer) via the `labels` prop on `DataTable` / `PaginationClient`.
 */
export interface DataTableLabels {
  /** Empty-state message shown when the table has no rows. */
  noResults: string;
  /** "Page" in the "Page N of M" indicator (shown with `showPageCount`). */
  page: string;
  /** "of" in the "Page N of M" indicator (shown with `showPageCount`). */
  of: string;
  /** Range summary in the pagination footer, e.g. "Showing 1-10 of 42 results". */
  showingRangeOf: (params: { start: number; end: number; total: number }) => string;
}

export const defaultLabels: DataTableLabels = {
  noResults: 'No results found',
  page: 'Page',
  of: 'of',
  showingRangeOf: ({ start, end, total }) => `Showing ${start}-${end} of ${total} results`,
};

export const resolveLabels = (labels?: Partial<DataTableLabels>): DataTableLabels => ({
  ...defaultLabels,
  ...labels,
});
