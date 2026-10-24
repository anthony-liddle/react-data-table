'use client';

import { useCallback, useState } from 'react';

import type { BaseTableRow } from '../components/data-table/types.ts';

export interface UseTableSelectionOptions<T> {
  isRowDisabled?: (row: T) => boolean;
  initialSelection?: T[];
}

/**
 * Selection state for `DataTable`. The result is the `selection` prop as it
 * is, plus the selected rows and ways to change them from outside the table.
 */
export const useTableSelection = <T extends BaseTableRow>(
  data: T[],
  options?: UseTableSelectionOptions<T>
) => {
  const { isRowDisabled, initialSelection } = options ?? {};
  const [selectedRows, setSelectedRows] = useState<T[]>(initialSelection ?? []);

  const isRowSelected = useCallback(
    (row: T) => selectedRows.some(selectedRow => selectedRow.id === row.id),
    [selectedRows]
  );

  const findRowInSelection = useCallback(
    (row: T) => selectedRows.find(selectedRow => selectedRow.id === row.id),
    [selectedRows]
  );

  const onToggleRow = useCallback((row: T) => {
    setSelectedRows(prev =>
      prev.some(selectedRow => selectedRow.id === row.id)
        ? prev.filter(selectedRow => selectedRow.id !== row.id)
        : [...prev, row]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const onToggleAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        clearSelection();
        return;
      }
      setSelectedRows(prev => {
        // Keyed by id so a row already selected is kept once, as its latest version.
        const byId = new Map<T['id'], T>(prev.map(row => [row.id, row]));
        for (const row of data) {
          if (!isRowDisabled?.(row)) {
            byId.set(row.id, row);
          }
        }
        return Array.from(byId.values());
      });
    },
    [data, isRowDisabled, clearSelection]
  );

  return {
    selectedRows,
    isRowSelected,
    isRowDisabled,
    onToggleRow,
    onToggleAll,
    clearSelection,
    setSelectedRows,
    findRowInSelection,
  };
};
