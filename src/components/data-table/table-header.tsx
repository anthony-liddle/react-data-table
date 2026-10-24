'use client';

import type { DataTableLabels } from '../../labels.ts';
import { cx } from '../../lib/cx.ts';
import { SortableHeaderClient } from '../library/sortable-header-client/index.ts';
import type { BaseTableRow, SortItem, TableColumn } from './types.ts';

interface TableHeaderProps<TData extends BaseTableRow = BaseTableRow> {
  column: TableColumn<TData>;
  sortBy?: SortItem[];
  onSort?: (key: string, options: { additive: boolean }) => void;
  labels?: DataTableLabels;
  className: string;
  rowSpan?: number;
}

export const TableHeader = <TData extends BaseTableRow = BaseTableRow>({
  column,
  sortBy,
  onSort,
  labels,
  className,
  rowSpan,
}: TableHeaderProps<TData>) => {
  const handleSort = (key: string, options: { additive: boolean }) => {
    onSort?.(key, options);
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
      sortBy={sortBy}
      onSort={handleSort}
      labels={labels}
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
