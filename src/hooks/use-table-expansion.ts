'use client';

import { useCallback, useState } from 'react';

import type { BaseTableRow, TableExpansion } from '../components/data-table/types.ts';

export interface UseTableExpansionOptions<TData extends BaseTableRow> {
  /** Rows that can't be expanded get no button. Defaults to every row. */
  isRowExpandable?: (row: TData) => boolean;
  /** Rows open on the first render. */
  initialExpandedIds?: TData['id'][];
}

/**
 * Which rows are expanded. Pass the result to `DataTable`'s `expansion` prop as
 * it is; without one, the table keeps this state itself. Hold it here to keep
 * rows open across a refetch, or to open one from outside the table.
 */
export const useTableExpansion = <TData extends BaseTableRow = BaseTableRow>({
  isRowExpandable,
  initialExpandedIds,
}: UseTableExpansionOptions<TData> = {}) => {
  const [expandedIds, setExpandedIds] = useState<TData['id'][]>(initialExpandedIds ?? []);

  const isRowExpanded = useCallback((row: TData) => expandedIds.includes(row.id), [expandedIds]);

  const onToggleRow = useCallback(
    (row: TData) => {
      if (isRowExpandable && !isRowExpandable(row)) {
        return;
      }
      setExpandedIds(prev =>
        prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id]
      );
    },
    [isRowExpandable]
  );

  const collapseAll = useCallback(() => setExpandedIds([]), []);

  return {
    isRowExpanded,
    isRowExpandable,
    onToggleRow,
    expandedIds,
    setExpandedIds,
    collapseAll,
  } satisfies TableExpansion<TData> & {
    expandedIds: TData['id'][];
    setExpandedIds: (ids: TData['id'][]) => void;
    collapseAll: () => void;
  };
};
