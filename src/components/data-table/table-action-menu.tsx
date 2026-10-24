'use client';

import type { ComponentPropsWithRef, ComponentType, ReactNode } from 'react';

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
import type { BaseTableRow, TableActionMenuItem, TableActionMenuSubItem } from './types.ts';

/**
 * Props the injectable link component receives. The default is a plain `<a>`;
 * framework routers slot in directly (e.g. `linkComponent={Link}` with
 * Next.js). The menu passes its item role, focus handling and a ref through
 * the link, so a custom component must spread the rest of its props onto the
 * anchor and forward its ref, or keyboard users can't reach the item.
 */
export type ActionMenuLinkProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & {
  href: string;
  children?: ReactNode;
};

export type ActionMenuLinkComponent = ComponentType<ActionMenuLinkProps> | 'a';

interface TableActionMenuProps<TData extends BaseTableRow = BaseTableRow> {
  items: TableActionMenuItem<TData>[];
  row: TData;
  /** Component used to render `href` items. Defaults to a plain `<a>` tag. */
  linkComponent?: ActionMenuLinkComponent;
}

type RowValue<T, TData> = T | ((params: { row: TData }) => T);

// Item fields are either a value or a function of the row.
const resolve = <T, TData>(value: RowValue<T, TData>, row: TData): T =>
  typeof value === 'function' ? (value as (params: { row: TData }) => T)({ row }) : value;

const isHidden = <TData,>(item: { hidden?: RowValue<boolean, TData> }, row: TData) =>
  item.hidden != null && resolve(item.hidden, row);

export const TableActionMenu = <TData extends BaseTableRow = BaseTableRow>({
  items,
  row,
  linkComponent: Link = 'a',
}: TableActionMenuProps<TData>) => {
  // An item with sub-items shows only while at least one of them does.
  const visibleItems = items.filter(
    item =>
      !isHidden(item, row) && (!item.subItems || item.subItems.some(sub => !isHidden(sub, row)))
  );

  if (visibleItems.length === 0) {
    return null;
  }

  // One menu item, from either level. Radix's onSelect runs for pointer and
  // keyboard alike; a link item renders as the link itself. A top-level item's
  // content sits in its own box, which gives it its taller padding.
  const renderItem = (
    item: TableActionMenuItem<TData> | TableActionMenuSubItem<TData>,
    topLevel: boolean
  ) => {
    const label = resolve(item.label, row);
    const icon = item.icon == null ? null : resolve(item.icon, row);
    const href = item.href == null ? undefined : resolve(item.href, row);
    const disabled = item.disabled == null ? false : resolve(item.disabled, row);
    const onSelect = () => item.onSelect?.({ row });

    if (href !== undefined) {
      return (
        <DropdownMenuItem key={stringToKey(label)} asChild disabled={disabled} onSelect={onSelect}>
          <Link href={href} className="rdt-action-menu__link">
            {icon && (
              <span className="rdt-action-menu__icon rdt-action-menu__icon--link">{icon}</span>
            )}
            {label}
          </Link>
        </DropdownMenuItem>
      );
    }
    const content = (
      <>
        {icon && <span className="rdt-action-menu__icon">{icon}</span>}
        {label}
      </>
    );
    return (
      <DropdownMenuItem key={stringToKey(label)} disabled={disabled} onSelect={onSelect}>
        {topLevel ? <span className="rdt-action-menu__content">{content}</span> : content}
      </DropdownMenuItem>
    );
  };

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
          if (!item.subItems) {
            return renderItem(item, true);
          }
          const label = resolve(item.label, row);
          const icon = item.icon == null ? null : resolve(item.icon, row);
          return (
            <DropdownMenuSub key={stringToKey(label)}>
              <DropdownMenuSubTrigger>
                {icon && <span className="rdt-action-menu__icon">{icon}</span>}
                {label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {item.subItems
                  .filter(sub => !isHidden(sub, row))
                  .map(sub => renderItem(sub, false))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
