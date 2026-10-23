// Components
export { DataTable } from './components/data-table/data-table.tsx';
export { Pagination } from './components/data-table/pagination.tsx';
// Persistence helpers (URL params + localStorage)
export {
  readPersisted,
  readPersistedString,
  writePersisted,
} from './components/data-table/persist.ts';
export {
  type ActionMenuLinkComponent,
  type ActionMenuLinkProps,
  TableActionMenu,
} from './components/data-table/table-action-menu.tsx';
export { TableHeader } from './components/data-table/table-header.tsx';
export { TableLoading } from './components/data-table/table-loading.tsx';
export { TableMenu } from './components/data-table/table-menu.tsx';
export type {
  BaseTableRow,
  SortDirection,
  TableActionMenuItem,
  TableActionMenuSubItem,
  TableColumn,
  TablePagination,
  TableSelection,
  TableSort,
  VisibleColumn,
} from './components/data-table/types.ts';
// Types
export {
  getColumnId,
  reconcileColumnOrder,
} from './components/data-table/types.ts';
export { SortableHeaderClient } from './components/library/sortable-header-client/index.ts';
// Hooks
export { type CursorPaginationInput, useCursorPagination } from './hooks/use-cursor-pagination.ts';
export { usePagination } from './hooks/use-pagination.ts';
export {
  type FilterDef,
  type PersistedFiltersOptions,
  usePersistedFilters,
} from './hooks/use-persisted-filters.ts';
export {
  type RowDragState,
  type UseTableDragSelectionReturn,
  useTableDragSelection,
} from './hooks/use-table-drag-selection.ts';
export {
  type UseTableSelectionOptions,
  useTableSelection,
} from './hooks/use-table-selection.ts';
export { useTableSort } from './hooks/use-table-sort.ts';
// Labels (i18n overrides)
export { type DataTableLabels, defaultLabels } from './labels.ts';
