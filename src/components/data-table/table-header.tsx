'use client';

import { cx } from '../../lib/cx.ts';
import { SortableHeaderClient } from '../library/sortable-header-client/index.ts';
import type { BaseTableRow, TableColumn, SortDirection as TableSortDirection } from './types.ts';

interface TableHeaderProps<TData extends BaseTableRow = BaseTableRow> {
  column: TableColumn<TData>;
  currentSortKey?: string | null;
  currentDirection?: TableSortDirection;
  onSort?: (sortKey: string) => void;
  className: string;
  rowSpan?: number;
}

export const TableHeader = <TData extends BaseTableRow = BaseTableRow>({
  column,
  currentSortKey,
  currentDirection,
  onSort,
  className,
  rowSpan,
}: TableHeaderProps<TData>) => {
  const handleSort = (sortKey: string) => {
    if (onSort) {
      onSort(sortKey);
    }
  };

  const headerClassName = cx('rdt-table__header-cell', className);
  const headerProps = {
    scope: 'col' as const,
    className: headerClassName,
    ...(rowSpan !== undefined ? { rowSpan } : {}),
  };

  return column.sortKey ? (
    <SortableHeaderClient
      sortKey={column.sortKey}
      currentSortKey={currentSortKey}
      currentDirection={currentDirection}
      onSort={handleSort}
      title={column.header}
      headerIcon={column.headerIcon}
      className={headerClassName}
      rowSpan={rowSpan}
    />
  ) : (
    <th key={column.header} {...headerProps}>
      <span className="rdt-table__header-label">
        {column.headerIcon}
        {column.header}
      </span>
    </th>
  );
};
