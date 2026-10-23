'use client';

import { type ComponentType, type ReactNode, useCallback } from 'react';

import { stringToKey } from '../../helpers/strings.ts';
import { MoreVert } from '../icon.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx';
import type { BaseTableRow, TableActionMenuItem } from './types.ts';

/**
 * Props the injectable link component must accept. The default is a plain
 * `<a>`; framework routers slot in directly (e.g. `linkComponent={Link}` with
 * Next.js).
 */
export interface ActionMenuLinkProps {
  href: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children?: ReactNode;
}

export type ActionMenuLinkComponent = ComponentType<ActionMenuLinkProps> | 'a';

interface TableActionMenuProps<TData extends BaseTableRow = BaseTableRow> {
  items: TableActionMenuItem<TData>[];
  row: TData;
  /** Component used to render `href` items. Defaults to a plain `<a>` tag. */
  linkComponent?: ActionMenuLinkComponent;
}

export const TableActionMenu = <TData extends BaseTableRow = BaseTableRow>({
  items,
  row,
  linkComponent: Link = 'a',
}: TableActionMenuProps<TData>) => {
  const handleItemClick = useCallback(
    (item: TableActionMenuItem<TData>) => {
      item.callbackAction?.({ row });
    },
    [row]
  );

  // Filter out hidden items and items with all subItems hidden
  const visibleItems = items.filter(item => {
    // Check if the item itself is hidden
    if (item.hidden !== undefined && item.hidden !== null) {
      const isHidden = typeof item.hidden === 'function' ? item.hidden({ row }) : item.hidden;
      if (isHidden) {
        return false;
      }
    }

    // If item has subItems, check if at least one subItem is visible
    if (item.subItems) {
      const hasVisibleSubItem = item.subItems.some(subItem => {
        if (subItem.hidden === undefined || subItem.hidden === null) {
          return true;
        }
        const isHidden =
          typeof subItem.hidden === 'function' ? subItem.hidden({ row }) : subItem.hidden;
        return !isHidden;
      });
      // If no visible subItems, filter out this item
      if (!hasVisibleSubItem) {
        return false;
      }
    }

    return true;
  });

  // Don't render anything if no visible items
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rdt-action-menu__trigger" aria-label="Actions">
          <MoreVert className="rdt-action-menu__trigger-icon" />
        </button>
      </DropdownMenuTrigger>
      {/* A high z-index keeps row actions above modal overlays, so the menu
          stays clickable when a DataTable is rendered inside a dialog. The
          menu portals to <body>, so this is also safe for non-modal tables. */}
      <DropdownMenuContent align="end" sideOffset={5}>
        {visibleItems.map(item => {
          const label = typeof item.label === 'function' ? item.label({ row }) : item.label;
          const icon =
            item.icon && typeof item.icon === 'function' ? item.icon({ row }) : item.icon;
          const href =
            item.href && typeof item.href === 'function' ? item.href({ row }) : item.href;
          // allows for empty strings
          const isLink = href !== undefined && href !== null;
          const isDisabled =
            item.disabled === undefined || item.disabled === null
              ? false
              : typeof item.disabled === 'function'
                ? item.disabled({ row })
                : item.disabled;

          // Render as submenu if subItems exist
          if (item.subItems && item.subItems.length > 0) {
            // Filter out hidden subItems
            const visibleSubItems = item.subItems.filter(subItem => {
              if (subItem.hidden === undefined || subItem.hidden === null) {
                return true;
              }
              const isHidden =
                typeof subItem.hidden === 'function' ? subItem.hidden({ row }) : subItem.hidden;
              return !isHidden;
            });

            // Don't render submenu if no visible subItems
            if (visibleSubItems.length === 0) {
              return null;
            }

            return (
              <DropdownMenuSub key={stringToKey(label)}>
                <DropdownMenuSubTrigger>
                  {icon && <span className="rdt-action-menu__icon">{icon}</span>}
                  {label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {visibleSubItems.map(subItem => (
                    <DropdownMenuItem
                      key={stringToKey(subItem.label)}
                      onSelect={() => subItem.callbackAction({ row })}
                    >
                      {subItem.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          }

          return (
            <DropdownMenuItem key={stringToKey(label)} asChild={isLink} disabled={isDisabled}>
              {isLink ? (
                <Link
                  href={href}
                  className="rdt-action-menu__link"
                  onClick={e => {
                    if (process.env.NODE_ENV === 'test') {
                      e.preventDefault();
                    }
                    handleItemClick(item);
                  }}
                >
                  {icon && (
                    <span className="rdt-action-menu__icon rdt-action-menu__icon--link">
                      {icon}
                    </span>
                  )}
                  {label}
                </Link>
              ) : (
                <button
                  type="button"
                  className="rdt-action-menu__button"
                  onClick={() => handleItemClick(item)}
                >
                  {icon && <span className="rdt-action-menu__icon">{icon}</span>}
                  {label}
                </button>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
