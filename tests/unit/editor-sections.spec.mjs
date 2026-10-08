import { describe, it, expect, vi } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';
import { getPathValue, setPathValue } from '../../src/editor/shared/editor-config.js';
import { renderScaleSection, handleScaleField } from '../../src/editor/sections/scale.js';
import {
  renderFormattingSection, getFormattingValue, getEffectiveFormattingValue,
  handleFormattingField,
} from '../../src/editor/sections/formatting.js';

const root = { type: 'card' };
const entity = { type: 'entity', index: 0 };
function setup(source, config) {
  const editor = createEditor({ source });
  const events = [];
  editor.dispatchEvent = event => { events.push(event); return true; };
  editor.setConfig(config);
  return { editor, events };
}
function input(editor, id, value) {
  const control = editor.shadowRoot.querySelector(`#${id}`);
  control.value = value;
  control.dispatchEvent({ type: 'input' });
}

for (const source of ['src', 'dist']) describe(`Scale/Formatting characterization (${source})`, () => {
  it('retains Scale source parts and mounted inputs through fixed edits and config echoes', () => {
    const { editor, events } = setup(source, {
      entity: 'sensor.power', extra: { keep: true },
      scale: { min: { fixed: 0, entity: 'sensor.minimum' }, max: { fixed: 100, entity: 'sensor.maximum' } },
    });
    const control = editor.shadowRoot.querySelector('#scale-min');
    input(editor, 'scale-min', '12');
    editor.setConfig(events.at(-1).detail.config);
    expect(editor.shadowRoot.querySelector('#scale-min')).toBe(control);
    expect(events.at(-1).detail.config.scale).toEqual({ min: { fixed: 12, entity: 'sensor.minimum' }, max: { fixed: 100, entity: 'sensor.maximum' } });
    input(editor, 'scale-min', 'not numeric');
    expect(events.at(-1).detail.config.scale.min).toEqual({ fixed: 12, entity: 'sensor.minimum' });
    expect(editor.shadowRoot.querySelector('#scale-min').value).toBe('not numeric');
    expect(events.at(-1).detail.config.extra).toEqual({ keep: true });
  });

  it('retains entity-only Scale behavior and clears just managed override fields', () => {
    const { editor, events } = setup(source, {
      scale: { min: { fixed: 10, entity: 'sensor.minimum' }, max: 100 },
      entities: [{ entity: 'sensor.power', min_entity: 'sensor.local', scale: { max: { entity: 'sensor.maximum' }, future: true } }],
    });
    expect(editor._getEffectiveResolvableScopedValue(entity, 'max')).toEqual({ fixed: '', entity: 'sensor.maximum' });
    editor._clearScaleOverride(entity);
    expect(events.at(-1).detail.config.entities[0]).toEqual({ entity: 'sensor.power', scale: { future: true } });
    expect(editor._getEffectiveResolvableScopedValue(entity, 'min')).toEqual({ fixed: 10, entity: 'sensor.minimum' });
    expect(editor._getScaleOverrideSummary(entity)).toBe('Inherited');
  });

  it('preserves Formatting zero precision, invalid-input handling and config echoes', () => {
    const { editor, events } = setup(source, { entity: 'sensor.power', formatting: { unit: 'W', decimal: 2, future: true } });
    const decimal = editor.shadowRoot.querySelector('#formatting-decimal');
    input(editor, 'formatting-decimal', '0');
    editor.setConfig(events.at(-1).detail.config);
    expect(editor.shadowRoot.querySelector('#formatting-decimal')).toBe(decimal);
    expect(editor._getFormattingSummary(root)).toBe('Unit W • 0 decimals');
    const count = events.length;
    for (const value of ['-1', '1.5', 'invalid']) input(editor, 'formatting-decimal', value);
    expect(events).toHaveLength(count);
    input(editor, 'formatting-unit', '  kW  ');
    expect(events.at(-1).detail.config.formatting).toEqual({ unit: 'kW', decimal: 0, future: true });
  });

  it('preserves local/effective Formatting distinctions and removes only managed override keys', () => {
    const { editor, events } = setup(source, {
      unit: 'W', decimal: 2,
      entities: [{ entity: 'sensor.power', formatting: { unit: '', decimal: 0, future: true }, extra: true }],
    });
    expect(editor._getScopedFormattingValue(entity, 'unit')).toBe('');
    expect(editor._getEffectiveScopedFormattingValue(entity, 'unit')).toBe('W');
    expect(editor._getEffectiveScopedFormattingValue(entity, 'decimal')).toBe(0);
    expect(editor._hasFormattingOverride(entity)).toBe(true);
    editor._clearFormattingOverride(entity);
    expect(events.at(-1).detail.config.entities[0]).toEqual({ entity: 'sensor.power', formatting: { future: true }, extra: true });
    expect(editor._getEffectiveScopedFormattingValue(entity, 'decimal')).toBe(2);
    expect(editor._hasFormattingOverride(entity)).toBe(false);
  });
});

describe('shared sections with a root-only host context', () => {
  // A plain config and mutation sink, with no editor class or standalone cleanup.
  function contextFor(initial) {
    let raw = initial;
    const edits = [];
    const context = {
      read: (_scope, path) => getPathValue(raw, path),
      mutate: (scope, mutation, options) => {
        expect(scope).toEqual(root);
        raw = mutation(raw);
        edits.push(options);
        return true;
      },
      source: (scope, key) => {
        expect(scope).toEqual(root);
        const bound = raw.scale?.[key] ?? {};
        return { fixed: bound.fixed ?? '', entity: bound.entity ?? '' };
      },
      setSource: (scope, key, part, value) => context.mutate(scope, target => setPathValue(target, ['scale', key, part], value)),
    };
    return { context, edits, config: () => raw };
  }

  it('renders and edits Formatting using only raw reads and a host mutation sink', () => {
    const host = contextFor({ formatting: { unit: 'W', decimal: 0, future: true }, advanced: { keep: true } });
    const context = { read: host.context.read, mutate: host.context.mutate };
    expect(renderFormattingSection(context, root)).toContain('data-field="formatting-decimal" value="0"');
    expect(getFormattingValue(context, root, 'unit')).toBe('W');
    expect(getEffectiveFormattingValue(context, root, 'decimal')).toBe(0);
    expect(handleFormattingField(context, { field: 'formatting-unit', value: ' kW ' })).toBe(true);
    expect(handleFormattingField(context, { field: 'formatting-decimal', value: '-1' })).toBe(true);
    expect(host.edits).toHaveLength(1);
    expect(host.config()).toEqual({ formatting: { unit: 'kW', decimal: 0, future: true }, advanced: { keep: true } });
    expect(handleFormattingField(context, { field: 'unrelated', value: 1 })).toBe(false);
  });

  it('renders Scale and sends source edits to the root host without imposing persistence policy', () => {
    const host = contextFor({ scale: { min: { fixed: 0, entity: 'sensor.minimum' }, max: { fixed: 100 } }, advanced: { keep: true } });
    vi.stubGlobal('customElements', { get: () => undefined });
    try {
      const html = renderScaleSection(host.context, root);
      expect(html).toContain('data-kind="scale-min-entity-source"');
      expect(html).toContain('value="sensor.minimum"');
    } finally {
      vi.unstubAllGlobals();
    }
    expect(handleScaleField(host.context, { field: 'scale-max', value: '120' })).toBe(true);
    // Source canonicalization is deliberately chosen by this test host, not the section.
    expect(host.config().scale.max.fixed).toBe('120');
    expect(host.config().scale.min).toEqual({ fixed: 0, entity: 'sensor.minimum' });
    expect(host.config().advanced).toEqual({ keep: true });
    expect(host.config().entities).toBeUndefined();
    expect(handleScaleField(host.context, { kind: 'unrelated', value: 1 })).toBe(false);
  });
});
