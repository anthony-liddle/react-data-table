'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { BaseTableRow, TableSelection } from '../components/data-table/types.ts';

interface UseTableDragSelectionProps<TData extends BaseTableRow> {
  data: TData[];
  selection?: TableSelection<TData>;
  selectOnRowClick?: boolean;
}

export interface UseTableDragSelectionReturn<TData extends BaseTableRow> {
  dragStartRowIndex: number | null;
  isDragging: boolean;
  dragEndRowIndex: number | null;
  isDragConfirmed: boolean;
  handleRowClick: (e: React.MouseEvent<HTMLTableRowElement>, row: TData) => void;
  handleRowMouseDown: (e: React.MouseEvent<HTMLTableRowElement>, rowIndex: number) => void;
  handleRowMouseUp: (e: React.MouseEvent<HTMLTableRowElement>, rowIndex: number) => void;
  handleRowMouseEnter: (rowIndex: number) => void;
  handleTableMouseLeave: () => void;
  isRowInDragRange: (rowIndex: number) => boolean;
  getRowClassName: (rowIndex: number) => string;
}

export function useTableDragSelection<TData extends BaseTableRow>({
  data,
  selection,
  selectOnRowClick = false,
}: UseTableDragSelectionProps<TData>): UseTableDragSelectionReturn<TData> {
  const [dragStartRowIndex, setDragStartRowIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragEndRowIndex, setDragEndRowIndex] = useState<number | null>(null);
  const [isDragConfirmed, setIsDragConfirmed] = useState(false);
  const wasDragSelectionPerformedRef = useRef(false);

  // Range selection helper function
  const selectRange = useCallback(
    (startIndex: number, endIndex: number) => {
      if (!selection) {
        return;
      }

      const start = Math.min(startIndex, endIndex);
      const end = Math.max(startIndex, endIndex);
      const rowsToSelect = data.slice(start, end + 1);

      // Select all rows in range, skipping disabled rows
      rowsToSelect.forEach((row: TData) => {
        const isDisabled = selection.isRowDisabled?.(row) ?? false;
        if (!isDisabled && !selection.isRowSelected(row)) {
          selection.handleSelectRow(row);
        }
      });
    },
    [data, selection]
  );

  // Handle mouse down on row - start drag selection
  const handleRowMouseDown = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, rowIndex: number) => {
      // Don't start drag if clicking on checkbox or action menu
      const target = e.target as HTMLElement;
      if (
        target.closest('input[type="checkbox"]')
        || target.closest('button')
        || target.closest('[role="menu"]')
        || !selection
      ) {
        return;
      }

      // Don't start drag from a disabled row
      const row = data[rowIndex];
      if (row && selection.isRowDisabled?.(row)) {
        return;
      }

      setDragStartRowIndex(rowIndex);
      setIsDragging(true);
      setDragEndRowIndex(rowIndex);
      setIsDragConfirmed(false);
      wasDragSelectionPerformedRef.current = false;
    },
    [selection, data]
  );

  // Handle mouse up on row - complete drag selection
  const handleRowMouseUp = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, rowIndex: number) => {
      if (!isDragging || dragStartRowIndex === null || !selection) {
        setIsDragConfirmed(false);
        return;
      }

      // Use dragEndRowIndex to match visual feedback, fallback to rowIndex if null
      const finalEndIndex = dragEndRowIndex ?? rowIndex;

      // Only select rows if drag was confirmed (mouse moved to different row)
      // This allows text selection to work when dragging within the same row
      if (isDragConfirmed && finalEndIndex !== dragStartRowIndex) {
        e.preventDefault();
        selectRange(dragStartRowIndex, finalEndIndex);
        wasDragSelectionPerformedRef.current = true;
      } else {
        wasDragSelectionPerformedRef.current = false;
      }

      setIsDragging(false);
      setDragStartRowIndex(null);
      setDragEndRowIndex(null);
      setIsDragConfirmed(false);
    },
    [isDragging, dragStartRowIndex, dragEndRowIndex, isDragConfirmed, selection, selectRange]
  );

  // Handle mouse enter on row - update drag end position for visual feedback
  const handleRowMouseEnter = useCallback(
    (rowIndex: number) => {
      if (isDragging && dragStartRowIndex !== null) {
        // Confirm drag if mouse moved to a different row
        if (rowIndex !== dragStartRowIndex) {
          setIsDragConfirmed(true);
          // Clear any text selection when row drag is confirmed
          const textSelection = window.getSelection();
          if (textSelection) {
            textSelection.removeAllRanges();
          }
        }
        setDragEndRowIndex(rowIndex);
      }
    },
    [isDragging, dragStartRowIndex]
  );

  // Handle mouse leave from table - cancel drag
  const handleTableMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartRowIndex(null);
      setDragEndRowIndex(null);
      setIsDragConfirmed(false);
    }
  }, [isDragging]);

  // Handle global mouse up to cancel drag if mouse leaves table
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartRowIndex(null);
        setDragEndRowIndex(null);
        setIsDragConfirmed(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  // Clear text selection when drag is confirmed and mouse moved to different row
  useEffect(() => {
    if (
      isDragConfirmed
      && dragStartRowIndex !== null
      && dragEndRowIndex !== null
      && dragStartRowIndex !== dragEndRowIndex
    ) {
      const textSelection = window.getSelection();
      if (textSelection && textSelection.toString().length > 0) {
        textSelection.removeAllRanges();
      }
    }
  }, [isDragConfirmed, dragStartRowIndex, dragEndRowIndex]);

  // Check if row is in drag range for visual feedback
  const isRowInDragRange = useCallback(
    (rowIndex: number) => {
      if (!isDragging || dragStartRowIndex === null || dragEndRowIndex === null) {
        return false;
      }
      const start = Math.min(dragStartRowIndex, dragEndRowIndex);
      const end = Math.max(dragStartRowIndex, dragEndRowIndex);
      return rowIndex >= start && rowIndex <= end;
    },
    [isDragging, dragStartRowIndex, dragEndRowIndex]
  );

  // Check if row is the start of drag range
  const isDragStartRow = useCallback(
    (rowIndex: number) => {
      return isDragging && dragStartRowIndex === rowIndex;
    },
    [isDragging, dragStartRowIndex]
  );

  // Check if row is the end of drag range
  const isDragEndRow = useCallback(
    (rowIndex: number) => {
      return isDragging && dragEndRowIndex === rowIndex;
    },
    [isDragging, dragEndRowIndex]
  );

  // Get className for row based on drag state
  const getRowClassName = useCallback(
    (rowIndex: number) => {
      if (!selection) {
        return '';
      }

      const classes: string[] = [];

      // Only apply drag-selection-dragging class when drag is confirmed AND mouse moved to different row
      // The user-select: none will only apply when we're actively dragging across rows
      if (isDragging && isDragConfirmed && dragStartRowIndex !== dragEndRowIndex) {
        classes.push('drag-selection-dragging');
      }

      if (isDragging && isDragConfirmed && isRowInDragRange(rowIndex)) {
        classes.push('drag-selection-range');
        if (isDragStartRow(rowIndex) && dragStartRowIndex !== dragEndRowIndex) {
          classes.push('drag-selection-range-start');
        }
        if (isDragEndRow(rowIndex) && dragStartRowIndex !== dragEndRowIndex) {
          classes.push('drag-selection-range-end');
        }
      } else if (!isDragging) {
        classes.push('cursor-pointer');
      }

      return classes.join(' ');
    },
    [
      selection,
      isDragging,
      isDragConfirmed,
      isRowInDragRange,
      isDragStartRow,
      isDragEndRow,
      dragStartRowIndex,
      dragEndRowIndex,
    ]
  );

  // Check if drag selection was performed and clear the flag atomically
  const checkAndClearDragSelection = useCallback(() => {
    const wasPerformed = wasDragSelectionPerformedRef.current;
    wasDragSelectionPerformedRef.current = false;
    return wasPerformed;
  }, []);

  // Handle row click - toggle selection if enabled and not clicking on interactive elements
  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, row: TData) => {
      if (!selectOnRowClick || !selection) {
        return;
      }

      // Don't select if clicking on checkbox, button, or action menu
      const target = e.target as HTMLElement;
      if (
        target.closest('input[type="checkbox"]')
        || target.closest('button')
        || target.closest('[role="menu"]')
      ) {
        return;
      }

      // Don't select disabled rows
      if (selection.isRowDisabled?.(row)) {
        return;
      }

      // Only perform click selection if a drag selection didn't just occur
      // checkAndClearDragSelection atomically checks and resets the flag
      if (!checkAndClearDragSelection()) {
        selection.handleSelectRow(row);
      }
    },
    [selectOnRowClick, selection, checkAndClearDragSelection]
  );

  return {
    dragStartRowIndex,
    isDragging,
    dragEndRowIndex,
    isDragConfirmed,
    handleRowClick,
    handleRowMouseDown,
    handleRowMouseUp,
    handleRowMouseEnter,
    handleTableMouseLeave,
    isRowInDragRange,
    getRowClassName,
  };
}
