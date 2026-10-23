'use client';

import type { ReactNode } from 'react';

import { cn } from '../../../lib/shadcn-utils.ts';
import type { SortOrder } from '../../data-table/types.ts';
import { ArrowDownward, ArrowUpward, SwapVert } from '../../icon.tsx';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderClientProps {
  children?: ReactNode;
  title?: string;
  headerIcon?: ReactNode;
  sortKey: string;
  currentSortKey?: string | null;
  currentDirection?: SortDirection | SortOrder;
  onSort: (key: string) => void;
  className?: string;
  sticky?: boolean;
  disabled?: boolean;
  rowSpan?: number;
  /**
   * Called when the sort handler throws. Route it to your own error reporter;
   * defaults to console.error.
   */
  onSortError?: (context: string, error: unknown, extra?: Record<string, unknown>) => void;
}

/**
 * A sortable header component for client-side only and that works without navigation
 */
export const SortableHeaderClient = ({
  children,
  title,
  headerIcon,
  sortKey,
  currentSortKey,
  currentDirection = null,
  onSort,
  className,
  sticky = false,
  disabled = false,
  rowSpan,
  onSortError = (context, error, extra) => console.error(context, error, extra),
}: SortableHeaderClientProps) => {
  const isActive = currentSortKey === sortKey;
  const sortDirection: SortDirection = currentDirection
    ? (currentDirection.toLowerCase() as SortDirection)
    : null;

  const handleClick = () => {
    try {
      if (!disabled) {
        onSort(sortKey);
      }
    } catch (error) {
      onSortError('SortableHeaderClient.handleClick', error, {
        sortKey,
        currentSortKey,
        sortDirection,
      });
    }
  };

  // Only the active column carries aria-sort; the others omit it rather than
  // claiming "none", per the ARIA sortable-table pattern.
  const ariaSort = isActive
    ? sortDirection === 'asc'
      ? 'ascending'
      : sortDirection === 'desc'
        ? 'descending'
        : undefined
    : undefined;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(sticky && 'data-table-sticky', className, 'relative')}
      {...(rowSpan !== undefined ? { rowSpan } : {})}
    >
      {disabled ? (
        <div className="flex items-center gap-1 w-full">
          {headerIcon}
          <span>{title || children}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1 w-full cursor-pointer hover:text-primary bg-transparent border-0 p-0 text-left [font:inherit] text-inherit"
        >
          {headerIcon}
          <span>{title || children}</span>
          <span aria-hidden="true">
            {(!isActive || sortDirection === null) && <SwapVert className="w-4 h-4" />}
            {isActive && sortDirection === 'asc' && <ArrowDownward className="w-3 h-3 font-bold" />}
            {isActive && sortDirection === 'desc' && <ArrowUpward className="w-3 h-3 font-bold" />}
          </span>
        </button>
      )}
    </th>
  );
};
