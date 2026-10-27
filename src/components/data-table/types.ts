import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc';

/** One sorted column. A sort is a list of these in priority order. */
export interface SortItem {
  key: string;
  direction: SortDirection;
}

/**
 * All a row needs is a stable `id`. Any interface or type with one fits, with
 * no need to extend this.
 */
export interface BaseTableRow {
  id: string | number;
}

export interface TableColumn<TData extends BaseTableRow = BaseTableRow> {
  /**
   * Stable identifier for the column, sub-columns included. Saved layouts,
   * `onVisibleColumnsChange` and the column panel key off it, so it must stay
   * the same when the header text changes or is translated.
   */
  id: string;
  header: string;
  headerIcon?: React.ReactNode;
  sortKey?: string;
  cell?: (params: { row: TData }) => React.ReactNode;
  loadingCell?: () => React.ReactNode;
  /** Extra classes on the column's header cell (the group header for a column with sub-columns). */
  headerClassName?: string;
  /** Extra classes on each of the column's body cells. */
  cellClassName?: string;
  subColumns?: TableColumn<TData>[];
  hideByDefault?: boolean;
  alwaysVisible?: boolean;
}

/**
 * Reconcile a persisted column order against the current set of column IDs.
 *
 * A persisted order can go stale when the table's columns change in code
 * (added, removed, or renamed).
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

/**
 * The column order after a drag in the column panel, which lists only the
 * columns that can move. `reordered` fills the unpinned places in `order`, and
 * pinned (`alwaysVisible`) columns keep theirs.
 */
export const placeReorderedColumns = (
  order: string[],
  pinned: ReadonlySet<string>,
  reordered: string[]
): string[] => {
  let next = 0;
  return order.map(id => (pinned.has(id) ? id : (reordered[next++] ?? id)));
};

export interface TablePagination {
  /**
   * Rows across every page. Cursor APIs often have none: without it the footer
   * shows the page's range only, and Next follows `hasNextPage`. `null` (a
   * nullable GraphQL field) counts as unknown too, as does a negative total
   * (an API's -1) or `NaN`.
   */
  totalCount?: number | null;
  pageIndex: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

/** What the table needs to show and change a sort. `useTableSort` returns it. */
export interface TableSort {
  /** Sorted columns in priority order; empty means unsorted. */
  sortBy: SortItem[];
  /** Called when a sortable header is clicked; `additive` is true for Shift+click or Shift+Enter. */
  onSort: (key: string, options: { additive: boolean }) => void;
}

/** What the table needs to show and change a selection. `useTableSelection` returns it. */
export interface TableSelection<TData extends BaseTableRow = BaseTableRow> {
  isRowSelected: (row: TData) => boolean;
  /** A disabled row's checkbox is disabled, and select-all and drag selection skip it. */
  isRowDisabled?: (row: TData) => boolean;
  /** Called when a row's checkbox, a row click (`selectOnRowClick`) or a drag toggles it. */
  onToggleRow: (row: TData) => void;
  /** Called when the select-all checkbox changes. */
  onToggleAll: (checked: boolean) => void;
}

/** What the table needs to show and change row expansion. `useTableExpansion` returns it. */
export interface TableExpansion<TData extends BaseTableRow = BaseTableRow> {
  isRowExpanded: (row: TData) => boolean;
  /** A row that isn't expandable gets no button. Defaults to every row. */
  isRowExpandable?: (row: TData) => boolean;
  /** Called by a row's expand button, or a row click with `expandOnRowClick`. */
  onToggleRow: (row: TData) => void;
}

export interface VisibleColumn {
  id: string;
  visible: boolean;
}

export interface TableActionMenuSubItem<TData extends BaseTableRow = BaseTableRow> {
  label: string;
  /** Renders the item as a link, through `linkComponent`. */
  href?: string | ((params: { row: TData }) => string);
  icon?: ReactNode | ((params: { row: TData }) => ReactNode);
  /** Runs when the item is chosen, by pointer or keyboard. */
  onSelect?: (params: { row: TData }) => void;
  hidden?: boolean | ((params: { row: TData }) => boolean);
  /** When true the item is shown but greyed out and non-interactive (vs. `hidden`, which removes it). */
  disabled?: boolean | ((params: { row: TData }) => boolean);
}

export interface TableActionMenuItem<TData extends BaseTableRow = BaseTableRow> {
  /** Renders the item as a link, through `linkComponent`. */
  href?: string | ((params: { row: TData }) => string);
  label: string | ((params: { row: TData }) => string);
  icon?: ReactNode | ((params: { row: TData }) => ReactNode);
  /** Runs when the item is chosen, by pointer or keyboard. */
  onSelect?: (params: { row: TData }) => void;
  hidden?: boolean | ((params: { row: TData }) => boolean);
  /** When true the item is shown but greyed out and non-interactive (vs. `hidden`, which removes it). */
  disabled?: boolean | ((params: { row: TData }) => boolean);
  /** Sub-items for creating a submenu. When present, choosing the item opens the submenu instead of running onSelect */
  subItems?: TableActionMenuSubItem<TData>[];
}
