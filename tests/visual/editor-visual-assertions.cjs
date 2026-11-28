/**
 * Assert editor geometry without comparing browser-native control pixels.
 * Interaction/state assertions remain in the individual editor journeys.
 */
async function expectEditorLayout(target, expect) {
  const geometry = await target.evaluate(node => {
    const root = node.shadowRoot || node;
    const bounds = node.getBoundingClientRect();
    const visible = [...root.querySelectorAll('input, select, textarea, button, [role="combobox"], [role="slider"]')]
      .filter(control => {
        const style = getComputedStyle(control);
        const rect = control.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      });
    const outside = visible.filter(control => {
      const rect = control.getBoundingClientRect();
      return rect.left < bounds.left - 1 || rect.right > bounds.right + 1;
    }).map(control => control.id || control.dataset.kind || control.getAttribute('aria-label') || control.localName);
    return {
      width: bounds.width,
      clientWidth: root.clientWidth || node.clientWidth,
      scrollWidth: root.scrollWidth || node.scrollWidth,
      outside,
    };
  });

  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.outside).toEqual([]);
}

module.exports = { expectEditorLayout };
