'use client';

import { type DataTableLabels, resolveLabels } from '../../labels.ts';
import { cn } from '../../lib/shadcn-utils.ts';
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
    <div
      className={cn(
        'flex items-center justify-between px-2 py-2 border-t border-border',
        className
      )}
    >
      <div className="text-sm text-muted-foreground">
        {t.showingRangeOf({ start, end, total: totalCount })}
      </div>
      <div className="flex items-center gap-2">
        {showPageCount && (
          <span className="text-sm text-muted-foreground">
            {t.page} {pageIndex + 1} {t.of} {pageCount}
          </span>
        )}
        {showPageCount ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0"
              disabled={!hasPreviousPage}
              onClick={handlePreviousPage}
              aria-label="Previous page"
              data-test-id="btn.pagination.previous"
            >
              <KeyboardArrowLeft className="size-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0"
              disabled={!hasNextPage}
              onClick={handleNextPage}
              aria-label="Next page"
              data-test-id="btn.pagination.next"
            >
              <KeyboardArrowRight className="size-5" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-12 w-12 p-0"
              disabled={!hasPreviousPage}
              onClick={handlePreviousPage}
              aria-label="Previous page"
            >
              <KeyboardArrowLeft className="h-12 w-12" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-12 w-12 p-0"
              disabled={!hasNextPage}
              onClick={handleNextPage}
              aria-label="Next page"
            >
              <KeyboardArrowRight className="h-12 w-12" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
