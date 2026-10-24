import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  type ActionMenuLinkProps,
  TableActionMenu,
} from '@/components/data-table/table-action-menu';
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
        },
        {
          label: 'Edit',
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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

    it('renders an item without href as a plain menu item, with no control inside', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Edit',
          onSelect: vi.fn(),
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const item = screen.getByRole('menuitem', { name: 'Edit' });
      expect(item.tagName).not.toBe('A');
      expect(item.querySelector('button, a')).toBeNull();
    });
  });

  describe('interactions', () => {
    it('should call onSelect when item is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Edit',
          onSelect,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const menuButton = screen.getByRole('menuitem', { name: 'Edit' });
      await user.click(menuButton);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ row: mockRow });
    });

    it('runs an item chosen from the keyboard', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(<TableActionMenu items={[{ label: 'Edit', onSelect }]} row={mockRow} />);

      screen.getByRole('button', { name: 'Actions' }).focus();
      await user.keyboard('{Enter}');
      await screen.findByRole('menu');
      await user.keyboard('{ArrowDown}{Enter}');

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ row: mockRow });
    });

    it('runs a link item through a custom linkComponent from the keyboard', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      // A router link that follows the documented contract: spread the rest,
      // forward the ref.
      const RouterLink = forwardRef<HTMLAnchorElement, ActionMenuLinkProps>((props, ref) => (
        <a ref={ref} data-router="yes" {...props} />
      ));
      render(
        <TableActionMenu
          items={[{ label: 'View', href: '/users/1', onSelect }]}
          row={mockRow}
          linkComponent={RouterLink}
        />
      );

      screen.getByRole('button', { name: 'Actions' }).focus();
      await user.keyboard('{Enter}');
      const link = await screen.findByRole('menuitem', { name: 'View' });
      expect(link).toHaveAttribute('data-router', 'yes');
      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalledWith({ row: mockRow });
    });

    it('should call onSelect when link item is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'View',
          href: '/users/1',
          onSelect,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      // Radix UI renders links as menuitem role
      const link = screen.getByRole('menuitem', { name: 'View' });
      await user.click(link);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ row: mockRow });
    });

    it('should not call onSelect when it is not provided', async () => {
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

      // Choosing it closes the menu without needing an onSelect
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
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
          onSelect: viewCallback,
        },
        {
          label: ({ row }) => `Edit ${row.name}`,
          onSelect: editCallback,
        },
        {
          label: 'Delete',
          onSelect: deleteCallback,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Edit Test User')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();

      const deleteButton = screen.getByRole('menuitem', { name: 'Delete' });
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
          onSelect: vi.fn(),
        },
        {
          label: 'Hidden',
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
          hidden: ({ row }) => row.status !== 'active',
        },
        {
          label: 'Inactive Only',
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
          hidden: true,
        },
        {
          label: 'Hidden 2',
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
      const onSelect = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Delete',
          onSelect,
          disabled: false,
        },
      ];

      render(<TableActionMenu items={items} row={mockRow} />);

      const button = screen.getByRole('button', { name: 'Actions' });
      await user.click(button);

      const menuButton = screen.getByRole('menuitem', { name: 'Delete' });
      await user.click(menuButton);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith({ row: mockRow });
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
          onSelect: vi.fn(),
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
          onSelect: vi.fn(),
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
            { label: 'Make editor', onSelect: vi.fn() },
            { label: 'Make viewer', onSelect: vi.fn() },
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
            { label: 'Make admin', onSelect: vi.fn() },
            { label: 'Make viewer', onSelect: vi.fn() },
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

    it('should call subItem onSelect when clicked', async () => {
      const user = userEvent.setup();
      const makeAdminCallback = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [
            { label: 'Make admin', onSelect: makeAdminCallback },
            { label: 'Make viewer', onSelect: vi.fn() },
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

    it('gives sub-items the same href, icon and disabled options as items', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'More',
          subItems: [
            { label: 'Profile', href: ({ row }) => `/users/${row.id}` },
            { label: 'Copy id', icon: <svg data-testid="copy-icon" />, onSelect: vi.fn() },
            { label: 'Remove', onSelect: vi.fn(), disabled: ({ row }) => row.status === 'active' },
          ],
        },
      ];
      render(<TableActionMenu items={items} row={mockRow} />);
      await user.click(screen.getByRole('button', { name: 'Actions' }));
      await user.hover(screen.getByText('More'));

      const profile = await screen.findByRole('menuitem', { name: 'Profile' });
      expect(profile.tagName).toBe('A');
      expect(profile).toHaveAttribute('href', '/users/1');
      expect(screen.getByTestId('copy-icon').parentElement).toHaveClass('rdt-action-menu__icon');
      expect(screen.getByRole('menuitem', { name: 'Remove' })).toHaveAttribute(
        'aria-disabled',
        'true'
      );
    });

    it('runs a sub-item chosen from the keyboard', async () => {
      const user = userEvent.setup();
      const makeAdmin = vi.fn();
      const items: TableActionMenuItem<TestRow>[] = [
        { label: 'Change role', subItems: [{ label: 'Make admin', onSelect: makeAdmin }] },
      ];
      render(<TableActionMenu items={items} row={mockRow} />);

      screen.getByRole('button', { name: 'Actions' }).focus();
      await user.keyboard('{Enter}');
      await screen.findByRole('menu');
      await user.keyboard('{ArrowRight}');
      await screen.findByRole('menuitem', { name: 'Make admin' });
      await user.keyboard('{Enter}');

      expect(makeAdmin).toHaveBeenCalledWith({ row: mockRow });
    });

    it('should not render subItems with hidden: true', async () => {
      const user = userEvent.setup();
      const items: TableActionMenuItem<TestRow>[] = [
        {
          label: 'Change role',
          subItems: [
            { label: 'Make admin', onSelect: vi.fn() },
            { label: 'Hidden role', onSelect: vi.fn(), hidden: true },
            { label: 'Make viewer', onSelect: vi.fn() },
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
          subItems: [{ label: 'Make admin', onSelect: vi.fn(), hidden: false }],
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
              onSelect: vi.fn(),
              hidden: ({ row }) => row.status !== 'active',
            },
            {
              label: 'Inactive only role',
              onSelect: vi.fn(),
              hidden: ({ row }) => row.status !== 'inactive',
            },
            { label: 'Always Visible', onSelect: vi.fn() },
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
          onSelect: vi.fn(),
        },
        {
          label: 'Change role',
          subItems: [
            { label: 'Hidden 1', onSelect: vi.fn(), hidden: true },
            {
              label: 'Hidden 2',
              onSelect: vi.fn(),
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
            { label: 'Hidden 1', onSelect: vi.fn(), hidden: true },
            { label: 'Hidden 2', onSelect: vi.fn(), hidden: true },
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
          subItems: [{ label: 'Make admin', onSelect: vi.fn() }],
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
          onSelect: vi.fn(),
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
          onSelect: regularCallback,
        },
        {
          label: 'Change role',
          subItems: [{ label: 'Make admin', onSelect: subItemCallback }],
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
      { label: 'Edit', onSelect: vi.fn(), icon: <svg data-testid="edit-icon" /> },
      { label: 'Change role', subItems: [{ label: 'Make admin', onSelect: vi.fn() }] },
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
      const editItem = screen.getByRole('menuitem', { name: 'Edit' });
      expect(editItem).toHaveClass('rdt-menu__item');
      expect(screen.getByText('Edit')).toHaveClass('rdt-action-menu__content');
      expect(screen.getByText('Edit').parentElement).toBe(editItem);
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
