'use client';

import { type DataTableLabels, resolveLabels } from '../../labels.ts';
import { cx } from '../../lib/cx.ts';
import { KeyboardArrowLeft, KeyboardArrowRight } from '../icon.tsx';
import { Button } from '../ui/button.tsx';

interface PaginationClientProps {
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  handleNextPage: () => void;
  handlePreviousPage: () => void;
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

export const PaginationClient = ({
  totalCount = 0,
  pageIndex = 0,
  pageSize,
  hasNextPage,
  hasPreviousPage,
  handleNextPage,
  handlePreviousPage,
  className,
  showPageCount = false,
  labels,
}: PaginationClientProps) => {
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
          onClick={handlePreviousPage}
          aria-label="Previous page"
          data-test-id={showPageCount ? 'btn.pagination.previous' : undefined}
        >
          <KeyboardArrowLeft className="rdt-pagination__icon" />
        </Button>
        <Button
          variant={showPageCount ? 'outline' : 'ghost'}
          className="rdt-pagination__button"
          disabled={!hasNextPage}
          onClick={handleNextPage}
          aria-label="Next page"
          data-test-id={showPageCount ? 'btn.pagination.next' : undefined}
        >
          <KeyboardArrowRight className="rdt-pagination__icon" />
        </Button>
      </div>
    </div>
  );
};
