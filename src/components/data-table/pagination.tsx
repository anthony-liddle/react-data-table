'use client';

import { type DataTableLabels, resolveLabels } from '../../labels.ts';
import { cx } from '../../lib/cx.ts';
import { KeyboardArrowLeft, KeyboardArrowRight } from '../icon.tsx';
import { Button } from '../ui/button.tsx';

interface PaginationProps {
  /**
   * Rows across every page. Without it the footer shows the page's range only
   * ("Showing 11-20"), drops "Page N of M", and Next follows `hasNextPage`. A
   * negative or non-finite total counts as none.
   */
  totalCount?: number | null;
  /**
   * Rows on this page, which ends the range when there is no total. Defaults to
   * a full page. `DataTable` passes its row count, or nothing while loading.
   */
  pageRowCount?: number;
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
  totalCount,
  pageRowCount,
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

  // A negative or non-finite total (an API's -1 for "unknown") counts as none. A
  // numeric string, such as node-postgres's count(*), counts as its number.
  const asNumber = totalCount == null ? Number.NaN : Number(totalCount);
  const total = Number.isFinite(asNumber) && asNumber >= 0 ? asNumber : null;
  const first = pageIndex * pageSize + 1;
  const last =
    total == null
      ? first + (pageRowCount ?? pageSize) - 1
      : Math.min((pageIndex + 1) * pageSize, total);
  // A page with no rows (no results, or a page past the end) reads 0 to 0.
  const [start, end] = last < first ? [0, 0] : [first, last];
  // The total page count, with 1 for the zero-results case.
  const pageCount = total ? Math.ceil(total / pageSize) : 1;

  return (
    <div className={cx('rdt-pagination', showPageCount && 'rdt-pagination--bordered', className)}>
      <div className="rdt-pagination__range">
        {total == null ? t.showingRange({ start, end }) : t.showingRangeOf({ start, end, total })}
      </div>
      <div className="rdt-pagination__controls">
        {showPageCount && total != null && (
          <span className="rdt-pagination__page-count">
            {t.pageOf({ page: pageIndex + 1, pageCount })}
          </span>
        )}
        <Button
          variant={showPageCount ? 'outline' : 'ghost'}
          className="rdt-pagination__button"
          disabled={!hasPreviousPage}
          onClick={onPreviousPage}
          aria-label={t.previousPage}
          data-testid={showPageCount ? 'btn.pagination.previous' : undefined}
        >
          <KeyboardArrowLeft className="rdt-pagination__icon" />
        </Button>
        <Button
          variant={showPageCount ? 'outline' : 'ghost'}
          className="rdt-pagination__button"
          disabled={!hasNextPage}
          onClick={onNextPage}
          aria-label={t.nextPage}
          data-testid={showPageCount ? 'btn.pagination.next' : undefined}
        >
          <KeyboardArrowRight className="rdt-pagination__icon" />
        </Button>
      </div>
    </div>
  );
};
