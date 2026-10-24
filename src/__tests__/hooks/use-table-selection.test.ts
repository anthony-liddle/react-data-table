import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TableSelection } from '@/components/data-table/types';
import { useTableSelection } from '@/hooks/use-table-selection';

interface Row {
  id: string;
  name: string;
  locked?: boolean;
}

const rows: Row[] = [
  { id: 'a', name: 'Ada' },
  { id: 'b', name: 'Bram', locked: true },
  { id: 'c', name: 'Cleo' },
];
const isLocked = (row: Row) => row.locked === true;

describe('useTableSelection', () => {
  it('returns an object the selection prop takes as it is', () => {
    const { result } = renderHook(() => useTableSelection(rows, { isRowDisabled: isLocked }));
    const prop: TableSelection<Row> = result.current;
    expect(prop.isRowDisabled).toBe(isLocked);
  });

  it('toggles a row in and out of the selection', () => {
    const { result } = renderHook(() => useTableSelection(rows));
    act(() => result.current.onToggleRow(rows[0] as Row));
    expect(result.current.selectedRows).toEqual([rows[0]]);
    expect(result.current.isRowSelected(rows[0] as Row)).toBe(true);

    act(() => result.current.onToggleRow(rows[0] as Row));
    expect(result.current.selectedRows).toEqual([]);
  });

  it('selects every enabled row, and clears them all', () => {
    const { result } = renderHook(() => useTableSelection(rows, { isRowDisabled: isLocked }));
    act(() => result.current.onToggleAll(true));
    expect(result.current.selectedRows.map(row => row.id)).toEqual(['a', 'c']);

    act(() => result.current.onToggleAll(false));
    expect(result.current.selectedRows).toEqual([]);

    act(() => result.current.onToggleAll(true));
    act(() => result.current.clearSelection());
    expect(result.current.selectedRows).toEqual([]);
  });

  it('keeps a change made earlier in the same handler when selecting all', () => {
    const offPage: Row = { id: 'z', name: 'Zed' };
    const { result } = renderHook(() => useTableSelection(rows));
    act(() => {
      result.current.setSelectedRows([offPage]);
      result.current.onToggleAll(true);
    });
    expect(result.current.selectedRows.map(row => row.id)).toEqual(['z', 'a', 'b', 'c']);
  });

  it('starts from initialSelection and can be replaced with setSelectedRows', () => {
    const { result } = renderHook(() =>
      useTableSelection(rows, { initialSelection: [rows[2] as Row] })
    );
    expect(result.current.selectedRows).toEqual([rows[2]]);

    act(() => result.current.setSelectedRows([rows[0] as Row]));
    expect(result.current.findRowInSelection({ id: 'a', name: 'renamed' })).toBe(rows[0]);
  });
});
