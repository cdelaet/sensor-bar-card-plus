import { normalizeNumberValue, normalizeDecimalValue } from './editor-config.js';

// Native entry fields without a section-owned text draft. Palette and built-in
// percentage controls retain their existing draft stores and commit policies.
export class NumericInputDrafts {
  constructor() { this.values = new Map(); }
  reset() { this.values.clear(); }

  handle(event, rendering = false) {
    const input = event.target;
    // innerHTML replacement can dispatch a native change before detaching the
    // old focused control; that is not a user's blank reset commit.
    if (rendering && input?.type === 'number') return true;
    const route = input?.dataset?.field ?? input?.dataset?.kind ?? '';
    if (route === 'generic-marker-source-mode' && input.id) {
      for (const suffix of ['fixed', 'fallback', 'percent']) this.values.delete(input.id.replace(/source-mode$/, suffix));
    }
    if (input?.type !== 'number' || !input.id || /^(?:entity-)?gradient-/.test(route)
      || /^(?:target|baseline)-percent$/.test(route)) return false;
    if (input.isConnected === false) return true;
    const value = input.value;
    const percentage = route === 'generic-marker-percent';
    const precision = /(?:precision|decimal)$/.test(route);
    const number = precision ? normalizeDecimalValue(value) : normalizeNumberValue(value);
    const complete = number !== null && !input.validity?.badInput
      && (!/(?:layout-height|override-height)$/.test(route) || number >= 24);
    // Blank reset/inherit is an intentional commit on change (blur), never input.
    // Percentage has no blank source: changing mode is the explicit conversion.
    const clear = event.type === 'change' && value === '' && !input.validity?.badInput && !percentage;
    if (complete || clear) { this.values.delete(input.id); return false; }
    this.values.set(input.id, value);
    return true;
  }

  captureFocus(root) {
    const input = root.activeElement;
    return input && this.values.has(input.id) ? input.id : null;
  }

  apply(root, focusId = null) {
    for (const [id, value] of this.values) {
      const input = root.getElementById?.(id) ?? root.querySelector(`#${id}`);
      if (!input) { this.values.delete(id); continue; }
      // Native number inputs expose bad-input text as ""; preserve their mounted
      // editing buffer rather than assigning .value and erasing it.
      if (input !== root.activeElement) input.value = value;
    }
    if (focusId) (root.getElementById?.(focusId) ?? root.querySelector(`#${focusId}`))?.focus?.({ preventScroll: true });
  }
}
