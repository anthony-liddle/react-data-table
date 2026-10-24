// The public API. Everything exported here is a promise to keep; the scripts/smoke.mjs
// export list must match it.

// Components
export { DataTable } from './components/data-table/data-table.tsx';
export { Pagination } from './components/data-table/pagination.tsx';
export {
  type ActionMenuLinkComponent,
  type ActionMenuLinkProps,
  TableActionMenu,
} from './components/data-table/table-action-menu.tsx';
// Types
export type {
  BaseTableRow,
  SortDirection,
  SortItem,
  TableActionMenuItem,
  TableActionMenuSubItem,
  TableColumn,
  TablePagination,
  TableSelection,
  TableSort,
  VisibleColumn,
} from './components/data-table/types.ts';
// Hooks
export {
  type CursorPaginationInput,
  type UseCursorPaginationOptions,
  useCursorPagination,
} from './hooks/use-cursor-pagination.ts';
export { type UsePaginationOptions, usePagination } from './hooks/use-pagination.ts';
export {
  type FilterDef,
  type PersistedFiltersOptions,
  usePersistedFilters,
} from './hooks/use-persisted-filters.ts';
export {
  type UseTableSelectionOptions,
  useTableSelection,
} from './hooks/use-table-selection.ts';
export { type UseTableSortOptions, useTableSort } from './hooks/use-table-sort.ts';
// Labels (i18n overrides)
export { type DataTableLabels, defaultLabels } from './labels.ts';
