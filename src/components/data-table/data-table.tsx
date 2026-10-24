'use client';

import React, { useCallback, useId, useMemo } from 'react';

import { usePersistedState } from '../../hooks/use-persisted-state.ts';
import { type RowDragState, useTableDragSelection } from '../../hooks/use-table-drag-selection.ts';
import { useTableExpansion } from '../../hooks/use-table-expansion.ts';
import { type DataTableLabels, resolveLabels } from '../../labels.ts';
import { cx } from '../../lib/cx.ts';
import { isInteractiveTarget } from '../../lib/interactive-target.ts';
import { readStorage, storageKey, writeStorage } from '../../lib/persistence.ts';
import { KeyboardArrowRight } from '../icon.tsx';
import { Checkbox } from '../ui/checkbox.tsx';
import { getTableLayout } from './layout.ts';
import { Pagination } from './pagination.tsx';
import { type ActionMenuLinkComponent, TableActionMenu } from './table-action-menu.tsx';
import { TableHeader } from './table-header.tsx';
import { TableLoading } from './table-loading.tsx';
import { TableMenu } from './table-menu.tsx';
import {
  type BaseTableRow,
  reconcileColumnOrder,
  type TableActionMenuItem,
  type TableColumn,
  type TableExpansion,
  type TablePagination,
  type TableSelection,
  type TableSort,
  type VisibleColumn,
} from './types.ts';

// Unit-separator control char: safe join delimiter for column-id signatures
// (column ids are ordinary strings, which don't contain it).
const COLUMN_LAYOUT_SEP = '\u001f';

interface ColumnLayout {
  toggles: Record<string, boolean>;
  order: string[];
}

// The saved layout, or undefined when there is none that parses. A saved order
// is kept only while it was saved against the same code-defined columns.
const readColumnLayout = (persistKey: string, currentIds: string[]): ColumnLayout | undefined => {
  const raw = readStorage(storageKey(persistKey, 'columns'));
  if (raw === null) {
    return undefined;
  }
  try {
    const saved = JSON.parse(raw) as {
      toggles?: Record<string, boolean>;
      order?: string[];
      orderSig?: string;
    };
    const toggles = saved.toggles && typeof saved.toggles === 'object' ? saved.toggles : {};
    const order =
      Array.isArray(saved.order) && saved.orderSig === currentIds.join(COLUMN_LAYOUT_SEP)
        ? reconcileColumnOrder(saved.order, currentIds)
        : currentIds;
    return { toggles, order };
  } catch {
    return undefined;
  }
};

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
   * Optional stable per-row `data-testid` for e2e locators. Returns the id for a
   * row (or undefined to skip). Prefer this over positional `tr:nth` / `td:nth`
   * selectors, which race Suspense re-streams and hydration.
   */
  getRowTestId?: (row: TData) => string | undefined;
  /**
   * Names a row for assistive technology, in its checkbox ("Select <label>")
   * and its action menu ("Actions for <label>"). Without it, rows are named by
   * `labels.rowLabel`, "row <id>" by default.
   */
  getRowLabel?: (row: TData) => string;
  /** Opt-in: render a "Page N of M" indicator + bordered controls in the footer. */
  showPageCount?: boolean;
  /**
   * Content for a row's expanded panel, a full-width row beneath it. Setting it
   * adds a leading column with an expand button per row. Called only for
   * expanded rows.
   */
  renderExpandedRow?: (row: TData) => React.ReactNode;
  /**
   * Which rows are expanded, from `useTableExpansion`. Optional: without it the
   * table keeps that state itself. Ignored without `renderExpandedRow`.
   */
  expansion?: TableExpansion<TData>;
  /** Toggle a row's panel from a click anywhere on the row, except its controls. */
  expandOnRowClick?: boolean;
  /** Override any of the user-facing strings (English defaults). */
  labels?: Partial<DataTableLabels>;
  /**
   * Component used to render action-menu items that have an `href`. Defaults
   * to a plain `<a>`; pass a router-aware link (e.g. Next.js `Link`) for
   * client-side navigation.
   */
  linkComponent?: ActionMenuLinkComponent;
}

const EXPAND_HEADER_CLASS =
  'rdt-table__header-cell rdt-table__header-cell--expand rdt-table__header-cell--sticky';
const SELECT_HEADER_CLASS =
  'rdt-table__header-cell rdt-table__header-cell--select rdt-table__header-cell--sticky';
const SETTINGS_HEADER_CLASS =
  'rdt-table__header-cell rdt-table__header-cell--settings rdt-table__header-cell--sticky';
// Over the row menus when the settings button is hidden, so the header row
// has as many cells as the body rows.
const ACTIONS_HEADER_CLASS =
  'rdt-table__header-cell rdt-table__header-cell--actions rdt-table__header-cell--sticky';

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
  expansion,
  expandOnRowClick = false,
  labels,
  linkComponent,
}: DataTableProps<TData>) => {
  const t = resolveLabels(labels);
  const rowLabelOf = (row: TData) => getRowLabel?.(row) ?? t.rowLabel({ id: row.id });

  // Without an `expansion` prop, the table keeps its own expansion state.
  const ownExpansion = useTableExpansion<TData>();
  const activeExpansion = renderExpandedRow ? (expansion ?? ownExpansion) : undefined;
  const tableId = useId();

  // The column layout: user visibility overrides (column id to visible;
  // columns without one follow hideByDefault) and the column order. Saved in
  // storage only, never in the URL, so it always comes back from storage, link
  // or not. The saved order is versioned against the code-defined column set,
  // so a drag-reorder only survives while the columns themselves are unchanged.
  const naturalOrder = useMemo(() => columns.map(column => column.id), [columns]);
  const columnLayoutSig = naturalOrder.join(COLUMN_LAYOUT_SEP);
  const defaultLayout = useMemo<ColumnLayout>(
    () => ({ toggles: {}, order: naturalOrder }),
    [naturalOrder]
  );
  const { value: columnLayout, setValue: setColumnLayout } = usePersistedState<ColumnLayout>({
    persistKey,
    defaultValue: defaultLayout,
    serialize: value => JSON.stringify({ ...value, orderSig: columnLayoutSig }),
    read: key => readColumnLayout(key, naturalOrder),
    write: (key, value) =>
      writeStorage(
        storageKey(key, 'columns'),
        JSON.stringify({ toggles: value.toggles, order: value.order, orderSig: columnLayoutSig })
      ),
  });
  const userToggles = columnLayout.toggles;
  const columnOrder = columnLayout.order;

  // Reconcile the ORDER used for layout against the current column set, e.g. a
  // dynamic metric/category toggle that adds or removes columns. Derived at
  // render (no effect / no setState-in-effect): if the persisted `columnOrder`
  // set no longer matches the current columns, fall back to natural order so new
  // columns slot into place instead of being sent to the far right by
  // `visibleColumnsData` (`aIndex === -1 → columnOrder.length`). When the id SET
  // matches, keep the persisted sequence so user reordering (and static-column
  // tables) are untouched.
  const effectiveColumnOrder = useMemo(() => {
    const naturalIds = columns.map(column => column.id);
    const naturalSet = new Set(naturalIds);
    const persistedPresent = columnOrder.filter(id => naturalSet.has(id));
    // `persistedPresent ⊆ naturalIds` and both have unique ids, so equal lengths
    // ⇒ identical sets. Same set → keep the user's order; else natural order.
    return persistedPresent.length === naturalIds.length ? persistedPresent : naturalIds;
  }, [columns, columnOrder]);

  // Derive visibleColumns from current columns prop + user toggles.
  // This automatically includes dynamically added columns without needing state sync.
  const visibleColumns = useMemo(
    () =>
      columns.map(col => {
        const id = col.id;
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
      setColumnLayout(prevLayout => {
        const prev = prevLayout.toggles;
        const current = prev[id];
        const col = columns.find(c => c.id === id);
        const defaultVisible = col ? !col.hideByDefault : true;
        const currentlyVisible = current !== undefined ? current : defaultVisible;
        const updated = { ...prev, [id]: !currentlyVisible };

        // Notify parent after state update via microtask to avoid
        // "setState during render" errors
        if (onVisibleColumnsChange) {
          const fullList = columns.map(c => {
            const cId = c.id;
            const toggle = cId === id ? !currentlyVisible : updated[cId];
            return {
              id: cId,
              visible: toggle !== undefined ? toggle : !c.hideByDefault,
            };
          });
          queueMicrotask(() => onVisibleColumnsChange(fullList));
        }

        return { ...prevLayout, toggles: updated };
      });
    },
    [columns, onVisibleColumnsChange, setColumnLayout]
  );

  const handleColumnReorder = useCallback(
    (newOrder: string[]) => {
      setColumnLayout(prev => ({ ...prev, order: newOrder }));
      if (onColumnReorder) {
        onColumnReorder(newOrder);
      }
    },
    [onColumnReorder, setColumnLayout]
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
      if (isInteractiveTarget(e) || selection?.isRowDisabled?.(row)) {
        return;
      }

      if (onRowClick) {
        onRowClick(row);
      }
      if (expandOnRowClick) {
        activeExpansion?.onToggleRow(row);
      }
      if (selection) {
        handleRowClick(e, row);
      }
    },
    [selection, onRowClick, expandOnRowClick, activeExpansion, handleRowClick]
  );

  const visibleColumnsData = useMemo(() => {
    // Sort columns based on the reconciled column order (see `effectiveColumnOrder`).
    const sortedColumns = [...columns].sort((a, b) => {
      const aIndex = effectiveColumnOrder.indexOf(a.id);
      const bIndex = effectiveColumnOrder.indexOf(b.id);
      // Columns not in the order (should not happen post-reconciliation) sort to the end
      const aPos = aIndex === -1 ? effectiveColumnOrder.length : aIndex;
      const bPos = bIndex === -1 ? effectiveColumnOrder.length : bIndex;
      return aPos - bPos;
    });

    return sortedColumns.filter(column => {
      if (column.alwaysVisible) {
        return true;
      }
      const columnId = column.id;
      return visibleColumns.find(vc => vc.id === columnId)?.visible ?? true;
    });
  }, [columns, visibleColumns, effectiveColumnOrder]);

  // Flattened columns for cell rendering
  const flattenedColumnsData = useMemo(() => {
    return flattenColumns(visibleColumnsData);
  }, [visibleColumnsData, flattenColumns]);

  const menuColumns = useMemo(() => columns.filter(col => !col.alwaysVisible), [columns]);

  const layout = getTableLayout({
    expand: !!activeExpansion,
    select: !!selection,
    actionMenu: !!actionMenu,
    hideTableSettings: !!hideTableSettings,
  });
  const columnCount = layout.leadingCount + flattenedColumnsData.length + layout.trailingCount;

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
                  {layout.expand && (
                    <th scope="col" rowSpan={2} className={EXPAND_HEADER_CLASS}>
                      <span className="rdt-visually-hidden">{t.expandColumn}</span>
                    </th>
                  )}
                  {selection && (
                    <th scope="col" rowSpan={2} className={SELECT_HEADER_CLASS}>
                      <div className="rdt-table__select-all">
                        <Checkbox
                          checked={
                            data.length > 0
                            && data
                              .filter(row => !selection.isRowDisabled?.(row))
                              .every(row => selection.isRowSelected(row))
                          }
                          onCheckedChange={selection.onToggleAll}
                          disabled={!!loading}
                          aria-label={t.selectAll}
                        />
                      </div>
                    </th>
                  )}
                  {visibleColumnsData.map(column => {
                    if (column.subColumns && column.subColumns.length > 0) {
                      // Grouped column - span across sub-columns
                      return (
                        <th
                          key={column.id}
                          scope="colgroup"
                          colSpan={column.subColumns.length}
                          className={cx(
                            'rdt-table__header-cell',
                            'rdt-table__header-cell--group',
                            column.headerClassName
                          )}
                        >
                          {column.header}
                        </th>
                      );
                    } else {
                      // Regular column - span across 2 rows
                      return (
                        <TableHeader
                          key={column.id}
                          column={column}
                          sortBy={sort?.sortBy}
                          onSort={sort?.onSort}
                          labels={t}
                          className={column.headerClassName || ''}
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
                        labels={t}
                      />
                    </th>
                  )}
                  {hideTableSettings && layout.trailing === 'actions' && (
                    <td rowSpan={2} className={ACTIONS_HEADER_CLASS} />
                  )}
                </tr>
                {/* Sub-column header row */}
                <tr className="rdt-table__header-row">
                  {visibleColumnsData.flatMap(column => {
                    if (column.subColumns && column.subColumns.length > 0) {
                      // Render sub-columns
                      return column.subColumns.map(subColumn => (
                        <TableHeader
                          key={`${column.id}-${subColumn.id}`}
                          column={subColumn}
                          sortBy={sort?.sortBy}
                          onSort={sort?.onSort}
                          labels={t}
                          className={subColumn.headerClassName || ''}
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
                {layout.expand && (
                  <th scope="col" className={EXPAND_HEADER_CLASS}>
                    <span className="rdt-visually-hidden">{t.expandColumn}</span>
                  </th>
                )}
                {selection && (
                  <th scope="col" className={SELECT_HEADER_CLASS}>
                    <div className="rdt-table__select-all">
                      <Checkbox
                        checked={
                          data.length > 0
                          && data
                            .filter(row => !selection.isRowDisabled?.(row))
                            .every(row => selection.isRowSelected(row))
                        }
                        onCheckedChange={selection.onToggleAll}
                        disabled={!!loading}
                        aria-label={t.selectAll}
                      />
                    </div>
                  </th>
                )}
                {visibleColumnsData.map(column => (
                  <TableHeader
                    key={column.id}
                    column={column}
                    sortBy={sort?.sortBy}
                    onSort={sort?.onSort}
                    labels={t}
                    className={column.headerClassName || ''}
                  />
                ))}
                {!hideTableSettings && (
                  <th scope="col" className={SETTINGS_HEADER_CLASS}>
                    <TableMenu
                      visibleColumns={visibleColumns}
                      columns={columns}
                      toggleHeaders={toggleHeaders}
                      onColumnReorder={handleColumnReorder}
                      labels={t}
                    />
                  </th>
                )}
                {hideTableSettings && layout.trailing === 'actions' && (
                  <td className={ACTIONS_HEADER_CLASS} />
                )}
              </tr>
            )}
          </thead>
          <tbody className="rdt-table__body">
            {loading && (
              <TableLoading
                visibleColumnsData={flattenedColumnsData}
                layout={layout}
                rowCount={maxLoadingRows}
              />
            )}
            {!loading && data.length === 0 && (
              <tr className="rdt-table__empty-row">
                <td className="rdt-table__empty" colSpan={columnCount}>
                  {t.noResults}
                </td>
              </tr>
            )}
            {!loading
              && data.length > 0
              && data.map((row: TData, rowIndex: number) => {
                const isExpanded = activeExpansion?.isRowExpanded(row) ?? false;
                const expandedRowId = `${tableId}-expanded-${rowIndex}`;
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      data-testid={getRowTestId?.(row)}
                      onClick={e => rowClickHandler(e, row)}
                      onMouseDown={selection ? e => handleRowMouseDown(e, rowIndex) : undefined}
                      onMouseUp={selection ? e => handleRowMouseUp(e, rowIndex) : undefined}
                      onMouseEnter={selection ? () => handleRowMouseEnter(rowIndex) : undefined}
                      data-selected={selection?.isRowSelected(row) || undefined}
                      {...dragAttributes(getRowDragState(rowIndex))}
                      className={cx(
                        'rdt-table__row',
                        (selection || onRowClick || (expandOnRowClick && activeExpansion))
                          && 'rdt-table__row--clickable',
                        rowClassName?.(row)
                      )}
                    >
                      {activeExpansion && (
                        <td className="rdt-table__cell rdt-table__cell--expand rdt-table__cell--sticky">
                          {(activeExpansion.isRowExpandable?.(row) ?? true) && (
                            <button
                              type="button"
                              className="rdt-expand-button"
                              aria-expanded={isExpanded}
                              aria-controls={isExpanded ? expandedRowId : undefined}
                              aria-label={t.expandRow({ rowLabel: rowLabelOf(row) })}
                              onClick={() => activeExpansion.onToggleRow(row)}
                            >
                              <KeyboardArrowRight className="rdt-expand-button__icon" />
                            </button>
                          )}
                        </td>
                      )}
                      {selection && (
                        <td className="rdt-table__cell rdt-table__cell--select rdt-table__cell--sticky">
                          <Checkbox
                            checked={selection.isRowSelected(row)}
                            disabled={selection.isRowDisabled?.(row)}
                            onCheckedChange={() => selection.onToggleRow(row)}
                            aria-label={t.selectRow({ rowLabel: rowLabelOf(row) })}
                          />
                        </td>
                      )}
                      {flattenedColumnsData.map((column, index: number) => (
                        <td
                          key={`${row.id}-${index}-${column.id}`}
                          className={cx('rdt-table__cell', column.cellClassName)}
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
                            triggerLabel={t.rowActions({ rowLabel: rowLabelOf(row) })}
                          />
                        </td>
                      )}
                      {layout.trailing === 'settings' && (
                        <td className="rdt-table__cell rdt-table__cell--settings rdt-table__cell--sticky" />
                      )}
                    </tr>
                    {isExpanded && renderExpandedRow && (
                      <tr id={expandedRowId} className="rdt-table__expanded-row">
                        <td colSpan={columnCount} className="rdt-table__expanded-cell">
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>
      {pagination && (
        <Pagination
          totalCount={pagination.totalCount}
          pageRowCount={data.length}
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onNextPage={pagination.onNextPage}
          onPreviousPage={pagination.onPreviousPage}
          showPageCount={showPageCount}
          labels={labels}
        />
      )}
    </div>
  );
};
