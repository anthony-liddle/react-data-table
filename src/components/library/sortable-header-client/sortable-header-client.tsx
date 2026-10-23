'use client';

import type { ReactNode } from 'react';

import { cx } from '../../../lib/cx.ts';
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
      className={cx('rdt-sort-header', sticky && 'rdt-sort-header--sticky', className)}
      {...(rowSpan !== undefined ? { rowSpan } : {})}
    >
      {disabled ? (
        <div className="rdt-sort-header__content">
          {headerIcon}
          <span className="rdt-sort-header__label">{title || children}</span>
        </div>
      ) : (
        <button type="button" onClick={handleClick} className="rdt-sort-header__button">
          {headerIcon}
          <span className="rdt-sort-header__label">{title || children}</span>
          <span
            aria-hidden="true"
            className="rdt-sort-header__icon"
            data-direction={(isActive && sortDirection) || undefined}
          >
            {(!isActive || sortDirection === null) && <SwapVert />}
            {isActive && sortDirection === 'asc' && <ArrowDownward />}
            {isActive && sortDirection === 'desc' && <ArrowUpward />}
          </span>
        </button>
      )}
    </th>
  );
};
