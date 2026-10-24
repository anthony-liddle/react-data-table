import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { TableExpansion } from '@/components/data-table/types';
import { useTableExpansion } from '@/hooks/use-table-expansion';

interface Row {
  id: string;
  name: string;
}

const ada: Row = { id: 'a', name: 'Ada' };
const bram: Row = { id: 'b', name: 'Bram' };

describe('useTableExpansion', () => {
  it('returns the expansion prop', () => {
    const { result } = renderHook(() => useTableExpansion<Row>());
    const prop: TableExpansion<Row> = result.current;
    expect(prop.isRowExpanded(ada)).toBe(false);
  });

  it('starts from initialExpandedIds', () => {
    const { result } = renderHook(() => useTableExpansion<Row>({ initialExpandedIds: ['a'] }));
    expect(result.current.isRowExpanded(ada)).toBe(true);
    expect(result.current.isRowExpanded(bram)).toBe(false);
    expect(result.current.expandedIds).toEqual(['a']);
  });

  it('toggles a row', () => {
    const { result } = renderHook(() => useTableExpansion<Row>());
    act(() => result.current.onToggleRow(ada));
    expect(result.current.isRowExpanded(ada)).toBe(true);
    act(() => result.current.onToggleRow(ada));
    expect(result.current.isRowExpanded(ada)).toBe(false);
  });

  it('skips rows that are not expandable', () => {
    const isRowExpandable = (row: Row) => row.id !== 'b';
    const { result } = renderHook(() => useTableExpansion<Row>({ isRowExpandable }));
    expect(result.current.isRowExpandable).toBe(isRowExpandable);
    act(() => result.current.onToggleRow(bram));
    expect(result.current.isRowExpanded(bram)).toBe(false);
  });

  it('replaces and collapses all', () => {
    const { result } = renderHook(() => useTableExpansion<Row>());
    act(() => result.current.setExpandedIds(['a', 'b']));
    expect(result.current.isRowExpanded(bram)).toBe(true);
    act(() => result.current.collapseAll());
    expect(result.current.expandedIds).toEqual([]);
  });
});
