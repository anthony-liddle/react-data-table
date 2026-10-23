import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PaginationClient } from '@/components/data-table/pagination-client';

describe('PaginationClient', () => {
  describe('rendering', () => {
    it('should render pagination component', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      expect(screen.getByText(/Showing.*of.*results/)).toBeInTheDocument();
    });

    it('should display correct pagination text for first page', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      expect(screen.getByText('Showing 1-10 of 100 results')).toBeInTheDocument();
    });

    it('should display correct pagination text for middle page', () => {
      const props = {
        totalCount: 100,
        pageIndex: 4,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      expect(screen.getByText('Showing 41-50 of 100 results')).toBeInTheDocument();
    });

    it('should display correct pagination text for last page', () => {
      const props = {
        totalCount: 100,
        pageIndex: 9,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: true,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      expect(screen.getByText('Showing 91-100 of 100 results')).toBeInTheDocument();
    });

    it('should display correct pagination text when last page has fewer items', () => {
      const props = {
        totalCount: 95,
        pageIndex: 9,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: true,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      expect(screen.getByText('Showing 91-95 of 95 results')).toBeInTheDocument();
    });

    it('should display correct pagination text for empty results', () => {
      const props = {
        totalCount: 0,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      expect(screen.getByText('Showing 1-0 of 0 results')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
        className: 'custom-pagination-class',
      };

      const { container } = render(<PaginationClient {...props} />);
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
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

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
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

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
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

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
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

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
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

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
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).toBeDisabled();
    });
  });

  describe('interactions', () => {
    it('should call handleNextPage when next button is clicked', async () => {
      const user = userEvent.setup();
      const handleNextPage = vi.fn();
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        handleNextPage,
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      const nextButton = screen.getByRole('button', { name: 'Next page' });
      await user.click(nextButton);

      expect(handleNextPage).toHaveBeenCalledTimes(1);
    });

    it('should call handlePreviousPage when previous button is clicked', async () => {
      const user = userEvent.setup();
      const handlePreviousPage = vi.fn();
      const props = {
        totalCount: 100,
        pageIndex: 5,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        handleNextPage: vi.fn(),
        handlePreviousPage,
      };

      render(<PaginationClient {...props} />);

      const previousButton = screen.getByRole('button', { name: 'Previous page' });
      await user.click(previousButton);

      expect(handlePreviousPage).toHaveBeenCalledTimes(1);
    });

    it('should not call handleNextPage when button is disabled', async () => {
      const user = userEvent.setup();
      const handleNextPage = vi.fn();
      const props = {
        totalCount: 100,
        pageIndex: 9,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: true,
        handleNextPage,
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      const nextButton = screen.getByRole('button', { name: 'Next page' });
      await user.click(nextButton);

      expect(handleNextPage).not.toHaveBeenCalled();
    });

    it('should not call handlePreviousPage when button is disabled', async () => {
      const user = userEvent.setup();
      const handlePreviousPage = vi.fn();
      const props = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        handleNextPage: vi.fn(),
        handlePreviousPage,
      };

      render(<PaginationClient {...props} />);

      const previousButton = screen.getByRole('button', { name: 'Previous page' });
      await user.click(previousButton);

      expect(handlePreviousPage).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle default values when props are missing', () => {
      const props = {
        totalCount: 0,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      // Should use default values: totalCount = 0, pageIndex = 0
      expect(screen.getByText('Showing 1-0 of 0 results')).toBeInTheDocument();
    });

    it('should handle pageSize of 1', () => {
      const props = {
        totalCount: 5,
        pageIndex: 2,
        pageSize: 1,
        hasNextPage: true,
        hasPreviousPage: true,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      expect(screen.getByText('Showing 3-3 of 5 results')).toBeInTheDocument();
    });

    it('should handle large page sizes', () => {
      const props = {
        totalCount: 1000,
        pageIndex: 0,
        pageSize: 100,
        hasNextPage: true,
        hasPreviousPage: false,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

      expect(screen.getByText('Showing 1-100 of 1000 results')).toBeInTheDocument();
    });

    it('should handle very large totalCount', () => {
      const props = {
        totalCount: 999999,
        pageIndex: 500,
        pageSize: 1000,
        hasNextPage: true,
        hasPreviousPage: true,
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

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
        handleNextPage: vi.fn(),
        handlePreviousPage: vi.fn(),
      };

      render(<PaginationClient {...props} />);

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
      handleNextPage: vi.fn(),
      handlePreviousPage: vi.fn(),
    };

    it('names the footer and its parts', () => {
      const { container } = render(<PaginationClient {...props} showPageCount />);
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
      const { container, rerender } = render(<PaginationClient {...props} />);
      expect(container.firstElementChild).not.toHaveClass('rdt-pagination--bordered');
      expect(screen.getByRole('button', { name: 'Next page' })).toHaveClass('rdt-button--ghost');

      rerender(<PaginationClient {...props} showPageCount />);
      expect(container.firstElementChild).toHaveClass('rdt-pagination--bordered');
      expect(screen.getByRole('button', { name: 'Next page' })).toHaveClass('rdt-button--outline');
    });

    it('appends className after the package classes', () => {
      const { container } = render(<PaginationClient {...props} className="mine" />);
      expect(container.firstElementChild?.className).toBe('rdt-pagination mine');
    });
  });
});
