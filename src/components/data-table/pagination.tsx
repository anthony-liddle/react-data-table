'use client';

import { type DataTableLabels, resolveLabels } from '../../labels.ts';
import { cx } from '../../lib/cx.ts';
import { KeyboardArrowLeft, KeyboardArrowRight } from '../icon.tsx';
import { Button } from '../ui/button.tsx';

interface PaginationProps {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPage: () => void;
  onPreviousPage: () => void;
  className?: string;
  /**
   * Opt-in: also show a "Page N of M" indicator next to the prev/next controls
   * and render the controls as bordered square icon buttons. Defaults to off so
   * existing tables keep their current footer.
   */
  showPageCount?: boolean;
  /** Override any of the user-facing strings (English defaults). */
  labels?: Partial<DataTableLabels>;
}

export const Pagination = ({
  totalCount = 0,
  pageIndex = 0,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  className,
  showPageCount = false,
  labels,
}: PaginationProps) => {
  const t = resolveLabels(labels);

  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalCount);
  // Derive the total page count from totalCount when available; fall back to 1
  // for the zero-results case.
  const pageCount = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;

  return (
    <div className={cx('rdt-pagination', showPageCount && 'rdt-pagination--bordered', className)}>
      <div className="rdt-pagination__range">
        {t.showingRangeOf({ start, end, total: totalCount })}
      </div>
      <div className="rdt-pagination__controls">
        {showPageCount && (
          <span className="rdt-pagination__page-count">
            {t.page} {pageIndex + 1} {t.of} {pageCount}
          </span>
        )}
        <Button
          variant={showPageCount ? 'outline' : 'ghost'}
          className="rdt-pagination__button"
          disabled={!hasPreviousPage}
          onClick={onPreviousPage}
          aria-label="Previous page"
          data-testid={showPageCount ? 'btn.pagination.previous' : undefined}
        >
          <KeyboardArrowLeft className="rdt-pagination__icon" />
        </Button>
        <Button
          variant={showPageCount ? 'outline' : 'ghost'}
          className="rdt-pagination__button"
          disabled={!hasNextPage}
          onClick={onNextPage}
          aria-label="Next page"
          data-testid={showPageCount ? 'btn.pagination.next' : undefined}
        >
          <KeyboardArrowRight className="rdt-pagination__icon" />
        </Button>
      </div>
    </div>
  );
};
