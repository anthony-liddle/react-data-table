import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SortItem } from '@/components/data-table/types';
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
          sortBy={[{ key: 'email', direction: 'asc' }]}
        />
      );

      const header = screen.getByText('Name').closest('th');
      // Check for the decorative icon container (aria-hidden span)
      const iconContainer = header?.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.children.length).toBeGreaterThan(0);
    });

    it('should render the unsorted icon for an empty sort', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} sortBy={[]} />
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
          sortBy={[{ key: 'name', direction: 'asc' }]}
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
          sortBy={[{ key: 'name', direction: 'desc' }]}
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
      expect(mockOnSort).toHaveBeenCalledWith('name', { additive: false });
    });

    it('should expose the sort direction with aria-sort only on the active column', () => {
      const { rerender } = renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          sortBy={[{ key: 'name', direction: 'asc' }]}
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
                sortBy={[{ key: 'name', direction: 'desc' }]}
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
                sortBy={[{ key: 'email', direction: 'asc' }]}
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
          sortBy={[{ key: 'name', direction: 'asc' }]}
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
      expect(mockOnSort).toHaveBeenCalledWith('name', { additive: false });
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

    it('should handle an empty sort', () => {
      renderInTable(
        <SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} sortBy={[]} />
      );

      const header = screen.getByText('Name').closest('th');
      expect(header).toBeInTheDocument();
      const iconContainer = header?.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument(); // Should show icon
    });

    it('should handle no sort', () => {
      renderInTable(<SortableHeaderClient sortKey="name" title="Name" onSort={mockOnSort} />);

      const header = screen.getByText('Name').closest('th');
      expect(header).toBeInTheDocument();
    });

    it.each(['invalid', 'DESC'])('shows a %s direction as unsorted', direction => {
      renderInTable(
        <SortableHeaderClient
          sortKey="name"
          title="Name"
          onSort={mockOnSort}
          sortBy={[{ key: 'name', direction: direction as 'asc' }]}
        />
      );

      const header = screen.getByRole('columnheader', { name: 'Name' });
      expect(header).not.toHaveAttribute('aria-sort');
      const icon = header.querySelector('.rdt-sort-header__icon');
      expect(icon).not.toHaveAttribute('data-direction');
      expect(icon?.querySelector('.rdt-sort-header__arrow')).not.toBeNull();
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
          sortBy={[{ key: 'name', direction }]}
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
          sortBy={[{ key: 'email', direction: 'asc' }]}
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

  describe('multi-column sort', () => {
    const renderPair = (sortBy: SortItem[], onSort = mockOnSort) =>
      render(
        <table>
          <thead>
            <tr>
              <SortableHeaderClient sortKey="name" title="Name" sortBy={sortBy} onSort={onSort} />
              <SortableHeaderClient sortKey="team" title="Team" sortBy={sortBy} onSort={onSort} />
            </tr>
          </thead>
        </table>
      );

    it('reports a plain click as not additive', async () => {
      renderPair([]);
      await userEvent.click(screen.getByRole('button', { name: /Name/ }));
      expect(mockOnSort).toHaveBeenCalledWith('name', { additive: false });
    });

    it('reports a Shift+click as additive', async () => {
      renderPair([]);
      const user = userEvent.setup();
      await user.keyboard('{Shift>}');
      await user.click(screen.getByRole('button', { name: /Name/ }));
      await user.keyboard('{/Shift}');
      expect(mockOnSort).toHaveBeenCalledWith('name', { additive: true });
    });

    it('reports Shift+Enter or Shift+Space as additive, even when the click has no shiftKey', () => {
      renderPair([]);
      const button = screen.getByRole('button', { name: /Name/ });
      fireEvent.keyDown(button, { key: 'Enter', shiftKey: true });
      fireEvent.click(button, { detail: 0 });
      expect(mockOnSort).toHaveBeenLastCalledWith('name', { additive: true });

      fireEvent.keyDown(button, { key: ' ', shiftKey: true });
      fireEvent.click(button, { detail: 0 });
      expect(mockOnSort).toHaveBeenLastCalledWith('name', { additive: true });
    });

    it('reports a plain Enter as not additive', () => {
      renderPair([]);
      const button = screen.getByRole('button', { name: /Name/ });
      fireEvent.keyDown(button, { key: 'Enter', shiftKey: true });
      fireEvent.click(button, { detail: 0 });
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.click(button, { detail: 0 });
      expect(mockOnSort).toHaveBeenLastCalledWith('name', { additive: false });
    });

    it('shows an arrow on every sorted column and aria-sort on the primary only', () => {
      renderPair([
        { key: 'name', direction: 'asc' },
        { key: 'team', direction: 'desc' },
      ]);
      const [nameHeader, teamHeader] = screen.getAllByRole('columnheader');
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
      expect(teamHeader).not.toHaveAttribute('aria-sort');
      expect(teamHeader?.querySelector('.rdt-sort-header__icon')).toHaveAttribute(
        'data-direction',
        'desc'
      );
    });
  });
});
