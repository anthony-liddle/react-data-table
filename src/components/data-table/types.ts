import type { ReactNode } from 'react';

import { stringToKey } from '../../helpers/strings.ts';
import type { SortDirection } from '../library/sortable-header-client/index.ts';

// Re-export SortDirection for consistent usage
export type { SortDirection };

/**
 * Uppercase sort direction, mirroring the shape of a GraphQL SortDirection
 * enum. Everywhere a direction is accepted, both this and the lowercase
 * client-side `SortDirection` ('asc' | 'desc') are tolerated.
 */
export const SortOrder = {
  Asc: 'ASC',
  Desc: 'DESC',
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

// Base interface that all table data must have
export interface BaseTableRow {
  id: string | number;
  [key: string]: unknown;
}

export interface TableColumn<TData extends BaseTableRow = BaseTableRow> {
  /** Optional stable identifier for the column. When omitted, the column key is derived from the header text. Set this when multiple columns can share the same header. */
  id?: string;
  header: string;
  headerIcon?: React.ReactNode;
  sortKey?: string;
  cell?: (params: { row: TData }) => React.ReactNode;
  loadingCell?: () => React.ReactNode;
  className?: string;
  rowClassName?: string;
  subColumns?: TableColumn<TData>[];
  hideByDefault?: boolean;
  alwaysVisible?: boolean;
}

/** Return a stable column identifier: explicit `id` if set, otherwise derived from the header text. */
export const getColumnId = <TData extends BaseTableRow>(col: TableColumn<TData>): string =>
  col.id ?? stringToKey(col.header);

/**
 * Reconcile a persisted column order against the current set of column IDs.
 *
 * A persisted order can go stale when the table's columns change in code
 * (added, removed, or renamed, and header-derived IDs change with the header).
 * Naively rendering by the stale order strands any column missing from it at
 * the very end, which reads as "columns in the wrong order". This keeps the
 * user's saved order for columns that still exist, drops IDs that no longer do,
 * and slots any brand-new columns back in at their natural (code-defined)
 * position instead of the end.
 */
export const reconcileColumnOrder = (
  persisted: string[] | undefined,
  currentIds: string[]
): string[] => {
  if (!persisted || persisted.length === 0) {
    return currentIds;
  }

  const currentSet = new Set(currentIds);
  const placed = new Set<string>();

  // 1. Keep persisted entries that still exist, in their saved order (drop stale + dupes).
  const result: string[] = [];
  for (const id of persisted) {
    if (currentSet.has(id) && !placed.has(id)) {
      result.push(id);
      placed.add(id);
    }
  }

  // 2. Slot any columns missing from the saved order in at their natural position:
  //    right after the nearest preceding column that's already placed.
  currentIds.forEach((id, naturalIdx) => {
    if (placed.has(id)) {
      return;
    }
    let insertAt = result.length;
    for (const precedingId of currentIds.slice(0, naturalIdx).reverse()) {
      const pos = result.indexOf(precedingId);
      if (pos !== -1) {
        insertAt = pos + 1;
        break;
      }
    }
    result.splice(insertAt, 0, id);
    placed.add(id);
  });

  return result;
};

export interface TablePagination {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
}

export interface TableSort {
  sortKey: string | null;
  direction: SortDirection | SortOrder | null;
  handleSort: (sortKey: string) => void;
}

export interface TableSelection<TData extends BaseTableRow = BaseTableRow> {
  selectedRows: TData[];
  handleSelectRow: (row: TData) => void;
  handleSelectAll: (checked: boolean) => void;
  handleDeselectAll: () => void;
  isRowSelected: (row: TData) => boolean;
  isRowDisabled?: (row: TData) => boolean;
  findRowInSelection: (row: TData) => TData | undefined;
}

export interface VisibleColumn {
  id: string;
  visible: boolean;
}

export interface TableActionMenuSubItem<TData extends BaseTableRow = BaseTableRow> {
  label: string;
  callbackAction: (params: { row: TData }) => void;
  hidden?: boolean | ((params: { row: TData }) => boolean);
}

export interface TableActionMenuItem<TData extends BaseTableRow = BaseTableRow> {
  href?: string | ((params: { row: TData }) => string);
  label: string | ((params: { row: TData }) => string);
  icon?: ReactNode | ((params: { row: TData }) => ReactNode);
  callbackAction?: (params: { row: TData }) => void;
  hidden?: boolean | ((params: { row: TData }) => boolean);
  /** When true the item is shown but greyed out and non-interactive (vs. `hidden`, which removes it). */
  disabled?: boolean | ((params: { row: TData }) => boolean);
  /** Sub-items for creating a submenu. When present, clicking the main item opens a submenu instead of triggering callbackAction */
  subItems?: TableActionMenuSubItem<TData>[];
}
