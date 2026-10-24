'use client';

import { type KeyboardEvent, type MouseEvent, type ReactNode, useRef } from 'react';

import { cx } from '../../../lib/cx.ts';
import type { SortItem } from '../../data-table/types.ts';
import { ArrowDownward, ArrowUpward, SwapVert } from '../../icon.tsx';

interface SortableHeaderClientProps {
  children?: ReactNode;
  title?: string;
  headerIcon?: ReactNode;
  sortKey: string;
  /** The table's sort, in priority order. */
  sortBy?: SortItem[];
  onSort: (key: string, options: { additive: boolean }) => void;
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
  sortBy = [],
  onSort,
  className,
  sticky = false,
  disabled = false,
  rowSpan,
}: SortableHeaderClientProps) => {
  const index = sortBy.findIndex(item => item.key === sortKey);
  const isActive = index !== -1;
  // A value outside the type (an uppercase enum cast through, say) shows as unsorted.
  const direction = sortBy[index]?.direction;
  const sortDirection = direction === 'asc' || direction === 'desc' ? direction : null;

  // Shift+Enter or Shift+Space adds the column, like Shift+click. Browsers
  // differ on whether a click made from the keyboard carries shiftKey, so the
  // Shift state is taken from the keydown that made it (detail 0).
  const keyboardShift = useRef(false);
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      keyboardShift.current = event.shiftKey;
    }
  };
  const handleClick = (event: MouseEvent) => {
    const additive = event.shiftKey || (event.detail === 0 && keyboardShift.current);
    keyboardShift.current = false;
    if (!disabled) {
      onSort(sortKey, { additive });
    }
  };

  // Only the primary sort column carries aria-sort, as the ARIA pattern allows
  // one per table; the others omit it rather than claiming "none".
  const ariaSort =
    index === 0 && sortDirection
      ? sortDirection === 'asc'
        ? 'ascending'
        : 'descending'
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
        <button
          type="button"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className="rdt-sort-header__button"
        >
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
