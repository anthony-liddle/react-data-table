'use client';

import { SortableHeaderClient } from '../library/sortable-header-client/index.ts';
import type {
  BaseTableRow,
  SortOrder,
  TableColumn,
  SortDirection as TableSortDirection,
} from './types.ts';

interface TableHeaderProps<TData extends BaseTableRow = BaseTableRow> {
  column: TableColumn<TData>;
  currentSortKey?: string | null;
  currentDirection?: TableSortDirection | SortOrder;
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

  const headerProps = {
    scope: 'col' as const,
    className,
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
      className={className}
      rowSpan={rowSpan}
    />
  ) : (
    <th key={column.header} {...headerProps}>
      <span className="inline-flex items-center gap-1">
        {column.headerIcon}
        {column.header}
      </span>
    </th>
  );
};
