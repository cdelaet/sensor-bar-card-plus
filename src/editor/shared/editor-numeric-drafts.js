import { normalizeNumberValue, normalizeDecimalValue } from './editor-config.js';
import { parseScaleValueInput } from './editor-controls.js';

// Native entry fields without a section-owned text draft. Palette and built-in
// percentage controls retain their existing draft stores and commit policies.
export class NumericInputDrafts {
  constructor() { this.values = new Map(); }
  reset() { this.values.clear(); }

  handle(event, rendering = false) {
    const input = event.target;
    const route = input?.dataset?.field ?? input?.dataset?.kind ?? '';
    // innerHTML replacement can dispatch a native change before detaching the
    // old focused control; that is not a user's blank reset commit.
    const scaleValue = ['generic-marker-fixed', 'target-value', 'baseline-value'].includes(route);
    if (rendering && (input?.type === 'number' || scaleValue && input?.type === 'text')) return true;
    if (scaleValue && input?.type === 'text' && input.id) {
      if (input.isConnected === false) return true;
      const value = input.value.trim();
      const complete = parseScaleValueInput(value) !== null;
      const clear = event.type === 'change' && value === '';
      if (complete || clear) { this.values.delete(input.id); return false; }
      this.values.set(input.id, input.value);
      return true;
    }
    if (input?.type !== 'number' || !input.id || /^(?:entity-)?gradient-/.test(route)
      || /^(?:target|baseline)-percent$/.test(route)) return false;
    if (input.isConnected === false) return true;
    const value = input.value;
    const precision = /(?:precision|decimal)$/.test(route);
    const number = precision ? normalizeDecimalValue(value) : normalizeNumberValue(value);
    const complete = number !== null && !input.validity?.badInput
      && (!/(?:layout-height|override-height)$/.test(route) || number >= 24);
    // Blank reset/inherit is an intentional commit on change (blur), never input.
    const clear = event.type === 'change' && value === '' && !input.validity?.badInput;
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
