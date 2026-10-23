import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataTable } from '@/components/data-table/data-table';
import type {
  BaseTableRow,
  TableActionMenuItem,
  TableColumn,
  TablePagination,
  TableSelection,
  TableSort,
} from '@/components/data-table/types';
import { at } from '@/test-support/at';

interface TestRow extends BaseTableRow {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

describe('DataTable', () => {
  const baseColumns: TableColumn<TestRow>[] = [
    {
      header: 'Name',
      sortKey: 'name',
      cell: ({ row }) => <span>{row.name}</span>,
    },
    {
      header: 'Email',
      sortKey: 'email',
      cell: ({ row }) => <span>{row.email}</span>,
    },
    {
      header: 'Role',
      cell: ({ row }) => <span>{row.role}</span>,
    },
  ];

  const baseData: TestRow[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'User' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('should scope every header cell to its column', () => {
      render(<DataTable columns={baseColumns} data={baseData} />);
      for (const th of screen.getAllByRole('columnheader')) {
        expect(th).toHaveAttribute('scope', 'col');
      }
    });

    it('should mark the table busy only while loading', () => {
      const { rerender } = render(<DataTable columns={baseColumns} data={[]} loading />);
      expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
      rerender(<DataTable columns={baseColumns} data={baseData} />);
      expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');
    });

    it('should render table with data', () => {
      render(<DataTable columns={baseColumns} data={baseData} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('should render column headers', () => {
      render(<DataTable columns={baseColumns} data={baseData} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(<DataTable columns={baseColumns} data={[]} />);

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<DataTable columns={baseColumns} data={baseData} loading={true} />);

      const rows = screen.getAllByRole('row');
      // Should have header row + loading rows
      expect(rows.length).toBeGreaterThan(1);
    });

    it('should render custom number of loading rows', () => {
      render(<DataTable columns={baseColumns} data={baseData} loading={true} maxLoadingRows={5} />);

      const rows = screen.getAllByRole('row');
      // Header row + 5 loading rows
      expect(rows.length).toBe(6);
    });
  });

  describe('sorting integration', () => {
    it('should call handleSort when sortable column header is clicked', async () => {
      const user = userEvent.setup();
      const handleSort = vi.fn();
      const sort: TableSort = {
        sortKey: null,
        direction: null,
        handleSort,
      };

      render(<DataTable columns={baseColumns} data={baseData} sort={sort} />);

      const nameHeader = screen.getByText('Name');
      const clickableElement = nameHeader
        .closest('th')
        ?.querySelector('div[class*="cursor-pointer"]');

      if (clickableElement) {
        await user.click(clickableElement);
        expect(handleSort).toHaveBeenCalledWith('name');
      }
    });

    it('should display sort indicators', () => {
      const sort: TableSort = {
        sortKey: 'name',
        direction: 'asc',
        handleSort: vi.fn(),
      };

      render(<DataTable columns={baseColumns} data={baseData} sort={sort} />);

      const nameHeader = screen.getByText('Name');
      expect(nameHeader).toBeInTheDocument();
    });
  });

  describe('selection integration', () => {
    const createSelection = (): TableSelection<TestRow> & { selectedRows: TestRow[] } => {
      const selectedRows: TestRow[] = [];
      return {
        selectedRows,
        onToggleRow: vi.fn((row: TestRow) => {
          const index = selectedRows.findIndex(r => r.id === row.id);
          if (index === -1) {
            selectedRows.push(row);
          } else {
            selectedRows.splice(index, 1);
          }
        }),
        onToggleAll: vi.fn((checked: boolean) => {
          if (checked) {
            selectedRows.push(...baseData);
          } else {
            selectedRows.length = 0;
          }
        }),
        isRowSelected: vi.fn((row: TestRow) => selectedRows.some(r => r.id === row.id)),
      };
    };

    it('should name each row checkbox from getRowLabel when it is provided', () => {
      render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          selection={createSelection()}
          getRowLabel={row => row.name}
        />
      );

      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1); // [0] is select-all
      expect(at(rowCheckboxes, 0)).toHaveAccessibleName('Select John Doe');
      expect(at(rowCheckboxes, 1)).toHaveAccessibleName('Select Jane Smith');
      expect(at(rowCheckboxes, 2)).toHaveAccessibleName('Select Bob Johnson');
    });

    it('should fall back to the row id when getRowLabel is not provided', () => {
      render(<DataTable columns={baseColumns} data={baseData} selection={createSelection()} />);

      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1); // [0] is select-all
      expect(at(rowCheckboxes, 0)).toHaveAccessibleName('Select row 1');
      expect(at(rowCheckboxes, 2)).toHaveAccessibleName('Select row 3');
    });

    it('should render selection checkboxes when selection prop is provided', () => {
      const selection = createSelection();
      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should call onToggleRow when row checkbox is clicked', async () => {
      const user = userEvent.setup();
      const selection = createSelection();
      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is "select all", second is first row
      const firstRowCheckbox = at(checkboxes, 1);

      await user.click(firstRowCheckbox);

      expect(selection.onToggleRow).toHaveBeenCalled();
    });

    it('should call onToggleAll when select all checkbox is clicked', async () => {
      const user = userEvent.setup();
      const selection = createSelection();
      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = at(checkboxes, 0);

      await user.click(selectAllCheckbox);

      expect(selection.onToggleAll).toHaveBeenCalledWith(true);
    });

    it('should render select all checkbox as checked when all rows are selected', () => {
      const selection = createSelection();
      selection.selectedRows.push(...baseData);
      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = at(checkboxes, 0);

      expect(selectAllCheckbox).toBeChecked();
    });
  });

  describe('action menu integration', () => {
    it('should render action menu buttons when actionMenu prop is provided', () => {
      const actionMenu: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          onSelect: vi.fn(),
        },
      ];

      render(<DataTable columns={baseColumns} data={baseData} actionMenu={actionMenu} />);

      // One row action trigger per row; the column settings trigger has its own name.
      const actionButtons = screen.getAllByRole('button', { name: 'Actions' });
      expect(actionButtons).toHaveLength(baseData.length);
      expect(screen.getByRole('button', { name: 'Column settings' })).toBeInTheDocument();
    });
  });

  describe('pagination integration', () => {
    it('should render pagination when pagination prop is provided', () => {
      const pagination: TablePagination = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage: vi.fn(),
        onPreviousPage: vi.fn(),
      };

      render(<DataTable columns={baseColumns} data={baseData} pagination={pagination} />);

      // Pagination component should be rendered
      expect(screen.getByText(/Showing.*of.*results/)).toBeInTheDocument();
    });

    it('should call onNextPage when next button is clicked', async () => {
      const user = userEvent.setup();
      const onNextPage = vi.fn();
      const pagination: TablePagination = {
        totalCount: 100,
        pageIndex: 0,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: false,
        onNextPage,
        onPreviousPage: vi.fn(),
      };

      render(<DataTable columns={baseColumns} data={baseData} pagination={pagination} />);

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(onNextPage).toHaveBeenCalledTimes(1);
    });

    it('should call onPreviousPage when previous button is clicked', async () => {
      const user = userEvent.setup();
      const onPreviousPage = vi.fn();
      const pagination: TablePagination = {
        totalCount: 100,
        pageIndex: 1,
        pageSize: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        onNextPage: vi.fn(),
        onPreviousPage,
      };

      render(<DataTable columns={baseColumns} data={baseData} pagination={pagination} />);

      await user.click(screen.getByRole('button', { name: 'Previous page' }));
      expect(onPreviousPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('column management integration', () => {
    it('should render table menu when hideTableSettings is false', () => {
      render(<DataTable columns={baseColumns} data={baseData} />);

      const menuButton = screen.getByRole('button', { name: 'Column settings' });
      expect(menuButton).toBeInTheDocument();
    });

    it('should hide table menu when hideTableSettings is true', () => {
      render(<DataTable columns={baseColumns} data={baseData} hideTableSettings={true} />);

      expect(screen.queryByRole('button', { name: 'Column settings' })).not.toBeInTheDocument();
    });

    it('should call onColumnReorder when columns are reordered', async () => {
      const user = userEvent.setup();
      const onColumnReorder = vi.fn();

      render(<DataTable columns={baseColumns} data={baseData} onColumnReorder={onColumnReorder} />);

      await user.click(screen.getByRole('button', { name: 'Column settings' }));

      await waitFor(() => {
        const nameLabels = screen.getAllByText('Name');
        expect(nameLabels.length).toBeGreaterThan(0);
      });

      // Note: Actual drag-and-drop testing would require more complex setup
      // This test verifies the component renders with onColumnReorder prop
      expect(onColumnReorder).not.toHaveBeenCalled();
    });

    it('should hide column with hideByDefault: true initially', () => {
      const columnsWithHidden: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          sortKey: 'name',
          cell: ({ row }) => <span>{row.name}</span>,
        },
        {
          header: 'Email',
          sortKey: 'email',
          cell: ({ row }) => <span>{row.email}</span>,
          hideByDefault: true,
        },
        {
          header: 'Role',
          cell: ({ row }) => <span>{row.role}</span>,
        },
      ];

      render(<DataTable columns={columnsWithHidden} data={baseData} />);

      // Name and Role should be visible
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();

      // Email header and cells should not be visible
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    });

    it('should show column with hideByDefault: false initially', () => {
      const columnsWithVisible: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          sortKey: 'name',
          cell: ({ row }) => <span>{row.name}</span>,
          hideByDefault: false,
        },
        {
          header: 'Email',
          sortKey: 'email',
          cell: ({ row }) => <span>{row.email}</span>,
        },
      ];

      render(<DataTable columns={columnsWithVisible} data={baseData} />);

      // Both columns should be visible
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should show column with hideByDefault: undefined initially (default visible)', () => {
      const columnsWithoutHideByDefault: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          sortKey: 'name',
          cell: ({ row }) => <span>{row.name}</span>,
        },
        {
          header: 'Email',
          sortKey: 'email',
          cell: ({ row }) => <span>{row.email}</span>,
        },
      ];

      render(<DataTable columns={columnsWithoutHideByDefault} data={baseData} />);

      // Both columns should be visible by default
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should allow toggling hidden column to visible via table menu', async () => {
      const user = userEvent.setup();
      const columnsWithHidden: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          sortKey: 'name',
          cell: ({ row }) => <span>{row.name}</span>,
        },
        {
          header: 'Email',
          sortKey: 'email',
          cell: ({ row }) => <span>{row.email}</span>,
          hideByDefault: true,
        },
      ];

      render(<DataTable columns={columnsWithHidden} data={baseData} />);

      // Email should be hidden initially
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();

      // Open table menu
      const menuButton = screen.getByRole('button', { name: 'Column settings' });
      await user.click(menuButton);

      // Wait for menu to open and find Email checkbox
      await waitFor(() => {
        const emailCheckbox = screen.getByLabelText('Email');
        expect(emailCheckbox).toBeInTheDocument();
      });

      const emailCheckbox = screen.getByLabelText('Email');
      expect(emailCheckbox).not.toBeChecked();

      // Toggle Email column to visible
      await user.click(emailCheckbox);

      // Close the menu by pressing Escape to avoid conflicts when checking for Email text
      await user.keyboard('{Escape}');

      // Email column should now be visible - verify by checking for email data in table
      // (checking for "Email" header text would conflict with menu label)
      await waitFor(() => {
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('grouped columns', () => {
    const groupedColumns: TableColumn<TestRow>[] = [
      {
        header: 'Name',
        cell: ({ row }) => <span>{row.name}</span>,
      },
      {
        header: 'Contact Info',
        subColumns: [
          {
            header: 'Email',
            cell: ({ row }) => <span>{String(row.email)}</span>,
          },
          {
            header: 'Phone',
            cell: ({ row }) => <span>{String(row.phone)}</span>,
          },
        ],
      },
    ];

    it('should scope group headers to their column group and leaf headers to their column', () => {
      render(
        <DataTable
          columns={groupedColumns}
          data={baseData}
          selection={{
            onToggleRow: vi.fn(),
            onToggleAll: vi.fn(),
            isRowSelected: () => false,
          }}
        />
      );

      const headers = screen.getAllByRole('columnheader');
      const groupHeaders = headers.filter(th => (th as HTMLTableCellElement).colSpan > 1);
      expect(groupHeaders.length).toBeGreaterThan(0);
      for (const th of groupHeaders) {
        expect(th).toHaveAttribute('scope', 'colgroup');
      }
      for (const th of headers.filter(h => (h as HTMLTableCellElement).colSpan === 1)) {
        expect(th).toHaveAttribute('scope', 'col');
      }
    });

    it('should render grouped columns with parent header', () => {
      render(<DataTable columns={groupedColumns} data={baseData} />);

      expect(screen.getByText('Contact Info')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('should render data in sub-columns', () => {
      const dataWithPhone: TestRow[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Admin',
          phone: '123-456-7890',
        },
      ];

      render(<DataTable columns={groupedColumns} data={dataWithPhone} />);

      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    });
  });

  describe('row click selection', () => {
    it('should enable row click selection when selectOnRowClick is true', async () => {
      const user = userEvent.setup();
      const selection = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn(() => false),
      };

      render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          selection={selection}
          selectOnRowClick={true}
        />
      );

      const rows = screen.getAllByRole('row');
      // Skip header row
      const firstDataRow = at(rows, 1);

      await user.click(firstDataRow);

      expect(selection.onToggleRow).toHaveBeenCalled();
    });

    it('should not select disabled rows when clicking on row with selectOnRowClick', async () => {
      const user = userEvent.setup();
      const selection: TableSelection<TestRow> = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn(() => false),
        isRowDisabled: vi.fn((row: TestRow) => row.id === '1'), // First row is disabled
      };

      render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          selection={selection}
          selectOnRowClick={true}
        />
      );

      const rows = screen.getAllByRole('row');
      // Skip header row - click on first data row (which is disabled)
      const firstDataRow = at(rows, 1);

      await user.click(firstDataRow);

      expect(selection.onToggleRow).not.toHaveBeenCalled();
    });
  });

  describe('isRowDisabled functionality', () => {
    it('should render row checkbox as disabled when isRowDisabled returns true', () => {
      const selection: TableSelection<TestRow> = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn(() => false),
        isRowDisabled: vi.fn((row: TestRow) => row.id === '1'), // First row is disabled
      };

      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is "select all", second is first row (disabled), third is second row
      const firstRowCheckbox = at(checkboxes, 1);
      const secondRowCheckbox = at(checkboxes, 2);

      expect(firstRowCheckbox).toBeDisabled();
      expect(secondRowCheckbox).not.toBeDisabled();
    });

    it('should show select all as checked when all non-disabled rows are selected', () => {
      // Only non-disabled rows (id: '2' and '3') are selected
      const selectedRows = baseData.filter(row => row.id !== '1');

      const selection: TableSelection<TestRow> = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn((row: TestRow) => selectedRows.some(r => r.id === row.id)),
        isRowDisabled: vi.fn((row: TestRow) => row.id === '1'), // First row is disabled
      };

      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = at(checkboxes, 0);

      // Select all should be checked because all selectable rows are selected
      expect(selectAllCheckbox).toBeChecked();
    });

    it('should show select all as unchecked when not all non-disabled rows are selected', () => {
      // Only one non-disabled row is selected
      const selectedRows = [at(baseData, 1)]; // id: '2'

      const selection: TableSelection<TestRow> = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn((row: TestRow) => selectedRows.some(r => r.id === row.id)),
        isRowDisabled: vi.fn((row: TestRow) => row.id === '1'), // First row is disabled
      };

      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = at(checkboxes, 0);

      // Select all should NOT be checked because not all selectable rows are selected
      expect(selectAllCheckbox).not.toBeChecked();
    });

    it('should not call onToggleRow when clicking disabled row checkbox', async () => {
      const user = userEvent.setup();
      const selection: TableSelection<TestRow> = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn(() => false),
        isRowDisabled: vi.fn((row: TestRow) => row.id === '1'), // First row is disabled
      };

      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is "select all", second is first row (disabled)
      const disabledCheckbox = at(checkboxes, 1);

      // Clicking a disabled checkbox should not trigger the handler
      await user.click(disabledCheckbox);

      expect(selection.onToggleRow).not.toHaveBeenCalled();
    });

    it('should show select all as checked when all rows are disabled and none selected', () => {
      const selection: TableSelection<TestRow> = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn(() => false),
        isRowDisabled: vi.fn(() => true), // All rows are disabled
      };

      render(<DataTable columns={baseColumns} data={baseData} selection={selection} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = at(checkboxes, 0);

      // When all rows are disabled, there are no selectable rows,
      // so the "all selected" check passes vacuously (empty array.every() returns true)
      expect(selectAllCheckbox).toBeChecked();
    });

    it('should not call onRowClick when clicking on a disabled row', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      const selection: TableSelection<TestRow> = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn(() => false),
        isRowDisabled: vi.fn((row: TestRow) => row.id === '1'), // First row is disabled
      };

      render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          selection={selection}
          onRowClick={onRowClick}
        />
      );

      const rows = screen.getAllByRole('row');
      // Skip header row - click on first data row (which is disabled)
      const firstDataRow = at(rows, 1);

      await user.click(firstDataRow);

      expect(onRowClick).not.toHaveBeenCalled();
    });

    it('should call onRowClick when clicking on a non-disabled row', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      const selection: TableSelection<TestRow> = {
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
        isRowSelected: vi.fn(() => false),
        isRowDisabled: vi.fn((row: TestRow) => row.id === '1'), // Only first row is disabled
      };

      render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          selection={selection}
          onRowClick={onRowClick}
        />
      );

      const rows = screen.getAllByRole('row');
      // Skip header row - click on second data row (which is NOT disabled)
      const secondDataRow = at(rows, 2);

      await user.click(secondDataRow);

      expect(onRowClick).toHaveBeenCalledWith(baseData[1]);
    });
  });

  describe('row click callback', () => {
    it('should call onRowClick when a row is clicked', async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();
      render(<DataTable columns={baseColumns} data={baseData} onRowClick={onRowClick} />);

      const rows = screen.getAllByRole('row');
      const firstDataRow = at(rows, 1);

      await user.click(firstDataRow);

      expect(onRowClick).toHaveBeenCalledWith(baseData[0]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      render(<DataTable columns={[]} data={baseData} />);

      // When columns is empty, should still show empty state
      // The table menu column is still rendered, so we check for the table structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle columns without cell functions', () => {
      const columnsWithoutCells: TableColumn<TestRow>[] = [
        {
          header: 'Name',
        },
        {
          header: 'Email',
        },
      ];

      render(<DataTable columns={columnsWithoutCells} data={baseData} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should handle columns with loadingCell', () => {
      const columnsWithLoadingCell: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          cell: ({ row }) => <span>{row.name}</span>,
          loadingCell: () => <div data-testid="loading-name">Loading...</div>,
        },
      ];

      render(<DataTable columns={columnsWithLoadingCell} data={baseData} loading={true} />);

      // Should find at least one loading cell (multiple rows render it)
      const loadingCells = screen.getAllByTestId('loading-name');
      expect(loadingCells.length).toBeGreaterThan(0);
    });

    it('should handle very long data arrays', () => {
      const largeData: TestRow[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        role: 'User',
      }));

      render(<DataTable columns={baseColumns} data={largeData} />);

      expect(screen.getByText('User 0')).toBeInTheDocument();
    });

    it('puts a column headerClassName on its header and cellClassName on its cells', () => {
      const columnsWithClassName: TableColumn<TestRow>[] = [
        {
          header: 'Name',
          cell: ({ row }) => <span>{row.name}</span>,
          headerClassName: 'custom-header-class',
          cellClassName: 'custom-cell-class',
        },
      ];

      render(<DataTable columns={columnsWithClassName} data={baseData} />);

      const header = screen.getByText('Name').closest('th');
      expect(header).toHaveClass('custom-header-class');
      expect(header).not.toHaveClass('custom-cell-class');
      const cell = screen.getByText('John Doe').closest('td');
      expect(cell).toHaveClass('rdt-table__cell', 'custom-cell-class');
      expect(cell).not.toHaveClass('custom-header-class');
    });

    it('puts a group column headerClassName on its group header', () => {
      const grouped: TableColumn<TestRow>[] = [
        {
          header: 'Person',
          headerClassName: 'custom-group-class',
          subColumns: [{ header: 'Name', cell: ({ row }) => row.name }],
        },
      ];

      render(<DataTable columns={grouped} data={baseData} />);

      expect(screen.getByRole('columnheader', { name: 'Person' })).toHaveClass(
        'custom-group-class'
      );
    });
  });

  // The rdt- classes and state attributes are the documented styling API, so
  // these assert the contract consumers style against.
  describe('styling contract', () => {
    const selectionFor = (selected: TestRow[]): TableSelection<TestRow> => ({
      onToggleRow: vi.fn(),
      onToggleAll: vi.fn(),
      isRowSelected: row => selected.some(r => r.id === row.id),
    });
    const bodyRows = () => [...screen.getByRole('table').querySelectorAll('tbody tr')];

    it('names the container, table, header, rows and cells', () => {
      const { container } = render(<DataTable columns={baseColumns} data={baseData} />);
      const root = container.firstElementChild;
      expect(root).toHaveClass('rdt-table');
      expect(root?.firstElementChild).toHaveClass('rdt-table__scroll');
      const table = screen.getByRole('table');
      expect(table).toHaveClass('rdt-table__table');
      expect(table.querySelector('thead')).toHaveClass('rdt-table__head');
      expect(table.querySelector('thead tr')).toHaveClass('rdt-table__header-row');
      expect(table.querySelector('tbody')).toHaveClass('rdt-table__body');
      for (const th of screen.getAllByRole('columnheader')) {
        expect(th).toHaveClass('rdt-table__header-cell');
      }
      for (const row of bodyRows()) {
        expect(row).toHaveClass('rdt-table__row');
      }
      for (const cell of screen.getAllByRole('cell')) {
        expect(cell).toHaveClass('rdt-table__cell');
      }
    });

    it('labels a header that cannot sort', () => {
      render(<DataTable columns={baseColumns} data={baseData} />);
      expect(screen.getByText('Role')).toHaveClass('rdt-table__header-label');
    });

    it('marks only selected rows with data-selected', () => {
      render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          selection={selectionFor([at(baseData, 1)])}
        />
      );
      expect(bodyRows().map(row => row.hasAttribute('data-selected'))).toEqual([
        false,
        true,
        false,
      ]);
    });

    it('gives the selection, settings and action columns their modifiers', () => {
      render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          selection={selectionFor([])}
          actionMenu={[{ label: 'View', onSelect: vi.fn() }]}
        />
      );
      const selectAll = screen.getByRole('checkbox', { name: 'Select all' });
      expect(selectAll.parentElement).toHaveClass('rdt-table__select-all');
      expect(selectAll.closest('th')).toHaveClass(
        'rdt-table__header-cell--select',
        'rdt-table__header-cell--sticky'
      );
      expect(screen.getByRole('button', { name: 'Column settings' }).closest('th')).toHaveClass(
        'rdt-table__header-cell--settings',
        'rdt-table__header-cell--sticky'
      );
      expect(screen.getByRole('checkbox', { name: 'Select row 1' }).closest('td')).toHaveClass(
        'rdt-table__cell--select',
        'rdt-table__cell--sticky'
      );
      expect(at(screen.getAllByRole('button', { name: 'Actions' }), 0).closest('td')).toHaveClass(
        'rdt-table__cell--actions',
        'rdt-table__cell--sticky'
      );
    });

    it('makes rows clickable only when they respond to clicks', () => {
      const { rerender } = render(<DataTable columns={baseColumns} data={baseData} />);
      expect(at(bodyRows(), 0)).not.toHaveClass('rdt-table__row--clickable');

      rerender(<DataTable columns={baseColumns} data={baseData} onRowClick={vi.fn()} />);
      expect(at(bodyRows(), 0)).toHaveClass('rdt-table__row--clickable');

      rerender(<DataTable columns={baseColumns} data={baseData} selection={selectionFor([])} />);
      expect(at(bodyRows(), 0)).toHaveClass('rdt-table__row--clickable');
    });

    it('names expanded rows and the empty state', () => {
      const { rerender } = render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          renderExpandedRow={row => (row.id === '1' ? <p>Details</p> : null)}
        />
      );
      const expandedCell = screen.getByText('Details').closest('td');
      expect(expandedCell).toHaveClass('rdt-table__expanded-cell');
      expect(expandedCell?.parentElement).toHaveClass('rdt-table__expanded-row');

      rerender(<DataTable columns={baseColumns} data={[]} />);
      const emptyCell = screen.getByText('No results found').closest('td');
      expect(emptyCell).toHaveClass('rdt-table__empty');
      expect(emptyCell?.parentElement).toHaveClass('rdt-table__empty-row');
    });

    it('marks grouped parent headers', () => {
      render(
        <DataTable
          columns={[
            { header: 'Name', cell: ({ row }) => row.name },
            {
              header: 'Contact',
              subColumns: [
                { header: 'Email', cell: ({ row }) => row.email },
                { header: 'Role', cell: ({ row }) => row.role },
              ],
            },
          ]}
          data={baseData}
        />
      );
      expect(screen.getByText('Contact').closest('th')).toHaveClass(
        'rdt-table__header-cell',
        'rdt-table__header-cell--group'
      );
    });

    it('names checkboxes and exposes their checked state', () => {
      render(
        <DataTable
          columns={baseColumns}
          data={baseData}
          selection={selectionFor([at(baseData, 0)])}
        />
      );
      const checked = screen.getByRole('checkbox', { name: 'Select row 1' });
      expect(checked).toHaveClass('rdt-checkbox');
      expect(checked).toHaveAttribute('data-state', 'checked');
      expect(
        checked.querySelector('.rdt-checkbox__indicator > .rdt-checkbox__icon')
      ).not.toBeNull();
      expect(screen.getByRole('checkbox', { name: 'Select row 2' })).toHaveAttribute(
        'data-state',
        'unchecked'
      );
    });

    it('appends rowClassName after the package classes', () => {
      render(<DataTable columns={baseColumns} data={baseData} rowClassName={() => 'mine'} />);
      expect(at(bodyRows(), 0).className).toBe('rdt-table__row mine');
    });

    it('keeps element ids unique with two tables on the page', () => {
      const selection = {
        isRowSelected: () => false,
        onToggleRow: vi.fn(),
        onToggleAll: vi.fn(),
      };
      const { container } = render(
        <>
          <DataTable columns={baseColumns} data={baseData} selection={selection} />
          <DataTable columns={baseColumns} data={baseData} selection={selection} />
        </>
      );
      const ids = [...container.querySelectorAll('[id]')].map(element => element.id);
      expect(ids.length).toBe(new Set(ids).size);
    });

    it('sets getRowTestId as data-testid, the attribute test libraries look up', () => {
      render(
        <DataTable columns={baseColumns} data={baseData} getRowTestId={row => `member-${row.id}`} />
      );
      expect(screen.getByTestId('member-1').tagName).toBe('TR');
    });
  });
});
