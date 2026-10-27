import { act, renderHook } from '@testing-library/react';
import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { TableSelection } from '@/components/data-table/types';
import { useTableDragSelection } from '@/hooks/use-table-drag-selection';

// The hook reports each row's place in an in-progress drag as plain state;
// DataTable turns it into data-drag-* attributes for the stylesheet.

interface Row {
  id: string;
  [key: string]: unknown;
}

const rows: Row[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

const selection: TableSelection<Row> = {
  onToggleRow: () => {},
  onToggleAll: () => {},
  isRowSelected: () => false,
};

// A press that lands on a plain cell of the row, not a checkbox or button.
const pressedRow = document.createElement('tr');
const pressOnCell = {
  target: pressedRow.appendChild(document.createElement('td')),
  currentTarget: pressedRow,
} as unknown as MouseEvent<HTMLTableRowElement>;

const render = () => renderHook(() => useTableDragSelection({ data: rows, selection }));

describe('useTableDragSelection drag state', () => {
  it('reports no range until the drag moves to another row', () => {
    const { result } = render();
    act(() => result.current.handleRowMouseDown(pressOnCell, 0));

    expect(result.current.isDragActive).toBe(false);
    for (const index of [0, 1, 2]) {
      expect(result.current.getRowDragState(index).inRange).toBe(false);
    }
  });

  it('reports the range, its start and its end once the drag crosses rows', () => {
    const { result } = render();
    act(() => result.current.handleRowMouseDown(pressOnCell, 0));
    act(() => result.current.handleRowMouseEnter(2));

    expect(result.current.isDragActive).toBe(true);
    expect(result.current.getRowDragState(0)).toEqual({
      inRange: true,
      isStart: true,
      isEnd: false,
    });
    expect(result.current.getRowDragState(1)).toEqual({
      inRange: true,
      isStart: false,
      isEnd: false,
    });
    expect(result.current.getRowDragState(2)).toEqual({
      inRange: true,
      isStart: false,
      isEnd: true,
    });
  });

  it('keeps the start row in range when the drag returns to it', () => {
    const { result } = render();
    act(() => result.current.handleRowMouseDown(pressOnCell, 0));
    act(() => result.current.handleRowMouseEnter(2));
    act(() => result.current.handleRowMouseEnter(0));

    // Back on its own row, the drag no longer spans rows, but the row it
    // started on stays highlighted until release.
    expect(result.current.isDragActive).toBe(false);
    expect(result.current.getRowDragState(0)).toEqual({
      inRange: true,
      isStart: false,
      isEnd: false,
    });
  });

  it('clears the drag state when the pointer leaves the table', () => {
    const { result } = render();
    act(() => result.current.handleRowMouseDown(pressOnCell, 0));
    act(() => result.current.handleRowMouseEnter(1));
    act(() => result.current.handleTableMouseLeave());

    expect(result.current.isDragActive).toBe(false);
    expect(result.current.getRowDragState(1).inRange).toBe(false);
  });
});

// A table that the page's React renders into a popout window or an iframe
// lives in another document, which has its own events and text selection.
describe('useTableDragSelection in another document', () => {
  const popout = () => {
    const doc = document.implementation.createHTMLDocument('popout');
    const row = doc.createElement('tr');
    const press = {
      target: row.appendChild(doc.createElement('td')),
      currentTarget: row,
    } as unknown as MouseEvent<HTMLTableRowElement>;
    return { doc, press };
  };

  it("ends the drag on a release anywhere in the table's document", () => {
    const { doc, press } = popout();
    const { result } = render();
    act(() => result.current.handleRowMouseDown(press, 0));
    expect(result.current.isDragging).toBe(true);

    act(() => {
      doc.dispatchEvent(new MouseEvent('mouseup'));
    });
    expect(result.current.isDragging).toBe(false);
  });

  it("clears the text selection in the table's document", () => {
    const { doc, press } = popout();
    const removeAllRanges = vi.fn();
    vi.spyOn(doc, 'getSelection').mockReturnValue({
      removeAllRanges,
      toString: () => 'selected text',
    } as unknown as Selection);
    const { result } = render();
    act(() => result.current.handleRowMouseDown(press, 0));
    act(() => result.current.handleRowMouseEnter(1));

    expect(removeAllRanges).toHaveBeenCalled();
  });
});
