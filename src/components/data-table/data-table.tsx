'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type RowDragState, useTableDragSelection } from '../../hooks/use-table-drag-selection.ts';
import { type DataTableLabels, resolveLabels } from '../../labels.ts';
import { cx } from '../../lib/cx.ts';
import { Checkbox } from '../ui/checkbox.tsx';
import { PaginationClient } from './pagination-client.tsx';
import { readPersisted, writePersisted } from './persist.ts';
import { type ActionMenuLinkComponent, TableActionMenu } from './table-action-menu.tsx';
import { TableHeader } from './table-header.tsx';
import { TableLoading } from './table-loading.tsx';
import { TableMenu } from './table-menu.tsx';
import {
  type BaseTableRow,
  getColumnId,
  reconcileColumnOrder,
  type TableActionMenuItem,
  type TableColumn,
  type TablePagination,
  type TableSelection,
  type TableSort,
  type VisibleColumn,
} from './types.ts';

// Unit-separator control char: safe join delimiter for column-id signatures
// (column ids are kebab-case or explicit strings, neither of which contains it).
const COLUMN_LAYOUT_SEP = '\u001f';

interface DataTableProps<TData extends BaseTableRow = BaseTableRow> {
  loading?: boolean;
  columns: TableColumn<TData>[];
  data: TData[];
  pagination?: TablePagination;
  sort?: TableSort;
  selection?: TableSelection<TData>;
  actionMenu?: TableActionMenuItem<TData>[];
  hideTableSettings?: boolean;
  maxLoadingRows?: number;
  selectOnRowClick?: boolean;
  onRowClick?: (row: TData) => void;
  onColumnReorder?: (newOrder: string[]) => void;
  onVisibleColumnsChange?: (visibleColumns: VisibleColumn[]) => void;
  /** When set, persists column visibility and order to localStorage under this key */
  persistKey?: string;
  /**
   * Optional per-row extra classes on the `<tr>`. Use for accent treatments
   * such as a coloured left border on highlighted rows. Returns a className (or
   * empty string) for each row; defaults to no extra classes.
   */
  rowClassName?: (row: TData) => string;
  /**
   * Optional stable per-row `data-test-id` for e2e locators. Returns the id for a
   * row (or undefined to skip). Prefer this over positional `tr:nth` / `td:nth`
   * selectors, which race Suspense re-streams and hydration.
   */
  getRowTestId?: (row: TData) => string | undefined;
  /**
   * Names a row for assistive technology. When set, the row's selection
   * checkbox is announced as "Select <label>"; when omitted it falls back to
   * "Select row <id>".
   */
  getRowLabel?: (row: TData) => string;
  /** Opt-in: render a "Page N of M" indicator + bordered controls in the footer. */
  showPageCount?: boolean;
  /**
   * Opt-in accordion rows: when set, each data row that returns non-null gets a
   * full-width companion row rendered directly beneath it with the returned
   * content. Expansion STATE belongs to the consumer (track the expanded row
   * ids and return null for collapsed rows). Pair it with `onRowClick` to
   * toggle. Returning null for every row is equivalent to omitting the prop.
   */
  renderExpandedRow?: (row: TData) => React.ReactNode | null;
  /** Override any of the user-facing strings (English defaults). */
  labels?: Partial<DataTableLabels>;
  /**
   * Component used to render action-menu items that have an `href`. Defaults
   * to a plain `<a>`; pass a router-aware link (e.g. Next.js `Link`) for
   * client-side navigation.
   */
  linkComponent?: ActionMenuLinkComponent;
}

const SELECT_HEADER_CLASS =
  'rdt-table__header-cell rdt-table__header-cell--select rdt-table__header-cell--sticky';
const SETTINGS_HEADER_CLASS =
  'rdt-table__header-cell rdt-table__header-cell--settings rdt-table__header-cell--sticky';

// Drag state as data attributes, present only when true, for the stylesheet.
const dragAttributes = ({ inRange, isStart, isEnd }: RowDragState) => ({
  'data-drag-range': inRange || undefined,
  'data-drag-start': isStart || undefined,
  'data-drag-end': isEnd || undefined,
});

export const DataTable = <TData extends BaseTableRow = BaseTableRow>({
  loading,
  columns,
  data,
  pagination,
  sort,
  selection,
  actionMenu,
  hideTableSettings,
  maxLoadingRows = 10,
  selectOnRowClick = false,
  onRowClick,
  onColumnReorder,
  onVisibleColumnsChange,
  persistKey,
  rowClassName,
  getRowTestId,
  getRowLabel,
  showPageCount = false,
  renderExpandedRow,
  labels,
  linkComponent,
}: DataTableProps<TData>) => {
  const t = resolveLabels(labels);

  // Track user-toggled visibility overrides (column ID → visible). Columns not in
  // this map use their default visibility from hideByDefault.
  // Lazy initializer reads persisted state on client, defaults on server.
  const [userToggles, setUserToggles] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined' || !persistKey) {
      return {};
    }
    const p = readPersisted<{ toggles?: Record<string, boolean> }>(
      'cols',
      `datatable:${persistKey}`
    );
    return p?.toggles ?? {};
  });
  // Signature of the code-defined column layout (order-sensitive). Saved column
  // orders are versioned against this so a drag-reorder only survives while the
  // columns themselves are unchanged; when columns change in code the saved
  // order is discarded rather than rendered stale.
  const columnLayoutSig = useMemo(
    () => columns.map(getColumnId).join(COLUMN_LAYOUT_SEP),
    [columns]
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const currentIds = columns.map(column => getColumnId(column));
    if (typeof window === 'undefined' || !persistKey) {
      return currentIds;
    }
    const p = readPersisted<{ order?: string[]; orderSig?: string }>(
      'cols',
      `datatable:${persistKey}`
    );
    // Only honor a saved order captured against the current code-defined column
    // layout. When columns are added/removed/reordered in code (or the saved
    // state predates this versioning), the signature won't match and we fall
    // back to the natural order instead of a stale arrangement.
    if (!p?.order || p.orderSig !== currentIds.join(COLUMN_LAYOUT_SEP)) {
      return currentIds;
    }
    return reconcileColumnOrder(p.order, currentIds);
  });

  // Reconcile the ORDER used for layout against the current column set, e.g. a
  // dynamic metric/category toggle that adds or removes columns. Derived at
  // render (no effect / no setState-in-effect): if the persisted `columnOrder`
  // set no longer matches the current columns, fall back to natural order so new
  // columns slot into place instead of being sent to the far right by
  // `visibleColumnsData` (`aIndex === -1 → columnOrder.length`). When the id SET
  // matches, keep the persisted sequence so user reordering (and static-column
  // tables) are untouched.
  const effectiveColumnOrder = useMemo(() => {
    const naturalIds = columns.map(column => getColumnId(column));
    const naturalSet = new Set(naturalIds);
    const persistedPresent = columnOrder.filter(id => naturalSet.has(id));
    // `persistedPresent ⊆ naturalIds` and both have unique ids, so equal lengths
    // ⇒ identical sets. Same set → keep the user's order; else natural order.
    return persistedPresent.length === naturalIds.length ? persistedPresent : naturalIds;
  }, [columns, columnOrder]);

  // Persist column state to both URL and localStorage when it changes
  const isFirstPersist = useRef(true);
  useEffect(() => {
    if (!persistKey) {
      return;
    }
    if (isFirstPersist.current) {
      isFirstPersist.current = false;
      return;
    }
    const state = { toggles: userToggles, order: columnOrder, orderSig: columnLayoutSig };
    writePersisted({ cols: JSON.stringify(state) }, `datatable:${persistKey}`, state);
  }, [persistKey, userToggles, columnOrder, columnLayoutSig]);

  // Derive visibleColumns from current columns prop + user toggles.
  // This automatically includes dynamically added columns without needing state sync.
  const visibleColumns = useMemo(
    () =>
      columns.map(col => {
        const id = getColumnId(col);
        const userToggle = userToggles[id];
        return {
          id,
          visible: userToggle !== undefined ? userToggle : !col.hideByDefault,
        };
      }),
    [columns, userToggles]
  );

  const {
    handleTableMouseLeave,
    handleRowClick,
    handleRowMouseDown,
    handleRowMouseUp,
    handleRowMouseEnter,
    isDragActive,
    getRowDragState,
  } = useTableDragSelection({
    data,
    selection,
    selectOnRowClick,
  });

  const toggleHeaders = useCallback(
    (id: string) => {
      setUserToggles(prev => {
        const current = prev[id];
        const col = columns.find(c => getColumnId(c) === id);
        const defaultVisible = col ? !col.hideByDefault : true;
        const currentlyVisible = current !== undefined ? current : defaultVisible;
        const updated = { ...prev, [id]: !currentlyVisible };

        // Notify parent after state update via microtask to avoid
        // "setState during render" errors
        if (onVisibleColumnsChange) {
          const fullList = columns.map(c => {
            const cId = getColumnId(c);
            const toggle = cId === id ? !currentlyVisible : updated[cId];
            return {
              id: cId,
              visible: toggle !== undefined ? toggle : !c.hideByDefault,
            };
          });
          queueMicrotask(() => onVisibleColumnsChange(fullList));
        }

        return updated;
      });
    },
    [columns, onVisibleColumnsChange]
  );

  const handleColumnReorder = useCallback(
    (newOrder: string[]) => {
      setColumnOrder(newOrder);
      if (onColumnReorder) {
        onColumnReorder(newOrder);
      }
    },
    [onColumnReorder]
  );

  // Flatten columns to include sub-columns for cell rendering
  const flattenColumns = useCallback((cols: TableColumn<TData>[]): TableColumn<TData>[] => {
    const flattened: TableColumn<TData>[] = [];
    for (const col of cols) {
      if (col.subColumns && col.subColumns.length > 0) {
        flattened.push(...col.subColumns);
      } else {
        flattened.push(col);
      }
    }
    return flattened;
  }, []);

  const rowClickHandler = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, row: TData) => {
      if (selection?.isRowDisabled?.(row)) {
        return;
      }

      if (onRowClick) {
        onRowClick(row);
      }
      if (selection) {
        handleRowClick(e, row);
      }
    },
    [selection, onRowClick, handleRowClick]
  );

  const visibleColumnsData = useMemo(() => {
    // Sort columns based on the reconciled column order (see `effectiveColumnOrder`).
    const sortedColumns = [...columns].sort((a, b) => {
      const aIndex = effectiveColumnOrder.indexOf(getColumnId(a));
      const bIndex = effectiveColumnOrder.indexOf(getColumnId(b));
      // Columns not in the order (should not happen post-reconciliation) sort to the end
      const aPos = aIndex === -1 ? effectiveColumnOrder.length : aIndex;
      const bPos = bIndex === -1 ? effectiveColumnOrder.length : bIndex;
      return aPos - bPos;
    });

    return sortedColumns.filter(column => {
      if (column.alwaysVisible) {
        return true;
      }
      const columnId = getColumnId(column);
      return visibleColumns.find(vc => vc.id === columnId)?.visible ?? true;
    });
  }, [columns, visibleColumns, effectiveColumnOrder]);

  // Flattened columns for cell rendering
  const flattenedColumnsData = useMemo(() => {
    return flattenColumns(visibleColumnsData);
  }, [visibleColumnsData, flattenColumns]);

  const menuColumns = useMemo(() => columns.filter(col => !col.alwaysVisible), [columns]);

  // Check if any column has sub-columns
  const hasGroupedColumns = useMemo(() => {
    return visibleColumnsData.some(col => col.subColumns && col.subColumns.length > 0);
  }, [visibleColumnsData]);

  return (
    <div className="rdt-table">
      <div className="rdt-table__scroll">
        <table
          className="rdt-table__table"
          aria-busy={loading || undefined}
          data-dragging={isDragActive || undefined}
          onMouseLeave={selection ? handleTableMouseLeave : undefined}
        >
          <thead className="rdt-table__head">
            {hasGroupedColumns ? (
              <>
                {/* Parent header row */}
                <tr className="rdt-table__header-row">
                  {selection && (
                    <th scope="col" rowSpan={2} className={SELECT_HEADER_CLASS}>
                      <div className="rdt-table__select-all">
                        <Checkbox
                          id="select-all"
                          checked={
                            data.length > 0
                            && data
                              .filter(row => !selection.isRowDisabled?.(row))
                              .every(row => selection.isRowSelected(row))
                          }
                          onCheckedChange={selection.handleSelectAll}
                          disabled={!!loading}
                          aria-label="Select all"
                        />
                      </div>
                    </th>
                  )}
                  {visibleColumnsData.map(column => {
                    if (column.subColumns && column.subColumns.length > 0) {
                      // Grouped column - span across sub-columns
                      return (
                        <th
                          key={getColumnId(column)}
                          scope="colgroup"
                          colSpan={column.subColumns.length}
                          className={cx(
                            'rdt-table__header-cell',
                            'rdt-table__header-cell--group',
                            column.className
                          )}
                        >
                          {column.header}
                        </th>
                      );
                    } else {
                      // Regular column - span across 2 rows
                      return (
                        <TableHeader
                          key={getColumnId(column)}
                          column={column}
                          currentSortKey={sort?.sortKey}
                          currentDirection={sort?.direction}
                          onSort={sort?.handleSort}
                          className={column.className || ''}
                          rowSpan={2}
                        />
                      );
                    }
                  })}
                  {!hideTableSettings && (
                    <th scope="col" rowSpan={2} className={SETTINGS_HEADER_CLASS}>
                      <TableMenu
                        visibleColumns={visibleColumns}
                        columns={menuColumns}
                        toggleHeaders={toggleHeaders}
                        onColumnReorder={handleColumnReorder}
                      />
                    </th>
                  )}
                </tr>
                {/* Sub-column header row */}
                <tr className="rdt-table__header-row">
                  {visibleColumnsData.flatMap(column => {
                    if (column.subColumns && column.subColumns.length > 0) {
                      // Render sub-columns
                      return column.subColumns.map(subColumn => (
                        <TableHeader
                          key={`${getColumnId(column)}-${getColumnId(subColumn)}`}
                          column={subColumn}
                          currentSortKey={sort?.sortKey}
                          currentDirection={sort?.direction}
                          onSort={sort?.handleSort}
                          className={subColumn.className || ''}
                        />
                      ));
                    }
                    return [];
                  })}
                </tr>
              </>
            ) : (
              // Single header row when no grouped columns
              <tr className="rdt-table__header-row">
                {selection && (
                  <th scope="col" className={SELECT_HEADER_CLASS}>
                    <div className="rdt-table__select-all">
                      <Checkbox
                        id="select-all"
                        checked={
                          data.length > 0
                          && data
                            .filter(row => !selection.isRowDisabled?.(row))
                            .every(row => selection.isRowSelected(row))
                        }
                        onCheckedChange={selection.handleSelectAll}
                        disabled={!!loading}
                        aria-label="Select all"
                      />
                    </div>
                  </th>
                )}
                {visibleColumnsData.map(column => (
                  <TableHeader
                    key={getColumnId(column)}
                    column={column}
                    currentSortKey={sort?.sortKey}
                    currentDirection={sort?.direction}
                    onSort={sort?.handleSort}
                    className={column.className || ''}
                  />
                ))}
                {!hideTableSettings && (
                  <th scope="col" className={SETTINGS_HEADER_CLASS}>
                    <TableMenu
                      visibleColumns={visibleColumns}
                      columns={columns}
                      toggleHeaders={toggleHeaders}
                      onColumnReorder={handleColumnReorder}
                    />
                  </th>
                )}
              </tr>
            )}
          </thead>
          <tbody className="rdt-table__body">
            {loading && (
              <TableLoading
                visibleColumnsData={flattenedColumnsData}
                hasSelection={!!selection}
                hasActionMenu={!!actionMenu}
                rowCount={maxLoadingRows}
              />
            )}
            {!loading && data.length === 0 && (
              <tr className="rdt-table__empty-row">
                <td
                  className="rdt-table__empty"
                  colSpan={
                    flattenedColumnsData.length
                    + (selection ? 1 : 0)
                    + (actionMenu ? 1 : 0)
                    + (hideTableSettings ? 0 : 1)
                  }
                >
                  {t.noResults}
                </td>
              </tr>
            )}
            {!loading
              && data.length > 0
              && data.map((row: TData, rowIndex: number) => (
                <React.Fragment key={row.id}>
                  <tr
                    data-test-id={getRowTestId?.(row)}
                    onClick={e => rowClickHandler(e, row)}
                    onMouseDown={selection ? e => handleRowMouseDown(e, rowIndex) : undefined}
                    onMouseUp={selection ? e => handleRowMouseUp(e, rowIndex) : undefined}
                    onMouseEnter={selection ? () => handleRowMouseEnter(rowIndex) : undefined}
                    data-selected={selection?.isRowSelected(row) || undefined}
                    {...dragAttributes(getRowDragState(rowIndex))}
                    className={cx(
                      'rdt-table__row',
                      (selection || onRowClick) && 'rdt-table__row--clickable',
                      rowClassName?.(row)
                    )}
                  >
                    {selection && (
                      <td className="rdt-table__cell rdt-table__cell--select rdt-table__cell--sticky">
                        <Checkbox
                          id={`select-${row.id}`}
                          checked={selection.isRowSelected(row)}
                          disabled={selection.isRowDisabled?.(row)}
                          onCheckedChange={() => selection.handleSelectRow(row)}
                          aria-label={
                            getRowLabel ? `Select ${getRowLabel(row)}` : `Select row ${row.id}`
                          }
                        />
                      </td>
                    )}
                    {flattenedColumnsData.map((column, index: number) => (
                      <td
                        key={`${row.id}-${index}-${getColumnId(column)}`}
                        className={cx('rdt-table__cell', column.rowClassName)}
                        // If the column is the last column and the action menu is hidden, colSpan should be 2
                        colSpan={index === flattenedColumnsData.length - 1 && !actionMenu ? 2 : 1}
                      >
                        {column.cell ? column.cell({ row }) : null}
                      </td>
                    ))}
                    {actionMenu && (
                      <td
                        className="rdt-table__cell rdt-table__cell--actions rdt-table__cell--sticky"
                        onClick={e => e.stopPropagation()}
                      >
                        <TableActionMenu
                          items={actionMenu}
                          row={row}
                          linkComponent={linkComponent}
                        />
                      </td>
                    )}
                  </tr>
                  {(() => {
                    const expanded = renderExpandedRow?.(row);
                    return expanded != null ? (
                      <tr className="rdt-table__expanded-row">
                        <td
                          colSpan={
                            flattenedColumnsData.length
                            + (selection ? 1 : 0)
                            + (actionMenu ? 1 : 0)
                            + 1
                          }
                          className="rdt-table__expanded-cell"
                        >
                          {expanded}
                        </td>
                      </tr>
                    ) : null;
                  })()}
                </React.Fragment>
              ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <PaginationClient
          totalCount={pagination.totalCount}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          handleNextPage={pagination.handleNextPage}
          handlePreviousPage={pagination.handlePreviousPage}
          showPageCount={showPageCount}
          labels={labels}
        />
      )}
    </div>
  );
};
