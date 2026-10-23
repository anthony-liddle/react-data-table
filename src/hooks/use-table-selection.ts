'use client';

import { useCallback, useState } from 'react';

export interface BaseTableSelection {
  id: string | number;
  [key: string]: unknown;
}

export interface UseTableSelectionOptions<T> {
  isRowDisabled?: (row: T) => boolean;
  initialSelection?: T[];
}

export const useTableSelection = <T extends BaseTableSelection>(
  data: T[],
  options?: UseTableSelectionOptions<T>
) => {
  const { isRowDisabled, initialSelection } = options ?? {};
  const [selection, setSelection] = useState<T[]>(initialSelection ?? []);

  const isRowSelected = useCallback(
    (row: T) => {
      return selection.some(selectedRow => selectedRow.id === row.id);
    },
    [selection]
  );

  const findRowInSelection = useCallback(
    (row: T) => {
      return selection.find(selectedRow => selectedRow.id === row.id);
    },
    [selection]
  );

  const selectRow = useCallback((row: T) => {
    setSelection(prev => {
      const isSelected = prev.some(selectedRow => selectedRow.id === row.id);
      if (isSelected) {
        return prev.filter(selectedRow => selectedRow.id !== row.id);
      } else {
        return [...prev, row];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    // Use a Map to deduplicate by ID, keeping the latest version of each row
    const selectionMap = new Map<string | number, T>();

    // First add existing selections
    selection.forEach(row => {
      selectionMap.set(row.id, row);
    });

    // Then add all data rows, overwriting any existing selections with the latest version
    // Skip disabled rows
    data.forEach(row => {
      const rowIsDisabled = isRowDisabled?.(row) ?? false;
      if (!rowIsDisabled) {
        selectionMap.set(row.id, row);
      }
    });

    setSelection(Array.from(selectionMap.values()));
  }, [data, selection, isRowDisabled]);

  const deselectAll = useCallback(() => {
    setSelection([]);
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        selectAll();
      } else {
        deselectAll();
      }
    },
    [selectAll, deselectAll]
  );

  return {
    selection,
    handleSelectAll,
    handleSelectRow: selectRow,
    handleDeselectAll: deselectAll,
    isRowSelected,
    findRowInSelection,
    setSelection,
  };
};
