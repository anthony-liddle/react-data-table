import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SortableHeaderClient } from '@/components/library/sortable-header-client';

// Helper function to render component within table structure
const renderInTable = (component: React.ReactElement) => {
  return render(
    <table>
      <thead>
        <tr>{component}</tr>
      </thead>
    </table>
  );
};

describe('SortableHeaderClient', () => {
  const mockOnSort = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with title prop', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should render with children prop', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" onSort={mockOnSort}>
          <span>Custom Header</span>
        </SortableHeaderClient>
      );

      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('should prefer title over children when both are provided', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Title" onSort={mockOnSort}>
          <span>Children</span>
        </SortableHeaderClient>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.queryByText('Children')).not.toBeInTheDocument();
    });

    it('should render as th element', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);

      const header = screen.getByText('Name').closest('th');
      expect(header).toBeInTheDocument();
      expect(header?.tagName).toBe('TH');
    });

    it('should apply custom className', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          className="custom-class"
        />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toHaveClass('custom-class');
    });

    it('should apply sticky class when sticky is true', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} sticky={true} />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toHaveClass('rdt-sort-header--sticky');
    });

    it('should not apply sticky class when sticky is false', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} sticky={false} />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).not.toHaveClass('rdt-sort-header--sticky');
    });

    it('should apply rowSpan when provided', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} rowSpan={2} />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toHaveAttribute('rowSpan', '2');
    });

    it('should not apply rowSpan when not provided', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);

      const header = screen.getByText('Name').closest('th');
      expect(header).not.toHaveAttribute('rowSpan');
    });

    it('should apply rowSpan when rowSpan is 0', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} rowSpan={0} />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toHaveAttribute('rowSpan', '0');
    });
  });

  describe('sort icons', () => {
    it('should render icon when not active', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="email"
        />
      );

      const header = screen.getByText('Name').closest('th');
      // Check for the decorative icon container (aria-hidden span)
      const iconContainer = header?.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.children.length).toBeGreaterThan(0);
    });

    it('should render icon when active but direction is null', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="name"
          currentDirection={null}
        />
      );

      const header = screen.getByText('Name').closest('th');
      const iconContainer = header?.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.children.length).toBeGreaterThan(0);
    });

    it('should render icon when active and direction is asc', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="name"
          currentDirection="asc"
        />
      );

      const header = screen.getByText('Name').closest('th');
      const iconContainer = header?.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.children.length).toBeGreaterThan(0);
    });

    it('should render icon when active and direction is desc', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="name"
          currentDirection="desc"
        />
      );

      const header = screen.getByText('Name').closest('th');
      const iconContainer = header?.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.children.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should be a keyboard-operable button named after the column', async () => {
      const user = userEvent.setup();
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);

      const button = screen.getByRole('button', { name: 'Name' });
      await user.tab();
      expect(button).toHaveFocus();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(mockOnSort).toHaveBeenCalledTimes(2);
      expect(mockOnSort).toHaveBeenCalledWith('name');
    });

    it('should expose the sort direction with aria-sort only on the active column', () => {
      const { rerender } = renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="name"
          currentDirection="asc"
        />
      );
      const header = screen.getByRole('columnheader', { name: 'Name' });
      expect(header).toHaveAttribute('aria-sort', 'ascending');

      rerender(
        <table>
          <thead>
            <tr>
              <SortableHeaderClient
                sortKey="name"
                title="Name"
                onSort={mockOnSort}
                currentSortKey="name"
                currentDirection="desc"
              />
            </tr>
          </thead>
        </table>
      );
      expect(header).toHaveAttribute('aria-sort', 'descending');

      rerender(
        <table>
          <thead>
            <tr>
              <SortableHeaderClient
                sortKey="name"
                title="Name"
                onSort={mockOnSort}
                currentSortKey="email"
                currentDirection="asc"
              />
            </tr>
          </thead>
        </table>
      );
      expect(header).not.toHaveAttribute('aria-sort');
    });

    it('should mark the header cell as a column header', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);
      expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('scope', 'col');
    });

    it('should not render a button when disabled', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} disabled={true} />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should render without clickable styles when disabled', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} disabled={true} />
      );

      const header = screen.getByText('Name').closest('th');
      const clickableDiv = header?.querySelector('.rdt-sort-header__button');
      expect(clickableDiv).not.toBeInTheDocument();
    });

    it('should not show sort icons when disabled', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          disabled={true}
          currentSortKey="name"
          currentDirection="asc"
        />
      );

      const header = screen.getByText('Name').closest('th');
      const iconContainer = header?.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).not.toBeInTheDocument();
    });

    it('should not call onSort when disabled and clicked', async () => {
      const user = userEvent.setup();
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} disabled={true} />
      );

      const header = screen.getByText('Name').closest('th');
      const div = header?.querySelector('div');
      if (div) {
        await user.click(div);
      }

      expect(mockOnSort).not.toHaveBeenCalled();
    });
  });

  describe('interactions', () => {
    it('should call onSort with sortKey when clicked', async () => {
      const user = userEvent.setup();
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);

      const header = screen.getByText('Name').closest('th');
      const clickableDiv = header?.querySelector('.rdt-sort-header__button');
      expect(clickableDiv).toBeInTheDocument();

      if (clickableDiv) {
        await user.click(clickableDiv);
      }

      expect(mockOnSort).toHaveBeenCalledTimes(1);
      expect(mockOnSort).toHaveBeenCalledWith('name');
    });

    it('should not call onSort when disabled and clicked', async () => {
      const user = userEvent.setup();
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} disabled={true} />
      );

      const header = screen.getByText('Name').closest('th');
      const div = header?.querySelector('div');
      if (div) {
        await user.click(div);
      }

      expect(mockOnSort).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty title string', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="" onSort={mockOnSort} />);

      const header = screen.getByRole('columnheader');
      expect(header).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" onSort={mockOnSort}>
          <span></span>
        </SortableHeaderClient>
      );

      const header = screen.getByRole('columnheader');
      expect(header).toBeInTheDocument();
    });

    it('should handle very long title text', () => {
      const longTitle = 'A'.repeat(100);
      renderInTable(<SortableHeaderClient sortKey="name" title={longTitle} onSort={mockOnSort} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle when currentSortKey is null', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey={null}
        />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toBeInTheDocument();
      const iconContainer = header?.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument(); // Should show icon
    });

    it('should handle when currentSortKey is undefined', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey={undefined}
        />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toBeInTheDocument();
    });

    it('should handle when currentDirection is undefined', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="name"
          currentDirection={undefined}
        />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toBeInTheDocument();
    });

    it('should handle invalid direction value gracefully', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="name"
          currentDirection={'invalid' as 'asc'}
        />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper table header structure', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);

      const header = screen.getByRole('columnheader');
      expect(header).toBeInTheDocument();
      expect(header.tagName).toBe('TH');
    });

    it('should render the sort button when enabled', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);

      const header = screen.getByText('Name').closest('th');
      const clickableDiv = header?.querySelector('.rdt-sort-header__button');
      expect(clickableDiv).toBeInTheDocument();
    });
  });

  // The rdt- classes and data-direction are the documented styling API.
  describe('styling contract', () => {
    it('names the header, its button, label and icon', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);
      const header = screen.getByRole('columnheader');
      expect(header).toHaveClass('rdt-sort-header');
      expect(header.querySelector('button')).toHaveClass('rdt-sort-header__button');
      expect(screen.getByText('Name')).toHaveClass('rdt-sort-header__label');
      expect(header.querySelector('.rdt-sort-header__icon')).not.toHaveAttribute('data-direction');
      expect(header.querySelector('.rdt-sort-header__icon svg')).toHaveClass(
        'rdt-sort-header__arrow'
      );
    });

    it.each([
      ['asc', 'asc'],
      ['desc', 'desc'],
    ] as const)('marks the icon of the sorted column with %s as %s', (direction, expected) => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="name"
          currentDirection={direction}
        />
      );
      expect(
        screen.getByRole('columnheader').querySelector('.rdt-sort-header__icon')
      ).toHaveAttribute('data-direction', expected);
    });

    it('leaves the direction off a column that is not sorted', () => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          currentSortKey="email"
          currentDirection="asc"
        />
      );
      expect(
        screen.getByRole('columnheader').querySelector('.rdt-sort-header__icon')
      ).not.toHaveAttribute('data-direction');
    });

    it('wraps the button contents in the content element', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);
      const content = screen.getByText('Name').parentElement;
      expect(content).toHaveClass('rdt-sort-header__content');
      expect(content?.parentElement).toHaveClass('rdt-sort-header__button');
      expect(content?.querySelector('.rdt-sort-header__icon')).not.toBeNull();
    });

    it('wraps a disabled header in its content element', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} disabled />
      );
      expect(screen.getByText('Name').parentElement).toHaveClass('rdt-sort-header__content');
    });
  });
});
