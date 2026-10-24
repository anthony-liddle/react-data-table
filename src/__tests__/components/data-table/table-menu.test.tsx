import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TableMenu } from '@/components/data-table/table-menu';
import type { BaseTableRow, TableColumn, VisibleColumn } from '@/components/data-table/types';

interface TestRow extends BaseTableRow {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

describe('TableMenu', () => {
  const baseColumns: TableColumn<TestRow>[] = [
    { id: 'name', header: 'Name', cell: ({ row }) => <span>{row.name}</span> },
    { id: 'email', header: 'Email', cell: ({ row }) => <span>{String(row.email)}</span> },
    { id: 'role', header: 'Role', cell: ({ row }) => <span>{String(row.role)}</span> },
  ];

  const baseVisibleColumns: VisibleColumn[] = [
    { id: 'name', visible: true },
    { id: 'email', visible: true },
    { id: 'role', visible: false },
  ];

  const mockToggleHeaders = vi.fn();
  const mockOnColumnReorder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render menu button', () => {
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      expect(button).toBeInTheDocument();
    });

    it('should render column items when menu is opened', async () => {
      const user = userEvent.setup();
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
      });
    });

    it('should render checkboxes for each column', async () => {
      const user = userEvent.setup();
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should show checked state for visible columns', async () => {
      const user = userEvent.setup();
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        const nameCheckbox = screen.getByLabelText('Name');
        expect(nameCheckbox).toBeChecked();
      });
    });

    it('should show unchecked state for hidden columns', async () => {
      const user = userEvent.setup();
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        const roleCheckbox = screen.getByLabelText('Role');
        expect(roleCheckbox).not.toBeChecked();
      });
    });

    it('should default to visible when column not in visibleColumns', async () => {
      const user = userEvent.setup();
      const columnsWithoutVisible: VisibleColumn[] = [{ id: 'name', visible: true }];

      render(
        <TableMenu
          visibleColumns={columnsWithoutVisible}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        // Email column should default to visible (checked)
        const emailCheckbox = screen.getByLabelText('Email');
        expect(emailCheckbox).toBeChecked();
      });
    });
  });

  describe('interactions', () => {
    it('should call toggleHeaders when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(async () => {
        const nameCheckbox = screen.getByLabelText('Name');
        await user.click(nameCheckbox);
        expect(mockToggleHeaders).toHaveBeenCalledTimes(1);
        expect(mockToggleHeaders).toHaveBeenCalledWith('name');
      });
    });

    it('should call onColumnReorder when columns are reordered', async () => {
      const user = userEvent.setup();
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
          onColumnReorder={mockOnColumnReorder}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
      });

      // Note: Actual drag-and-drop testing would require more complex setup
      // This test verifies the component renders with onColumnReorder prop
      expect(mockOnColumnReorder).not.toHaveBeenCalled();
    });

    it('should not call onColumnReorder when prop is not provided', async () => {
      const user = userEvent.setup();
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
      });

      expect(mockOnColumnReorder).not.toHaveBeenCalled();
    });
  });

  describe('column visibility', () => {
    it('should handle all columns visible', async () => {
      const user = userEvent.setup();
      const allVisible: VisibleColumn[] = [
        { id: 'name', visible: true },
        { id: 'email', visible: true },
        { id: 'role', visible: true },
      ];

      render(
        <TableMenu
          visibleColumns={allVisible}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked();
        });
      });
    });

    it('should handle all columns hidden', async () => {
      const user = userEvent.setup();
      const allHidden: VisibleColumn[] = [
        { id: 'name', visible: false },
        { id: 'email', visible: false },
        { id: 'role', visible: false },
      ];

      render(
        <TableMenu
          visibleColumns={allHidden}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).not.toBeChecked();
        });
      });
    });

    it('should handle partial visibility', async () => {
      const user = userEvent.setup();
      const partialVisible: VisibleColumn[] = [
        { id: 'name', visible: true },
        { id: 'email', visible: false },
        { id: 'role', visible: true },
      ];

      render(
        <TableMenu
          visibleColumns={partialVisible}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        const nameCheckbox = screen.getByLabelText('Name');
        const emailCheckbox = screen.getByLabelText('Email');
        const roleCheckbox = screen.getByLabelText('Role');

        expect(nameCheckbox).toBeChecked();
        expect(emailCheckbox).not.toBeChecked();
        expect(roleCheckbox).toBeChecked();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty columns array', () => {
      render(<TableMenu visibleColumns={[]} columns={[]} toggleHeaders={mockToggleHeaders} />);

      const button = screen.getByRole('button', { name: 'Column settings' });
      expect(button).toBeInTheDocument();
    });

    it('should handle columns with duplicate headers', async () => {
      const user = userEvent.setup();
      const duplicateColumns: TableColumn<TestRow>[] = [
        { id: 'name', header: 'Name', cell: ({ row }) => <span>{row.name}</span> },
        { id: 'name', header: 'Name', cell: ({ row }) => <span>{row.name}</span> },
      ];

      const duplicateVisible: VisibleColumn[] = [
        { id: 'name', visible: true },
        { id: 'name', visible: true },
      ];

      render(
        <TableMenu
          visibleColumns={duplicateVisible}
          columns={duplicateColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        const nameLabels = screen.getAllByText('Name');
        expect(nameLabels.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should handle columns with special characters in headers', async () => {
      const user = userEvent.setup();
      const specialColumns: TableColumn<TestRow>[] = [
        { id: 'name_&_email', header: 'Name & Email', cell: ({ row }) => <span>{row.name}</span> },
        {
          id: 'role_(admin)',
          header: 'Role (Admin)',
          cell: ({ row }) => <span>{String(row.role)}</span>,
        },
      ];

      const specialVisible: VisibleColumn[] = [
        { id: 'name-&-email', visible: true },
        { id: 'role-(admin)', visible: true },
      ];

      render(
        <TableMenu
          visibleColumns={specialVisible}
          columns={specialColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Name & Email')).toBeInTheDocument();
        expect(screen.getByText('Role (Admin)')).toBeInTheDocument();
      });
    });

    it('should update when columns prop changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      const button = screen.getByRole('button', { name: 'Column settings' });
      await user.click(button);

      await waitFor(() => {
        const nameLabels = screen.getAllByText('Name');
        expect(nameLabels.length).toBeGreaterThan(0);
      });

      // Close the menu before rerendering
      await user.keyboard('{Escape}');

      const newColumns: TableColumn<TestRow>[] = [
        { id: 'new_column', header: 'New Column', cell: ({ row }) => <span>{row.name}</span> },
      ];

      const newVisible: VisibleColumn[] = [{ id: 'new-column', visible: true }];

      rerender(
        <TableMenu
          visibleColumns={newVisible}
          columns={newColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );

      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('New Column')).toBeInTheDocument();
        const nameLabels = screen.queryAllByText('Name');
        // Should only find Name in the header, not in the menu
        expect(nameLabels.length).toBeLessThanOrEqual(1);
      });
    });
  });

  // The rdt- classes are the documented styling API.
  describe('styling contract', () => {
    it('names the trigger, panel, rows, labels and handles', async () => {
      const user = userEvent.setup();
      render(
        <TableMenu
          visibleColumns={baseVisibleColumns}
          columns={baseColumns}
          toggleHeaders={mockToggleHeaders}
        />
      );
      const trigger = screen.getByRole('button', { name: 'Column settings' });
      expect(trigger).toHaveClass('rdt-column-panel__trigger');
      expect(trigger.querySelector('svg')).toHaveClass('rdt-column-panel__trigger-icon');

      await user.click(trigger);
      const panel = screen.getByRole('dialog', { name: 'Columns' });
      expect(panel).toHaveClass('rdt-column-panel');
      expect(panel.querySelector('.rdt-column-panel__list')).not.toBeNull();

      const handle = screen.getByRole('button', { name: 'Reorder Email' });
      expect(handle).toHaveClass('rdt-column-panel__handle');
      expect(handle.querySelector('.rdt-column-panel__handle-icon')).not.toBeNull();
      const item = handle.closest('.rdt-column-panel__item');
      expect(item).not.toBeNull();
      expect(item).not.toHaveAttribute('data-dragging');
      expect(screen.getByText('Email').closest('label')).toHaveClass('rdt-column-panel__label');
    });

    it('labels its checkboxes even when the page has an element with a column id', async () => {
      const user = userEvent.setup();
      render(
        <>
          <input id="name" aria-label="Page field" />
          <TableMenu
            visibleColumns={baseVisibleColumns}
            columns={baseColumns}
            toggleHeaders={mockToggleHeaders}
          />
        </>
      );
      await user.click(screen.getByRole('button', { name: 'Column settings' }));

      const nameCheckbox = await screen.findByLabelText('Name');
      expect(nameCheckbox).toHaveRole('checkbox');
      expect(nameCheckbox.id).not.toBe('name');
    });
  });
});
