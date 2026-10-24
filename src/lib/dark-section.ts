/**
 * Whether an element sits in a `.dark` section. Menus and the column panel
 * render at the end of <body>, outside the section, so they copy `.dark` onto
 * themselves when their trigger is in one.
 */
export const isInDarkSection = (element: Element | null): boolean =>
  element?.closest('.dark') != null;
