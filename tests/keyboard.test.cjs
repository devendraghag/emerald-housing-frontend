const test = require('node:test');
const assert = require('node:assert/strict');
const { focusElement, closeDisclosure, closeDisclosureOnBlur } = require('../src/util/keyboard.cjs');
test('Escape closes an open disclosure and returns focus to its trigger', () => {
  let focused = 0, prevented = 0;
  const menu = { open: true, querySelector: () => ({ focus() { focused++; } }) };
  closeDisclosure({ currentTarget: menu, preventDefault() { prevented++; } });
  assert.equal(menu.open, false);
  assert.equal(focused, 1);
  assert.equal(prevented, 1);
});
test('Escape on a closed disclosure does not move focus or consume the key', () => {
  closeDisclosure({ currentTarget: { open: false }, preventDefault() { assert.fail('Key consumed'); } });
});
test('Tab inside a disclosure keeps it open; leaving closes it without moving focus', () => {
  const inside = {};
  const menu = { open: true, contains: target => target === inside };
  closeDisclosureOnBlur({ currentTarget: menu, relatedTarget: inside });
  assert.equal(menu.open, true);
  closeDisclosureOnBlur({ currentTarget: menu, relatedTarget: null });
  assert.equal(menu.open, false);
});
test('Focus restoration tolerates a control that has been removed', () => {
  focusElement(null);
  focusElement(undefined);
});
