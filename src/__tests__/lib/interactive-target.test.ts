import { afterEach, describe, expect, it } from 'vitest';

import { isInteractiveTarget } from '@/lib/interactive-target';

// A row with one cell per kind of content, built as plain DOM.
const buildRow = () => {
  document.body.innerHTML = `
    <table><tbody><tr id="row"><td>
      <span id="text">Ada</span>
      <button id="button"><span id="in-button">Edit</span></button>
      <a id="link" href="#ada">Profile</a>
      <a id="anchor">No href</a>
      <input id="input" />
      <select id="select"></select>
      <textarea id="textarea"></textarea>
      <label id="label">Name</label>
      <span id="role-button" role="button">Go</span>
      <span id="role-checkbox" role="checkbox">Pick</span>
      <span id="menuitem" role="menuitem">Item</span>
      <div id="editable" contenteditable="true">Notes</div>
      <div id="not-editable" contenteditable="false">Fixed</div>
    </td></tr></tbody></table>
    <div id="portal"><button id="in-portal">Menu item</button></div>
  `;
  return document.getElementById('row') as HTMLElement;
};

const clickOn = (id: string, row: HTMLElement) =>
  isInteractiveTarget({ target: document.getElementById(id), currentTarget: row });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('isInteractiveTarget', () => {
  it.each([
    'button',
    'in-button',
    'link',
    'input',
    'select',
    'textarea',
    'label',
    'role-button',
    'role-checkbox',
    'menuitem',
    'editable',
  ])('treats a click on #%s as a control', id => {
    expect(clickOn(id, buildRow())).toBe(true);
  });

  it.each(['text', 'anchor', 'not-editable'])('treats a click on #%s as a row click', id => {
    expect(clickOn(id, buildRow())).toBe(false);
  });

  it('treats a click outside the row, as from a portal, as a control', () => {
    expect(clickOn('in-portal', buildRow())).toBe(true);
  });

  it('ignores controls that wrap the whole table', () => {
    document.body.innerHTML =
      '<label><table><tbody><tr id="row"><td><span id="text">Ada</span></td></tr></tbody></table></label>';
    const row = document.getElementById('row') as HTMLElement;
    expect(clickOn('text', row)).toBe(false);
  });
});
