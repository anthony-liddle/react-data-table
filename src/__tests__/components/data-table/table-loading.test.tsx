import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getTableLayout } from '@/components/data-table/layout';
import { TableLoading } from '@/components/data-table/table-loading';
import type { BaseTableRow, TableColumn } from '@/components/data-table/types';

interface TestRow extends BaseTableRow {
  id: string;
  name: string;
  email?: string;
}

// The settings column is hidden unless a test says otherwise, so a row without
// row menus ends at its last data cell.
const layoutOf = ({
  select,
  actionMenu,
  hideTableSettings = true,
}: {
  select: boolean;
  actionMenu: boolean;
  hideTableSettings?: boolean;
}) => getTableLayout({ expand: false, select, actionMenu, hideTableSettings });

describe('TableLoading', () => {
  const baseColumns: TableColumn<TestRow>[] = [
    { id: 'name', header: 'Name', cell: ({ row }) => <span>{row.name}</span> },
    { id: 'email', header: 'Email', cell: ({ row }) => <span>{String(row.email)}</span> },
  ];

  describe('rendering', () => {
    it('should render loading rows', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: false, actionMenu: false })}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should render default number of rows (10)', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: false, actionMenu: false })}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(10);
    });

    it('should render custom number of rows', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: false, actionMenu: false })}
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
          layout={layoutOf({ select: false, actionMenu: false })}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(2); // 2 columns
    });

    it('should render selection column with a checkbox column', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: true, actionMenu: false })}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(3); // 2 columns + 1 selection column
    });

    it('should render action menu column with row menus', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: false, actionMenu: true })}
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
          layout={layoutOf({ select: true, actionMenu: true })}
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
          id: 'name',
          header: 'Name',
          cell: ({ row }) => <span>{row.name}</span>,
          loadingCell: () => <div data-testid="custom-loading">Custom Loading</div>,
        },
        { id: 'email', header: 'Email', cell: ({ row }) => <span>{String(row.email)}</span> },
      ];

      render(
        <TableLoading
          visibleColumnsData={columnsWithLoadingCell}
          layout={layoutOf({ select: false, actionMenu: false })}
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
          layout={layoutOf({ select: false, actionMenu: false })}
          rowCount={1}
        />
      );

      const skeletons = screen.getAllByRole('cell');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render mix of custom and default loading cells', () => {
      const columnsWithMixedLoading: TableColumn<TestRow>[] = [
        {
          id: 'name',
          header: 'Name',
          cell: ({ row }) => <span>{row.name}</span>,
          loadingCell: () => <div data-testid="custom-name">Loading Name</div>,
        },
        {
          id: 'email',
          header: 'Email',
          cell: ({ row }) => <span>{String(row.email)}</span>,
          // No loadingCell - should use default skeleton
        },
      ];

      render(
        <TableLoading
          visibleColumnsData={columnsWithMixedLoading}
          layout={layoutOf({ select: false, actionMenu: false })}
          rowCount={1}
        />
      );

      expect(screen.getByTestId('custom-name')).toBeInTheDocument();
      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(2);
    });
  });

  describe('trailing column', () => {
    it('ends each row with an empty settings cell when the settings column shows', () => {
      const { container } = render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: false, actionMenu: false, hideTableSettings: false })}
          rowCount={1}
        />
      );
      const last = container.querySelector('tr')?.lastElementChild;
      expect(last).toHaveClass('rdt-table__cell--settings', 'rdt-table__cell--sticky');
      expect(last).toBeEmptyDOMElement();
    });

    it('never spans a cell over two columns', () => {
      const { container } = render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: true, actionMenu: false, hideTableSettings: false })}
          rowCount={1}
        />
      );
      for (const cell of container.querySelectorAll('td')) {
        expect(cell).not.toHaveAttribute('colspan');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      render(
        <TableLoading
          visibleColumnsData={[]}
          layout={layoutOf({ select: false, actionMenu: false })}
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
          layout={layoutOf({ select: false, actionMenu: false })}
          rowCount={0}
        />
      );

      const rows = screen.queryAllByRole('row');
      expect(rows).toHaveLength(0);
    });

    it('should handle single column', () => {
      const singleColumn: TableColumn<TestRow>[] = [
        { id: 'name', header: 'Name', cell: ({ row }) => <span>{String(row.name)}</span> },
      ];

      render(
        <TableLoading
          visibleColumnsData={singleColumn}
          layout={layoutOf({ select: false, actionMenu: false })}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      expect(cells).toHaveLength(1);
    });

    it('should handle many columns', () => {
      const manyColumns: TableColumn<TestRow>[] = Array.from({ length: 10 }, (_, i) => ({
        id: `column-${i}`,
        header: `Column ${i}`,
        cell: ({ row }) => <span>{String(row.name)}</span>,
      }));

      render(
        <TableLoading
          visibleColumnsData={manyColumns}
          layout={layoutOf({ select: false, actionMenu: false })}
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
          layout={layoutOf({ select: false, actionMenu: false })}
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
          layout={layoutOf({ select: false, actionMenu: false })}
          rowCount={100}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(100);
    });
  });

  describe('column styling', () => {
    it('should mark the selection cell and its skeleton', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: true, actionMenu: false })}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      const selectionCell = cells[0];
      expect(selectionCell).toHaveClass('rdt-table__cell--select', 'rdt-table__cell--sticky');
      expect(selectionCell?.firstElementChild).toHaveClass('rdt-skeleton', 'rdt-skeleton--select');
    });

    it('should mark the action cell and its skeleton', () => {
      render(
        <TableLoading
          visibleColumnsData={baseColumns}
          layout={layoutOf({ select: false, actionMenu: true })}
          rowCount={1}
        />
      );

      const cells = screen.getAllByRole('cell');
      const actionMenuCell = cells[cells.length - 1];
      expect(actionMenuCell).toHaveClass('rdt-table__cell--actions', 'rdt-table__cell--sticky');
      expect(actionMenuCell?.firstElementChild).toHaveClass('rdt-skeleton', 'rdt-skeleton--action');
    });
  });
});
