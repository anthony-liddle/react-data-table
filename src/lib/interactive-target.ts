// Controls a row click must leave alone: clicking one does what the control
// does, not what the row does.
const INTERACTIVE = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[contenteditable]:not([contenteditable="false"])',
].join(', ');

// Duck-typed rather than `instanceof Node`: a table rendered into an iframe
// gets its nodes from the iframe's realm, which fail this page's `instanceof`.
const isNode = (target: EventTarget | null): target is Node =>
  target !== null && typeof (target as Node).nodeType === 'number';

/**
 * Whether a click on a row started on a control rather than on the row itself.
 * A click from outside the row's DOM counts as a control: React bubbles clicks
 * from a portal (a popover or menu opened from a cell) up through the row. Only
 * controls inside the row count, so a table inside a `<label>` still works.
 */
export const isInteractiveTarget = ({
  target,
  currentTarget,
}: {
  target: EventTarget | null;
  currentTarget: Element;
}): boolean => {
  if (!isNode(target) || !currentTarget.contains(target)) {
    return true;
  }
  const element =
    target.nodeType === Node.ELEMENT_NODE ? (target as Element) : target.parentElement;
  const control = element?.closest(INTERACTIVE);
  return control != null && currentTarget.contains(control);
};
