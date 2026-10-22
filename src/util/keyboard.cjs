// Keep focus predictable when controls or panels disappear.
function focusElement(element) {
  if (element && typeof element.focus === 'function') element.focus();
}
function closeDisclosure(event) {
  const disclosure = event.currentTarget;
  if (!disclosure || !disclosure.open) return;
  event.preventDefault();
  disclosure.open = false;
  focusElement(disclosure.querySelector('summary'));
}
function closeDisclosureOnBlur(event) {
  const disclosure = event.currentTarget;
  if (!disclosure.contains(event.relatedTarget)) disclosure.open = false;
}
module.exports = { focusElement, closeDisclosure, closeDisclosureOnBlur };
