'use client';

import type { ReactNode } from 'react';

import { cx } from '../../../lib/cx.ts';
import { ArrowDownward, ArrowUpward, SwapVert } from '../../icon.tsx';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderClientProps {
  children?: ReactNode;
  title?: string;
  headerIcon?: ReactNode;
  sortKey: string;
  currentSortKey?: string | null;
  currentDirection?: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  sticky?: boolean;
  disabled?: boolean;
  rowSpan?: number;
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
}: SortableHeaderClientProps) => {
  const isActive = currentSortKey === sortKey;
  // A value outside the type (an uppercase enum cast through, say) shows as unsorted.
  const sortDirection =
    currentDirection === 'asc' || currentDirection === 'desc' ? currentDirection : null;

  const handleClick = () => {
    if (!disabled) {
      onSort(sortKey);
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
          {/* The button spans the cell; the content follows the header's
              text-align, so a column's alignment class moves it. */}
          <span className="rdt-sort-header__content">
            {headerIcon}
            <span className="rdt-sort-header__label">{title || children}</span>
            <span
              aria-hidden="true"
              className="rdt-sort-header__icon"
              data-direction={(isActive && sortDirection) || undefined}
            >
              {(!isActive || sortDirection === null) && (
                <SwapVert className="rdt-sort-header__arrow" />
              )}
              {isActive && sortDirection === 'asc' && (
                <ArrowDownward className="rdt-sort-header__arrow" />
              )}
              {isActive && sortDirection === 'desc' && (
                <ArrowUpward className="rdt-sort-header__arrow" />
              )}
            </span>
          </span>
        </button>
      )}
    </th>
  );
};
