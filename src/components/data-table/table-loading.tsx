import { Skeleton } from '../ui/skeleton.tsx';
import type { TableLayout } from './layout.ts';
import type { BaseTableRow, TableColumn } from './types.ts';

interface TableLoadingProps<TData extends BaseTableRow> {
  visibleColumnsData: TableColumn<TData>[];
  /** The columns around the data columns, as the table lays them out. */
  layout: TableLayout;
  rowCount?: number;
}

/** Skeleton rows with the same cells as the table's rows. */
export const TableLoading = <TData extends BaseTableRow>({
  visibleColumnsData,
  layout,
  rowCount = 10,
}: TableLoadingProps<TData>) => (
  <>
    {Array.from({ length: rowCount }).map((_, rowIndex) => (
      <tr key={`row-${rowIndex}`} className="rdt-table__row">
        {layout.expand && (
          <td className="rdt-table__cell rdt-table__cell--expand rdt-table__cell--sticky" />
        )}
        {layout.select && (
          <td className="rdt-table__cell rdt-table__cell--select rdt-table__cell--sticky">
            <Skeleton className="rdt-skeleton--select" />
          </td>
        )}
        {visibleColumnsData.map(column => (
          <td key={column.id} className="rdt-table__cell">
            {column.loadingCell ? (
              column.loadingCell()
            ) : (
              <Skeleton className="rdt-skeleton--cell" />
            )}
          </td>
        ))}
        {layout.trailing === 'actions' && (
          <td className="rdt-table__cell rdt-table__cell--actions rdt-table__cell--sticky">
            <Skeleton className="rdt-skeleton--action" />
          </td>
        )}
        {layout.trailing === 'settings' && (
          <td className="rdt-table__cell rdt-table__cell--settings rdt-table__cell--sticky" />
        )}
      </tr>
    ))}
  </>
);
