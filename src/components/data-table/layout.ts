/**
 * The columns around a table's data columns: an expand column and a checkbox
 * column before them, and one trailing column under the settings button,
 * which holds each row's action menu or an empty cell. Every row the table
 * renders takes its cell counts from here, so none spans a different width
 * from the header.
 */
export interface TableLayout {
  /** A leading expand column. */
  expand: boolean;
  /** A leading checkbox column. */
  select: boolean;
  /** The trailing column: row menus, an empty cell under the settings button, or none. */
  trailing: 'actions' | 'settings' | null;
  leadingCount: number;
  trailingCount: number;
}

export const getTableLayout = ({
  expand,
  select,
  actionMenu,
  hideTableSettings,
}: {
  expand: boolean;
  select: boolean;
  actionMenu: boolean;
  hideTableSettings: boolean;
}): TableLayout => {
  const trailing = actionMenu ? 'actions' : hideTableSettings ? null : 'settings';
  return {
    expand,
    select,
    trailing,
    leadingCount: Number(expand) + Number(select),
    trailingCount: trailing ? 1 : 0,
  };
};
