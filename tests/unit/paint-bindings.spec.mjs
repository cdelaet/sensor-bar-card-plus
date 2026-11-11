import { describe, expect, it, vi } from 'vitest';
import { createPaintBindings } from '../../src/editor/shared/paint-bindings.js';
import { getPathValue, setPathValue } from '../../src/editor/shared/editor-config.js';
import { loadCardClass } from '../support/load-card-class.cjs';

const root = { type: 'card' };
function setup(initial, path = [], scope = root) {
  let config = initial;
  const context = {
    read: vi.fn((_scope, path) => getPathValue(config, path)),
    mutate: vi.fn((_scope, mutation) => { config = mutation(config); return true; }),
  };
  return { context, binding: createPaintBindings(context, { scope, path }),
    get config() { return config; }, replace(value) { config = value; } };
}

describe('destination-aware paint bindings', () => {
  it('reads raw snapshots and local ownership without emitting or materializing inherited values', () => {
    const original = { bar: { fill_style: 'gradient', color: 'red' }, local: { opacity: 0,
      preset: 'named', gradient_stops: [{ pos: '50%', color: ' blue ', extra: undefined }] } };
    const { binding, context } = setup(original, ['local']);
    expect(binding.read('opacity')).toBe(0);
    expect(binding.read('color')).toBeUndefined();
    expect(binding.hasOverride('color')).toBe(false);
    expect(binding.hasOverride('preset')).toBe(true);
    const snapshot = binding.read();
    snapshot.gradient_stops[0].color = 'changed';
    expect(original.local.gradient_stops[0].color).toBe(' blue ');
    expect(Object.hasOwn(snapshot.gradient_stops[0], 'extra')).toBe(true);
    expect(context.mutate).not.toHaveBeenCalled();
  });

  it.each(['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient'])('stores %s without changing inactive paint properties', fillStyle => {
    const paint = Object.freeze({ fill_style: 'solid', preset: 'named', solid_fill: false,
      gradient_stops: Object.freeze([{ pos: '50%', color: ' blue ' }]),
      segments: Object.freeze([{ from: { fixed: 10 }, color: 'red' }]), extra: undefined });
    const state = setup(paint);
    state.binding.set('fill_style', fillStyle);
    expect(state.config).toEqual({ ...paint, fill_style: fillStyle });
    expect(state.config.gradient_stops).toBe(paint.gradient_stops);
    expect(state.config.segments).toBe(paint.segments);
    expect(paint.fill_style).toBe('solid');
  });

  it.each([0, false, null, '', undefined, ' 50.5 '])('preserves an explicit property value %j until explicitly cleared', value => {
    const state = setup({ local: { preset: 'named', extra: true } }, ['local']);
    state.binding.set('opacity', value);
    expect(state.binding.hasOverride('opacity')).toBe(true);
    expect(state.binding.read('opacity')).toBe(value);
    state.binding.clear('opacity');
    expect(state.binding.hasOverride('opacity')).toBe(false);
    expect(state.config).toEqual({ local: { preset: 'named', extra: true } });
  });

  it.each([
    ['root', [], { color: 'red', extra: true }],
    ['bar', ['bar'], { bar: { color: 'red', extra: true }, unrelated: { keep: true } }],
    ['Baseline region', ['baseline', 'above'], { baseline: { at: '25%', above: { color: 'red', extra: true }, below: { color: 'blue' } } }],
    ['Target region', ['target', 'when_exceeded'], { target: { at: 60, when_exceeded: { fill_color: 'red', extra: true } } }],
    ['nested list destination', ['items', 1, 'appearance'], { items: [{ keep: true }, { name: 'second', appearance: { color: 'red', extra: true } }] }],
  ])('changes and clears only one property at the %s destination', (_name, path, original) => {
    const state = setup(original, path);
    const expected = setPathValue(original, [...path, 'opacity'], 50);
    state.binding.set('opacity', 50);
    expect(state.config).toEqual(expected);
    expect(getPathValue(original, [...path, 'opacity'])).toBeUndefined();
    state.binding.clear('opacity');
    expect(state.config).toEqual(original);
  });

  it('updates and clears fields of an existing palette row without losing order, boundaries or metadata', () => {
    const first = Object.freeze({ from: Object.freeze({ fixed: 10, future: true }), color: 'red', extra: undefined });
    const second = Object.freeze({ from: '80%', color: 'blue' });
    const original = Object.freeze({ bar: Object.freeze({ segments: Object.freeze([first, second]) }) });
    const state = setup(original, ['bar', 'segments', 0]);
    state.binding.set('color', 'green');
    expect(state.config.bar.segments).toEqual([{ ...first, color: 'green' }, second]);
    expect(state.config.bar.segments[1]).toBe(second);
    expect(state.config.bar.segments[0].from).toBe(first.from);
    state.binding.clear('color');
    expect(state.config.bar.segments[0]).toEqual({ from: first.from, extra: undefined });
    expect(state.config.bar.segments).toHaveLength(2);
    expect(first.color).toBe('red');
  });

  it('creates omitted object destinations only on an explicit edit and retains ownership when cleared', () => {
    const state = setup({ keep: true }, ['nested', 'appearance']);
    expect(state.binding.read()).toBeUndefined();
    expect(state.binding.clear('color')).toBe(false);
    expect(state.context.mutate).not.toHaveBeenCalled();
    state.binding.set('color', 'red');
    state.binding.clear('color');
    expect(state.config).toEqual({ keep: true, nested: { appearance: {} } });
  });

  it.each([null, false, 'red', []])('leaves a non-object destination %j to the host instead of silently promoting it', raw => {
    const state = setup({ appearance: raw }, ['appearance']);
    expect(state.binding.read()).toEqual(raw);
    expect(state.binding.set('opacity', 50)).toBe(false);
    expect(state.binding.clear('color')).toBe(false);
    expect(state.context.mutate).not.toHaveBeenCalled();
    expect(state.config.appearance).toBe(raw);
  });

  it.each([null, false, 25, 'sensor.baseline'])('does not replace a shorthand/non-object ancestor %j to reach a destination', baseline => {
    const state = setup({ baseline }, ['baseline', 'above']);
    expect(state.binding.set('color', 'red')).toBe(false);
    expect(state.context.mutate).not.toHaveBeenCalled();
    expect(state.config).toEqual({ baseline });
  });

  it.each([{}, { items: [] }, { items: [{ appearance: {} }] }])('does not create list membership while editing a destination', config => {
    const state = setup(config, ['items', 1, 'appearance']);
    expect(state.binding.set('color', 'red')).toBe(false);
    expect(state.context.mutate).not.toHaveBeenCalled();
    expect(state.config).toBe(config);
  });

  it('detaches incoming array values from caller-owned drafts', () => {
    const stops = [{ pos: 0, color: 'red' }];
    const state = setup({});
    state.binding.set('gradient_stops', stops);
    stops[0].color = 'blue';
    expect(state.config.gradient_stops).toEqual([{ pos: 0, color: 'red' }]);
    state.binding.read('gradient_stops')[0].color = 'green';
    expect(state.config.gradient_stops[0].color).toBe('red');
  });

  it('keeps reads live and applies edits to the current target after a config replacement', () => {
    const path = ['appearance'];
    const state = setup({ appearance: { color: 'red' } }, path);
    path.push('unintended');
    state.replace({ appearance: { color: 'blue', opacity: 25, future: { keep: true } } });
    expect(state.binding.read('color')).toBe('blue');
    state.binding.set('color', 'green');
    expect(state.config).toEqual({ appearance: { color: 'green', opacity: 25, future: { keep: true } } });
  });

  it('passes scope, mutation options and host rejection through without its own emission policy', () => {
    const scope = { owner: 'example' }, options = { preserveRawConfig: true, rerender: true };
    const { binding, context } = setup({ appearance: {} }, ['appearance'], scope);
    context.mutate.mockReturnValue(false);
    expect(binding.set('color', 'red', options)).toBe(false);
    expect(context.mutate).toHaveBeenCalledWith(scope, expect.any(Function), options);
  });
});

describe('paint bindings through existing editor mutation policies', () => {
  async function editorFor(kind, config) {
    const classes = loadCardClass();
    const editor = new (kind === 'Card' ? classes.editor : classes.featureEditor)();
    const events = [];
    editor.dispatchEvent = event => { events.push(event.detail.config); return true; };
    editor.setConfig(config);
    if (kind === 'Feature') await editor.updateComplete;
    return { editor, events, context: editor._createSectionContext() };
  }

  it.each(['Card', 'Feature'])('uses the existing %s cleanup/emission and echo policy', async kind => {
    const config = { type: kind === 'Card' ? 'custom:sensor-bar-card-plus' : 'custom:sensor-bar-card-plus-feature',
      entity: 'sensor.power', min: 0, max: 100, extra: { keep: true }, bar: { color: 'red', extra: true } };
    const bound = await editorFor(kind, config), direct = await editorFor(kind, config);
    const binding = createPaintBindings(bound.context, { scope: root, path: ['bar'] });
    expect(binding.read('color')).toBe('red');
    expect(bound.events).toHaveLength(0);
    binding.set('color', 'blue');
    direct.context.mutate(root, target => setPathValue(target, ['bar', 'color'], 'blue'));
    expect(bound.events).toEqual(direct.events);
    expect(bound.events).toHaveLength(1);
    expect(bound.events[0].extra).toEqual(config.extra);
    expect(bound.events[0].bar.extra).toBe(true);
    binding.set('color', 'blue');
    bound.editor.setConfig(bound.events[0]);
    if (kind === 'Feature') await bound.editor.updateComplete;
    expect(bound.events).toHaveLength(1);
    expect(config.bar.color).toBe('red');
  });

  it('preserves Card entity inheritance and raw row ownership with the host-supported mutation option', async () => {
    const config = { bar: { fill_style: 'gradient', color: 'red', gradient_stops: [{ pos: 0, color: 'red' }, { pos: 100, color: 'blue' }] },
      entities: ['sensor.power', 'sensor.other'], extra: { keep: undefined } };
    const { context, events } = await editorFor('Card', config);
    const binding = createPaintBindings(context, { scope: { type: 'entity', index: 0 }, path: ['bar'] });
    expect(binding.hasOverride('color')).toBe(false);
    expect(binding.clear('opacity')).toBe(false);
    expect(events).toHaveLength(0);
    binding.set('opacity', 0, { preserveRawConfig: true });
    expect(events[0]).toEqual({ ...config, entities: [{ entity: 'sensor.power', bar: { opacity: 0 } }, 'sensor.other'] });
    expect(events[0].entities[0].bar).not.toHaveProperty('gradient_stops');
    binding.clear('opacity', { preserveRawConfig: true });
    expect(events[1].entities[0]).toEqual({ entity: 'sensor.power', bar: {} });
    expect(events[1].bar).toEqual(config.bar);
    expect(config.entities).toEqual(['sensor.power', 'sensor.other']);
  });
});
