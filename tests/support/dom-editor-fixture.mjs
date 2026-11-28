import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { onTestFinished } from 'vitest';
import { getCardClassBundles } from './load-card-class.cjs';

// Opt in per test. The lightweight VM fixture remains available for logic tests.
// Bundle the same source/dist pair once, but isolate each editor's DOM and timers.
export async function createDomEditorFixture(options = {}) {
  const { bundles, filePath } = getCardClassBundles(options);
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://unit.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const errors = [];
  window.addEventListener('error', event => errors.push(event.error ?? new Error(event.message)));
  let editor;
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    editor?.remove();
    window.close();
  };
  onTestFinished(() => {
    dispose();
    if (errors.length) throw new AggregateError(errors, 'Unhandled editor fixture errors');
  });

  const context = dom.getInternalVMContext();
  window.customCards = [];
  if (options.CSS) window.CSS = options.CSS;
  for (const [option, tag] of [['withEntityPicker', 'ha-entity-picker'], ['withIconPicker', 'ha-icon-picker']]) {
    if (options[option]) window.customElements.define(tag, class extends window.HTMLElement {});
  }
  vm.runInContext(bundles.editor, context, { filename: 'editor-behavior-fixture.js' });
  window.__loadEditorCompanion = async () => window.__editorCompanion;
  vm.runInContext(bundles.core, context, { filename: filePath });
  const tag = options.host === 'feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus';
  editor = await window.customElements.get(tag).getConfigElement();
  window.document.body.append(editor);
  await editor.updateComplete;
  return { editor, window, dispose };
}

export function dispatchDomEvent(element, type, init = {}) {
  const realm = element.ownerDocument.defaultView;
  const EventClass = type === 'click' ? realm.MouseEvent
    : type === 'keydown' ? realm.KeyboardEvent
      : type === 'value-changed' ? realm.CustomEvent : realm.Event;
  return element.dispatchEvent(new EventClass(type, { bubbles: true, composed: true, cancelable: true, ...init }));
}
