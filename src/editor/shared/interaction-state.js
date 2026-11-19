export function indexedControlSuffix({ segmentIndex, stopIndex, index }) {
  const item = segmentIndex ?? stopIndex ?? index;
  if (item === undefined) return '';
  const attribute = segmentIndex !== undefined ? 'segment-index' : stopIndex !== undefined ? 'stop-index' : 'index';
  return `[data-${attribute}="${item}"]`;
}

export function captureViewport(editor, active = editor.shadowRoot?.activeElement) {
  const elements = [];
  const record = element => {
    if (!element || elements.some(entry => entry.element === element)) return;
    if (element.scrollTop || element.scrollLeft || element.scrollHeight > element.clientHeight
      || element.scrollWidth > element.clientWidth) {
      elements.push({ element, top: element.scrollTop, left: element.scrollLeft });
    }
  };
  for (let element = active; element; element = element.parentElement) record(element);
  for (let element = editor.shadowRoot?.host; element; element = element.parentElement) record(element);
  const view = editor.ownerDocument?.defaultView;
  return { view, x: view?.scrollX ?? 0, y: view?.scrollY ?? 0, elements };
}

export function restoreViewport(viewport) {
  if (!viewport) return;
  for (const entry of viewport.elements) {
    if (entry.element.isConnected) {
      entry.element.scrollTop = entry.top;
      entry.element.scrollLeft = entry.left;
    }
  }
  viewport.view?.scrollTo(viewport.x, viewport.y);
}

export function captureFocusState(editor, active, selector) {
  if (!selector) return null;
  const paintId = active.closest?.('.paint-editor')?.id;
  const selection = active.type === 'text'
    ? { start: active.selectionStart, end: active.selectionEnd } : null;
  return {
    selector: paintId ? `#${paintId} ${selector}` : selector,
    start: selection?.start ?? null,
    end: selection?.end ?? null,
    viewport: captureViewport(editor, active),
  };
}

export function restoreFocusState(root, focus) {
  if (!focus) return;
  const control = root?.querySelector(focus.selector);
  control?.focus?.({ preventScroll: true });
  if (control?.type === 'text' && focus.start != null) control.setSelectionRange?.(focus.start, focus.end);
  restoreViewport(focus.viewport);
}
