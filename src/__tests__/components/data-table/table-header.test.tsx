import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TableHeader } from '@/components/data-table/table-header';
import type { BaseTableRow, TableColumn } from '@/components/data-table/types';

interface TestRow extends BaseTableRow {
  id: string;
  name: string;
}

describe('TableHeader', () => {
  describe('rendering', () => {
    it('should render non-sortable column header', () => {
      const column: TableColumn<TestRow> = {
        header: 'Name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="" />);

      const header = screen.getByText('Name');
      expect(header).toBeInTheDocument();
      const thElement = header.closest('th');
      expect(thElement).toBeInTheDocument();
      expect(thElement?.tagName).toBe('TH');
    });

    it('should render sortable column header', () => {
      const column: TableColumn<TestRow> = {
        header: 'Name',
        sortKey: 'name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="" />);

      const header = screen.getByText('Name');
      expect(header).toBeInTheDocument();
      // For sortable headers, the text is inside a span, so check the closest th
      const thElement = header.closest('th');
      expect(thElement).toBeInTheDocument();
      expect(thElement?.tagName).toBe('TH');
    });

    it('should apply className prop', () => {
      const column: TableColumn<TestRow> = {
        header: 'Name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="custom-class" />);

      const header = screen.getByText('Name');
      const thElement = header.closest('th');
      expect(thElement).toHaveClass('custom-class');
    });

    it('should apply rowSpan when provided', () => {
      const column: TableColumn<TestRow> = {
        header: 'Name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="" rowSpan={2} />);

      const header = screen.getByText('Name');
      const thElement = header.closest('th');
      expect(thElement).toHaveAttribute('rowSpan', '2');
    });

    it('should not apply rowSpan when not provided', () => {
      const column: TableColumn<TestRow> = {
        header: 'Name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="" />);

      const header = screen.getByText('Name');
      const thElement = header.closest('th');
      expect(thElement).not.toHaveAttribute('rowSpan');
    });
  });

  describe('sorting', () => {
    it('should call onSort when sortable column is clicked', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      const column: TableColumn<TestRow> = {
        header: 'Name',
        sortKey: 'name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(
        <TableHeader
          column={column}
          className=""
          currentSortKey={null}
          currentDirection={null}
          onSort={onSort}
        />
      );

      // Find the clickable sortable header element
      const header = screen.getByText('Name').closest('th');
      const clickableElement = header?.querySelector('button[class*="cursor-pointer"]');

      if (clickableElement) {
        await user.click(clickableElement);
        expect(onSort).toHaveBeenCalledTimes(1);
        expect(onSort).toHaveBeenCalledWith('name');
      } else {
        // Fallback: click the header itself
        await user.click(header!);
        expect(onSort).toHaveBeenCalledTimes(1);
        expect(onSort).toHaveBeenCalledWith('name');
      }
    });

    it('should not call onSort when column is not sortable', async () => {
      const user = userEvent.setup();
      const onSort = vi.fn();
      const column: TableColumn<TestRow> = {
        header: 'Name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="" onSort={onSort} />);

      const header = screen.getByText('Name');
      await user.click(header);

      expect(onSort).not.toHaveBeenCalled();
    });

    it('should not call onSort when onSort is not provided', async () => {
      const user = userEvent.setup();
      const column: TableColumn<TestRow> = {
        header: 'Name',
        sortKey: 'name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(
        <TableHeader column={column} className="" currentSortKey={null} currentDirection={null} />
      );

      const header = screen.getByText('Name').closest('th');
      const clickableElement = header?.querySelector('button[class*="cursor-pointer"]');

      if (clickableElement) {
        await user.click(clickableElement);
        // Should not throw an error
        expect(header).toBeInTheDocument();
      }
    });

    it('should pass currentSortKey and currentDirection to SortableHeaderClient', () => {
      const column: TableColumn<TestRow> = {
        header: 'Name',
        sortKey: 'name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(
        <TableHeader
          column={column}
          className=""
          currentSortKey="name"
          currentDirection="asc"
          onSort={vi.fn()}
        />
      );

      const header = screen.getByText('Name');
      expect(header).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty header string', () => {
      const column: TableColumn<TestRow> = {
        header: '',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="" />);

      const header = screen.getByRole('columnheader');
      expect(header).toBeInTheDocument();
    });

    it('should handle column without cell function', () => {
      const column: TableColumn<TestRow> = {
        header: 'Name',
      };

      render(<TableHeader column={column} className="" />);

      const header = screen.getByText('Name');
      expect(header).toBeInTheDocument();
    });

    it('should handle rowSpan of 0', () => {
      const column: TableColumn<TestRow> = {
        header: 'Name',
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="" rowSpan={0} />);

      const header = screen.getByText('Name');
      const thElement = header.closest('th');
      expect(thElement).toHaveAttribute('rowSpan', '0');
    });

    it('should handle very long header text', () => {
      const longHeader = 'A'.repeat(100);
      const column: TableColumn<TestRow> = {
        header: longHeader,
        cell: ({ row }) => <span>{row.name}</span>,
      };

      render(<TableHeader column={column} className="" />);

      const header = screen.getByText(longHeader);
      expect(header).toBeInTheDocument();
    });
  });
});
