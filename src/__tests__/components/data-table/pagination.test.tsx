import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
import { Pagination } from '@/components/data-table/pagination';

describe('Pagination', () => {
  describe('rendering', () => {
    it('should render pagination component', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText(/Showing.*of.*results/)).toBeInTheDocument();
    });

    it('should display correct pagination text for first page', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText('Showing 1-10 of 100 results')).toBeInTheDocument();
    });

    it('should display correct pagination text for middle page', () => {
      const props = {
        totalCount: 100,
        pageIndex: 4,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText('Showing 41-50 of 100 results')).toBeInTheDocument();
    });

    it('should display correct pagination text for last page', () => {
      const props = {
        totalCount: 100,
        pageIndex: 9,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText('Showing 91-100 of 100 results')).toBeInTheDocument();
    });

    it('should display correct pagination text when last page has fewer items', () => {
      const props = {
        totalCount: 95,
        pageIndex: 9,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText('Showing 91-95 of 95 results')).toBeInTheDocument();
    });

    it('should display correct pagination text for empty results', () => {
      const props = {
        totalCount: 0,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText('Showing 0-0 of 0 results')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
        className: 'custom-pagination-class',
      };

      const { container } = render(<Pagination {...props} />);
      const paginationDiv = container.querySelector('.custom-pagination-class');
      expect(paginationDiv).toBeInTheDocument();
    });

    it('should render navigation buttons', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('button states', () => {
    it('should disable previous button on first page', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const previousButton = screen.getByRole('button', { name: 'Previous page' });
      expect(previousButton).toBeDisabled();
    });

    it('should enable previous button when hasPreviousPage is true', () => {
      const props = {
        totalCount: 100,
        pageIndex: 5,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const previousButton = screen.getByRole('button', { name: 'Previous page' });
      expect(previousButton).not.toBeDisabled();
    });

    it('should disable next button on last page', () => {
      const props = {
        totalCount: 100,
        pageIndex: 9,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const nextButton = screen.getByRole('button', { name: 'Next page' });
      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when hasNextPage is true', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const nextButton = screen.getByRole('button', { name: 'Next page' });
      expect(nextButton).not.toBeDisabled();
    });

    it('should disable both buttons when there are no results', () => {
      const props = {
        totalCount: 0,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).toBeDisabled();
    });
  });

  describe('interactions', () => {
    it('should call onNextPage when next button is clicked', async () => {
      const user = userEvent.setup();
      const onNextPage = vi.fn();
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage,
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const nextButton = screen.getByRole('button', { name: 'Next page' });
      await user.click(nextButton);

      expect(onNextPage).toHaveBeenCalledTimes(1);
    });

    it('should call onPreviousPage when previous button is clicked', async () => {
      const user = userEvent.setup();
      const onPreviousPage = vi.fn();
      const props = {
        totalCount: 100,
        pageIndex: 5,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage,
      };

      render(<Pagination {...props} />);

      const previousButton = screen.getByRole('button', { name: 'Previous page' });
      await user.click(previousButton);

      expect(onPreviousPage).toHaveBeenCalledTimes(1);
    });

    it('should not call onNextPage when button is disabled', async () => {
      const user = userEvent.setup();
      const onNextPage = vi.fn();
      const props = {
        totalCount: 100,
        pageIndex: 9,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: true,
        onNextPage,
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const nextButton = screen.getByRole('button', { name: 'Next page' });
      await user.click(nextButton);

      expect(onNextPage).not.toHaveBeenCalled();
    });

    it('should not call onPreviousPage when button is disabled', async () => {
      const user = userEvent.setup();
      const onPreviousPage = vi.fn();
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage,
      };

      render(<Pagination {...props} />);

      const previousButton = screen.getByRole('button', { name: 'Previous page' });
      await user.click(previousButton);

      expect(onPreviousPage).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should read an empty first page as 0 to 0', () => {
      const props = {
        totalCount: 0,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText('Showing 0-0 of 0 results')).toBeInTheDocument();
    });

    it('should handle pageSize of 1', () => {
      const props = {
        totalCount: 5,
        pageIndex: 2,
        pageSize: 1,
        hasNextPage: true,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText('Showing 3-3 of 5 results')).toBeInTheDocument();
    });

    it('should handle large page sizes', () => {
      const props = {
        totalCount: 1000,
        pageIndex: 0,
        pageSize: 100,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      expect(screen.getByText('Showing 1-100 of 1000 results')).toBeInTheDocument();
    });

    it('should handle very large totalCount', () => {
      const props = {
        totalCount: 999999,
        pageIndex: 500,
        pageSize: 1000,
        hasNextPage: true,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      // pageIndex 500, pageSize 1000: start = 500 * 1000 + 1 = 500001, end = min(501000, 999999) = 501000
      expect(screen.getByText('Showing 500001-501000 of 999999 results')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper button structure', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<Pagination {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  // The rdt- classes are the documented styling API.
  describe('styling contract', () => {
    const props = {
      totalCount: 100,
      pageIndex: 0,
      pageSize: 10,
      hasNextPage: true,
      hasPreviousPage: false,
      onNextPage: vi.fn(),
      onPreviousPage: vi.fn(),
    };

    it('names the footer and its parts', () => {
      const { container } = render(<Pagination {...props} showPageCount />);
      const root = container.firstElementChild;
      expect(root).toHaveClass('rdt-pagination');
      expect(screen.getByText(/^Showing/)).toHaveClass('rdt-pagination__range');
      expect(screen.getByText('Page 1 of 10')).toHaveClass('rdt-pagination__page-count');
      expect(root?.querySelector('.rdt-pagination__controls')).not.toBeNull();
      const next = screen.getByRole('button', { name: 'Next page' });
      expect(next).toHaveClass('rdt-button', 'rdt-pagination__button');
      expect(next.querySelector('.rdt-pagination__icon')).not.toBeNull();
    });

    it('marks the bordered layout exactly when the page count shows', () => {
      const { container, rerender } = render(<Pagination {...props} />);
      expect(container.firstElementChild).not.toHaveClass('rdt-pagination--bordered');
      expect(screen.getByRole('button', { name: 'Next page' })).toHaveClass('rdt-button--ghost');

      rerender(<Pagination {...props} showPageCount />);
      expect(container.firstElementChild).toHaveClass('rdt-pagination--bordered');
      expect(screen.getByRole('button', { name: 'Next page' })).toHaveClass('rdt-button--outline');
    });

    it('appends className after the package classes', () => {
      const { container } = render(<Pagination {...props} className="mine" />);
      expect(container.firstElementChild?.className).toBe('rdt-pagination mine');
    });

    it('gives the bordered controls data-testid hooks', () => {
      render(<Pagination {...props} showPageCount />);
      expect(screen.getByTestId('btn.pagination.previous')).toHaveAccessibleName('Previous page');
      expect(screen.getByTestId('btn.pagination.next')).toHaveAccessibleName('Next page');
    });
  });

  describe('without a total, and empty pages', () => {
    const base = {
      pageIndex: 1,
      pageSize: 10,
      hasNextPage: true,
      hasPreviousPage: true,
      onNextPage: vi.fn(),
      onPreviousPage: vi.fn(),
    };

    it('shows the range without a total, and no page count', () => {
      render(<Pagination {...base} showPageCount />);
      expect(screen.getByText('Showing 11-20')).toBeInTheDocument();
      expect(screen.queryByText(/Page/)).toBeNull();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    });

    it("ends the range at the page's row count", () => {
      render(<Pagination {...base} hasNextPage={false} pageRowCount={4} />);
      expect(screen.getByText('Showing 11-14')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    it('reads an empty page as 0 to 0', () => {
      const { rerender } = render(<Pagination {...base} pageIndex={0} totalCount={0} />);
      expect(screen.getByText('Showing 0-0 of 0 results')).toBeInTheDocument();
      rerender(<Pagination {...base} pageIndex={9} totalCount={25} />);
      expect(screen.getByText('Showing 0-0 of 25 results')).toBeInTheDocument();
      rerender(<Pagination {...base} pageRowCount={0} />);
      expect(screen.getByText('Showing 0-0')).toBeInTheDocument();
    });

    it('reads a negative or non-finite total as no total', () => {
      const { rerender } = render(
        <Pagination {...base} totalCount={-1} pageRowCount={4} showPageCount />
      );
      expect(screen.getByText('Showing 11-14')).toBeInTheDocument();
      expect(screen.queryByText(/Page|of/)).toBeNull();
      rerender(<Pagination {...base} totalCount={Number.NaN} pageRowCount={4} showPageCount />);
      expect(screen.getByText('Showing 11-14')).toBeInTheDocument();
      expect(screen.queryByText(/Page|of/)).toBeNull();
    });

    it('reads a numeric string total as its number', () => {
      // A Postgres count(*) arrives from node-postgres as a string.
      const total = '42' as unknown as number;
      render(<Pagination {...base} totalCount={total} showPageCount />);
      expect(screen.getByText('Showing 11-20 of 42 results')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    });

    it('keeps the page range while a table without a total loads', () => {
      render(
        <DataTable
          columns={[{ id: 'name', header: 'Name', cell: ({ row }) => row.id }]}
          data={[] as { id: string }[]}
          loading
          pagination={base}
        />
      );
      expect(screen.getByText('Showing 11-20')).toBeInTheDocument();
    });

    it('treats a null total as unknown', () => {
      render(<Pagination {...base} totalCount={null} showPageCount />);
      expect(screen.getByText('Showing 11-20')).toBeInTheDocument();
      expect(screen.queryByText(/null/)).toBeNull();
    });

    it('takes the range text from labels', () => {
      render(
        <Pagination
          {...base}
          labels={{ showingRange: ({ start, end }) => `Lignes ${start} à ${end}` }}
        />
      );
      expect(screen.getByText('Lignes 11 à 20')).toBeInTheDocument();
    });

    it('DataTable passes its row count', () => {
      render(
        <DataTable
          columns={[{ id: 'name', header: 'Name', cell: ({ row }) => row.id }]}
          data={[{ id: 'a' }, { id: 'b' }, { id: 'c' }]}
          pagination={{ ...base, pageIndex: 0, hasNextPage: false, hasPreviousPage: false }}
        />
      );
      expect(screen.getByText('Showing 1-3')).toBeInTheDocument();
    });
  });
});
