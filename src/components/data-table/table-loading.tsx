import { Skeleton } from '../ui/skeleton.tsx';
import type { BaseTableRow, TableColumn } from './types.ts';

interface TableLoadingProps<TData extends BaseTableRow> {
  visibleColumnsData: TableColumn<TData>[];
  hasSelection: boolean;
  hasActionMenu: boolean;
  rowCount?: number;
}

// Helper function to get the correct visible column index
// This function maps the actual column index (including selection/action menu columns)
// to the corresponding visible column index for proper loadingCell rendering.
//
// Example with 3 visible columns + selection + action menu:
// colIndex:    0    1    2    3    4
// Column:   [Sel] [Col0][Col1][Col2][Act]
// visibleIndex: -1    0    1    2   -1
//
// Returns -1 for special columns (selection/action menu) that don't have loadingCell
const getVisibleColumnIndex = (
  colIndex: number,
  hasSelection: boolean,
  hasActionMenu: boolean,
  visibleColumnsLength: number
) => {
  let visibleColumnIndex = colIndex;

  // If this is a selection column, return -1 to indicate it's not a visible column
  if (hasSelection && colIndex === 0) {
    return -1;
  }

  // If this is an action menu column, return -1 to indicate it's not a visible column
  if (
    hasActionMenu
    && colIndex === visibleColumnsLength + (hasSelection ? 1 : 0) + (hasActionMenu ? 1 : 0) - 1
  ) {
    return -1;
  }

  // Adjust the visible column index based on what's before this column
  if (hasSelection) {
    visibleColumnIndex = colIndex - 1;
  }

  return visibleColumnIndex;
};

// Helper function to render loading cells
const renderLoadingCell = <TData extends BaseTableRow>(
  colIndex: number,
  colSpan: number,
  hasSelection: boolean,
  hasActionMenu: boolean,
  visibleColumnsData: TableColumn<TData>[]
) => {
  const visibleColumnIndex = getVisibleColumnIndex(
    colIndex,
    hasSelection,
    hasActionMenu,
    visibleColumnsData.length
  );

  // Selection column
  if (visibleColumnIndex === -1 && hasSelection && colIndex === 0) {
    return (
      <td
        key={`cell-loading-${colIndex}`}
        className="rdt-table__cell rdt-table__cell--select rdt-table__cell--sticky"
      >
        <Skeleton className="rdt-skeleton--select" />
      </td>
    );
  }

  // Action menu column
  if (visibleColumnIndex === -1 && hasActionMenu && colIndex === colSpan - 1) {
    return (
      <td
        key={`cell-loading-${colIndex}`}
        className="rdt-table__cell rdt-table__cell--actions rdt-table__cell--sticky"
      >
        <Skeleton className="rdt-skeleton--action" />
      </td>
    );
  }

  // Regular column with possible loading cell
  const visibleColumn = visibleColumnsData[visibleColumnIndex];
  return (
    <td
      key={`cell-loading-${colIndex}`}
      className="rdt-table__cell"
      colSpan={colIndex === colSpan - 1 && !hasActionMenu ? 2 : 1}
    >
      {visibleColumn?.loadingCell ? (
        visibleColumn.loadingCell()
      ) : (
        <Skeleton className="rdt-skeleton--cell" />
      )}
    </td>
  );
};

export const TableLoading = <TData extends BaseTableRow>({
  visibleColumnsData,
  hasSelection,
  hasActionMenu,
  rowCount = 10,
}: TableLoadingProps<TData>) => {
  const colSpan = visibleColumnsData.length + (hasSelection ? 1 : 0) + (hasActionMenu ? 1 : 0);

  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <tr key={`row-${rowIndex}`} className="rdt-table__row">
          {Array.from({ length: colSpan }).map((_, colIndex) =>
            renderLoadingCell<TData>(
              colIndex,
              colSpan,
              hasSelection,
              hasActionMenu,
              visibleColumnsData
            )
          )}
        </tr>
      ))}
    </>
  );
};
