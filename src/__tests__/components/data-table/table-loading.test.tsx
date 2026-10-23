import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TableLoading } from '@/components/data-table/table-loading';
import type { BaseTableRow, TableColumn } from '@/components/data-table/types';

interface TestRow extends BaseTableRow {
  id: string;
  name: string;
}

describe('TableLoading', () => {
  const baseColumns: TableColumn<TestRow>[] = [
    {
      header: 'Name',
      cell: ({ row }) => <span>{row.name}</span>,
    },
    {
      header: 'Email',
      cell: ({ row }) => <span>{String(row.email)}</span>,
    },
  ];

  describe('rendering', () => {
    it('should render loading rows', () => {
      render(
        <TableLoading visibleColumnsData={baseColumns} hasSelection={false} hasActionMenu={false} />
      );

      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should render default number of rows (10)', () => {
      render(
        <TableLoading visibleColumnsData={baseColumns} hasSelection={false} hasActionMenu={false} />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(10);
    });

    it('should render custom number of rows', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={5}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(5);
    });

    it('should render skeleton cells for each column', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(2); // 2 columns
    });

    it('should render selection column when hasSelection is true', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={true}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(3); // 2 columns + 1 selection column
    });

    it('should render action menu column when hasActionMenu is true', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={true}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(3); // 2 columns + 1 action menu column
    });

    it('should render both selection and action menu columns', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={true}
          hasActionMenu={true}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(4); // 2 columns + 1 selection + 1 action menu
    });
  });

  describe('custom loading cells', () => {
    it('should render custom loadingCell when provided', () => {
      const columnsWithLoadingCell: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          cell: ({ row }) => <span>{row.name}</span>,
          loadingCell: () => <div data-testid="custom-loading">Custom Loading</div>,
        },
        {
          header: 'Email',
          cell: ({ row }) => <span>{String(row.email)}</span>,
        },
      ];

      render(
        <TableLoading
          visibleColumnsData={columnsWithLoadingCell}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.getByText('Custom Loading')).toBeInTheDocument();
    });

    it('should render default skeleton when loadingCell is not provided', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const skeletons = screen.getAllByRole('cell');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render mix of custom and default loading cells', () => {
      const columnsWithMixedLoading: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          cell: ({ row }) => <span>{row.name}</span>,
          loadingCell: () => <div data-testid="custom-name">Loading Name</div>,
        },
        {
          header: 'Email',
          cell: ({ row }) => <span>{String(row.email)}</span>,
          // No loadingCell - should use default skeleton
        },
      ];

      render(
        <TableLoading
          visibleColumnsData={columnsWithMixedLoading}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      expect(screen.getByTestId('custom-name')).toBeInTheDocument();
      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(2);
    });
  });

  describe('colSpan handling', () => {
    it('should apply colSpan to last column when action menu is not present', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      const lastCell = cells[cells.length - 1];
      expect(lastCell).toHaveAttribute('colSpan', '2');
    });

    it('should not apply colSpan to last column when action menu is present', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={true}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      // Last cell should be action menu column
      const lastDataCell = cells[cells.length - 2];
      expect(lastDataCell).not.toHaveAttribute('colSpan', '2');
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      render(
        <TableLoading
          visibleColumnsData={[]}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(1);
    });

    it('should handle zero rowCount', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={0}
        />
      );

      const rows = screen.queryAllByRole('row');
      expect(rows).toHaveLength(0);
    });

    it('should handle single column', () => {
      const singleColumn: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          cell: ({ row }) => <span>{String(row.name)}</span>,
        },
      ];

      render(
        <TableLoading
          visibleColumnsData={singleColumn}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(1);
    });

    it('should handle many columns', () => {
      const manyColumns: TableColumn<TestRow>[] = Array.from({ length: 10 }, (_, i) => ({
        header: `Column ${i}`,
        cell: ({ row }) => <span>{String(row.name)}</span>,
      }));

      render(
        <TableLoading
          visibleColumnsData={manyColumns}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(10);
    });

    it('should handle rowCount of 1', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(1);
    });

    it('should handle large rowCount', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={false}
          rowCount={100}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(100);
    });
  });

  describe('column styling', () => {
    it('should apply sticky class to selection column', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={true}
          hasActionMenu={false}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      const selectionCell = cells[0];
      expect(selectionCell).toHaveClass('data-table-sticky');
    });

    it('should apply sticky and no-highlight classes to action menu column', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          hasSelection={false}
          hasActionMenu={true}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      const actionMenuCell = cells[cells.length - 1];
      expect(actionMenuCell).toHaveClass('data-table-sticky');
      expect(actionMenuCell).toHaveClass('data-table-no-highlight');
    });
  });
});
