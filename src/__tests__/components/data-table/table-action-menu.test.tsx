import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TableActionMenu } from '@/components/data-table/table-action-menu';
import type { BaseTableRow, TableActionMenuItem } from '@/components/data-table/types';

interface TestRow extends BaseTableRow {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

describe('TableActionMenu', () => {
  const mockRow: TestRow = {
    id: '1',
    name: 'Test User',
    status: 'active',
  };

  describe('rendering', () => {
    it('should render action menu button', () => {
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      expect(button).toBeInTheDocument();
    });

    it('should render menu items when opened', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          callbackAction: vi.fn(),
        },
        {
          label: 'Edit',
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should render static label', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Static Label',
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('Static Label')).toBeInTheDocument();
    });

    it('should render dynamic label from function', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: ({ row }) => `Edit ${row.name}`,
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('Edit Test User')).toBeInTheDocument();
    });

    it('should render static icon', async () => {
      const user = userEvent.setup();
      const TestIcon = () => <span data-testid="test-icon">Icon</span>;
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          icon: <TestIcon />,
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should render dynamic icon from function', async () => {
      const user = userEvent.setup();
      const TestIcon = () => <span data-testid="dynamic-icon">Icon</span>;
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          icon: ({ row }) => (row.status === 'active' ? <TestIcon /> : null),
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByTestId('dynamic-icon')).toBeInTheDocument();
    });

    it('should render icon as null when function returns null', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          icon: ({ row }) => (row.status === 'inactive' ? <span>Icon</span> : null),
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.queryByText('Icon')).not.toBeInTheDocument();
    });

    it('should render link when href is provided', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          href: '/users/1',
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Radix UI renders links as menuitem role
      const link = screen.getByRole('menuitem', { name: 'View' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/users/1');
    });

    it('should render link when href is a function', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          href: ({ row }) => `/users/${row.id}`,
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Radix UI renders links as menuitem role
      const link = screen.getByRole('menuitem', { name: 'View' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/users/1');
    });

    it('should render button when href is not provided', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Edit',
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const menuButton = screen.getByRole('button', { name: 'Edit' });
      expect(menuButton).toBeInTheDocument();
      expect(menuButton.tagName).toBe('BUTTON');
    });
  });

  describe('interactions', () => {
    it('should call callbackAction when item is clicked', async () => {
      const user = userEvent.setup();
      const callbackAction = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Edit',
          callbackAction,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const menuButton = screen.getByRole('button', { name: 'Edit' });
      await user.click(menuButton);

      expect(callbackAction).toHaveBeenCalledTimes(1);
      expect(callbackAction).toHaveBeenCalledWith({ row: mockRow });
    });

    it('should call callbackAction when link item is clicked', async () => {
      const user = userEvent.setup();
      const callbackAction = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          href: '/users/1',
          callbackAction,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Radix UI renders links as menuitem role
      const link = screen.getByRole('menuitem', { name: 'View' });
      await user.click(link);

      expect(callbackAction).toHaveBeenCalledTimes(1);
      expect(callbackAction).toHaveBeenCalledWith({ row: mockRow });
    });

    it('should not call callbackAction when it is not provided', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          href: '/users/1',
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Radix UI renders links as menuitem role
      const link = screen.getByRole('menuitem', { name: 'View' });
      await user.click(link);

      // Should not throw an error
      expect(link).toBeInTheDocument();
    });

    it('should handle multiple items with different configurations', async () => {
      const user = userEvent.setup();
      const viewCallback = vi.fn();
      const editCallback = vi.fn();
      const deleteCallback = vi.fn();

      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          href: ({ row }) => `/users/${row.id}`,
          callbackAction: viewCallback,
        },
        {
          label: ({ row }) => `Edit ${row.name}`,
          callbackAction: editCallback,
        },
        {
          label: 'Delete',
          callbackAction: deleteCallback,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit Test User')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(deleteButton);

      expect(deleteCallback).toHaveBeenCalledTimes(1);
      expect(deleteCallback).toHaveBeenCalledWith({ row: mockRow });
    });
  });

  describe('hidden property', () => {
    it('should not render items with hidden: true', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Visible',
          callbackAction: vi.fn(),
        },
        {
          label: 'Hidden',
          callbackAction: vi.fn(),
          hidden: true,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('Visible')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('should render items with hidden: false', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Visible',
          callbackAction: vi.fn(),
          hidden: false,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('Visible')).toBeInTheDocument();
    });

    it('should conditionally hide items based on hidden function', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Active Only',
          callbackAction: vi.fn(),
          hidden: ({ row }) => row.status !== 'active',
        },
        {
          label: 'Inactive Only',
          callbackAction: vi.fn(),
          hidden: ({ row }) => row.status !== 'inactive',
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // mockRow has status: 'active', so "Active Only" should be visible
      expect(screen.getByText('Active Only')).toBeInTheDocument();
      // "Inactive Only" should be hidden
      expect(screen.queryByText('Inactive Only')).not.toBeInTheDocument();
    });

    it('should not render menu button when all items are hidden', () => {
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Hidden 1',
          callbackAction: vi.fn(),
          hidden: true,
        },
        {
          label: 'Hidden 2',
          callbackAction: vi.fn(),
          hidden: ({ row }) => row.status === 'active',
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
    });
  });

  describe('disabled property', () => {
    it('should render a disabled item as aria-disabled', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Delete',
          callbackAction: vi.fn(),
          disabled: true,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const item = screen.getByRole('menuitem', { name: 'Delete' });
      expect(item).toHaveAttribute('aria-disabled', 'true');
    });

    it('should conditionally disable items based on a function', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Delete',
          callbackAction: vi.fn(),
          disabled: ({ row }) => row.status === 'active',
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // mockRow has status: 'active', so Delete should be disabled
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });

    it('should keep the item interactive when disabled is false', async () => {
      const user = userEvent.setup();
      const callbackAction = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Delete',
          callbackAction,
          disabled: false,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const menuButton = screen.getByRole('button', { name: 'Delete' });
      await user.click(menuButton);

      expect(callbackAction).toHaveBeenCalledTimes(1);
      expect(callbackAction).toHaveBeenCalledWith({ row: mockRow });
    });
  });

  describe('edge cases', () => {
    it('should not render menu when items array is empty', () => {
      const items: TableActionMenuItem<TestRow>[] = [];

      render(<TableActionMenu items={items} row={mockRow} />);

      expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
    });

    it('should handle label function returning empty string', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: () => '',
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Menu should still render, but with empty label
      const menuContent = screen.getByRole('menu');
      expect(menuContent).toBeInTheDocument();
    });

    it('should handle href function returning empty string', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          href: () => '',
          callbackAction: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Radix UI renders links as menuitem role
      const link = screen.getByRole('menuitem', { name: 'View' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '');
    });
  });

  describe('subItems (submenus)', () => {
    it('should render submenu trigger when subItems are provided', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [
            { label: 'Make editor', callbackAction: vi.fn() },
            { label: 'Make viewer', callbackAction: vi.fn() },
          ],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('Change role')).toBeInTheDocument();
    });

    it('should render subItems when hovering over submenu trigger', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [
            { label: 'Make admin', callbackAction: vi.fn() },
            { label: 'Make viewer', callbackAction: vi.fn() },
          ],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const submenuTrigger = screen.getByText('Change role');
      await user.hover(submenuTrigger);

      expect(await screen.findByText('Make admin')).toBeInTheDocument();
      expect(screen.getByText('Make viewer')).toBeInTheDocument();
    });

    it('should call subItem callbackAction when clicked', async () => {
      const user = userEvent.setup();
      const makeAdminCallback = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [
            { label: 'Make admin', callbackAction: makeAdminCallback },
            { label: 'Make viewer', callbackAction: vi.fn() },
          ],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const submenuTrigger = screen.getByText('Change role');
      await user.hover(submenuTrigger);

      // Wait for submenu to appear and get the menuitem
      const makeAdminOption = await screen.findByRole('menuitem', { name: 'Make admin' });
      // Use pointer down/up for Radix UI submenu items
      await user.pointer({ keys: '[MouseLeft]', target: makeAdminOption });

      expect(makeAdminCallback).toHaveBeenCalledTimes(1);
      expect(makeAdminCallback).toHaveBeenCalledWith({ row: mockRow });
    });

    it('should not render subItems with hidden: true', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [
            { label: 'Make admin', callbackAction: vi.fn() },
            { label: 'Hidden role', callbackAction: vi.fn(), hidden: true },
            { label: 'Make viewer', callbackAction: vi.fn() },
          ],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const submenuTrigger = screen.getByText('Change role');
      await user.hover(submenuTrigger);

      expect(await screen.findByText('Make admin')).toBeInTheDocument();
      expect(screen.getByText('Make viewer')).toBeInTheDocument();
      expect(screen.queryByText('Hidden role')).not.toBeInTheDocument();
    });

    it('should render subItems with hidden: false', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [{ label: 'Make admin', callbackAction: vi.fn(), hidden: false }],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const submenuTrigger = screen.getByText('Change role');
      await user.hover(submenuTrigger);

      expect(await screen.findByText('Make admin')).toBeInTheDocument();
    });

    it('should conditionally hide subItems based on hidden function', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [
            {
              label: 'Active only role',
              callbackAction: vi.fn(),
              hidden: ({ row }) => row.status !== 'active',
            },
            {
              label: 'Inactive only role',
              callbackAction: vi.fn(),
              hidden: ({ row }) => row.status !== 'inactive',
            },
            { label: 'Always Visible', callbackAction: vi.fn() },
          ],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const submenuTrigger = screen.getByText('Change role');
      await user.hover(submenuTrigger);

      // mockRow has status: 'active'
      expect(await screen.findByText('Active only role')).toBeInTheDocument();
      expect(screen.getByText('Always Visible')).toBeInTheDocument();
      expect(screen.queryByText('Inactive only role')).not.toBeInTheDocument();
    });

    it('should not render submenu when all subItems are hidden', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Regular Action',
          callbackAction: vi.fn(),
        },
        {
          label: 'Change role',
          subItems: [
            { label: 'Hidden 1', callbackAction: vi.fn(), hidden: true },
            {
              label: 'Hidden 2',
              callbackAction: vi.fn(),
              hidden: ({ row }) => row.status === 'active',
            },
          ],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Regular action should be visible
      expect(screen.getByText('Regular Action')).toBeInTheDocument();
      // Submenu with all hidden items should not be rendered
      expect(screen.queryByText('Change role')).not.toBeInTheDocument();
    });

    it('should not render menu button when only item is submenu with all hidden subItems', () => {
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [
            { label: 'Hidden 1', callbackAction: vi.fn(), hidden: true },
            { label: 'Hidden 2', callbackAction: vi.fn(), hidden: true },
          ],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();
    });

    it('should render submenu with icon on trigger', async () => {
      const user = userEvent.setup();
      const TestIcon = () => <span data-testid="submenu-icon">Icon</span>;
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          icon: <TestIcon />,
          subItems: [{ label: 'Make admin', callbackAction: vi.fn() }],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByTestId('submenu-icon')).toBeInTheDocument();
    });

    it('should handle subItems with empty array', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Regular Action',
          callbackAction: vi.fn(),
        },
        {
          label: 'Empty Submenu',
          subItems: [],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Regular action should be visible
      expect(screen.getByText('Regular Action')).toBeInTheDocument();
      // Empty submenu should not be rendered
      expect(screen.queryByText('Empty Submenu')).not.toBeInTheDocument();
    });

    it('should handle mix of regular items and submenus', async () => {
      const user = userEvent.setup();
      const regularCallback = vi.fn();
      const subItemCallback = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          href: '/view',
        },
        {
          label: 'Edit',
          callbackAction: regularCallback,
        },
        {
          label: 'Change role',
          subItems: [{ label: 'Make admin', callbackAction: subItemCallback }],
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Change role')).toBeInTheDocument();
    });
  });

  // The rdt- classes are the documented styling API.
  describe('styling contract', () => {
    const items: TableActionMenuItem<TestRow>[] = [
      { label: 'View', href: '/users/1', icon: <svg data-testid="view-icon" /> },
      { label: 'Edit', callbackAction: vi.fn(), icon: <svg data-testid="edit-icon" /> },
      { label: 'Change role', subItems: [{ label: 'Make admin', callbackAction: vi.fn() }] },
    ];

    it('names the trigger, the menu and its items', async () => {
      const user = userEvent.setup();
      render(<TableActionMenu items={items} row={mockRow} />);
      const trigger = screen.getByRole('button', { name: 'Actions' });
      expect(trigger).toHaveClass('rdt-action-menu__trigger');
      expect(trigger.querySelector('svg')).toHaveClass('rdt-action-menu__trigger-icon');

      await user.click(trigger);
      expect(screen.getByRole('menu')).toHaveClass('rdt-menu');
      expect(screen.getByRole('menuitem', { name: 'View' })).toHaveClass(
        'rdt-menu__item',
        'rdt-action-menu__link'
      );
      expect(screen.getByTestId('view-icon').parentElement).toHaveClass(
        'rdt-action-menu__icon',
        'rdt-action-menu__icon--link'
      );
      const editButton = screen.getByText('Edit').closest('button');
      expect(editButton).toHaveClass('rdt-action-menu__button');
      expect(editButton?.closest('[role="menuitem"]')).toHaveClass('rdt-menu__item');
      expect(screen.getByTestId('edit-icon').parentElement).toHaveClass('rdt-action-menu__icon');
      const subTrigger = screen.getByRole('menuitem', { name: 'Change role' });
      expect(subTrigger).toHaveClass('rdt-menu__sub-trigger');
      expect(subTrigger.querySelector('.rdt-menu__chevron')).not.toBeNull();
    });

    it('marks submenu content', async () => {
      const user = userEvent.setup();
      render(<TableActionMenu items={items} row={mockRow} />);
      await user.click(screen.getByRole('button', { name: 'Actions' }));
      await user.hover(screen.getByText('Change role'));
      const subItem = await screen.findByText('Make admin');
      expect(subItem.closest('[role="menu"]')).toHaveClass('rdt-menu', 'rdt-menu--sub');
      expect(subItem.closest('[role="menuitem"]')).toHaveClass('rdt-menu__item');
    });
  });
});
