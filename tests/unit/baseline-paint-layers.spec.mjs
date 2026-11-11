import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import {
  buildBarRenderModel, getFillPaintLayers, getFillRenderState, getFullScalePaintStyle,
} from '../../src/view-model/bar-render-model.js';
import { patchBar, renderBar } from '../../src/render/bar-renderer.js';
import { createPaintLayerContainer } from '../support/paint-layer-dom.mjs';

const paint = { bar: { fill_style: 'solid', color: '#123456', above_target_color: '#ffff00' },
  baseline: { above: { color: '#ff0000' }, below: { color: '#0000ff' } } };
const background = gradient => `display:block;inset:0;background-image:${gradient};background-repeat:no-repeat;background-size:100% 100%;`;
const overlay = (start, end, color) => `linear-gradient(to right,transparent 0%,transparent ${start}%,${color} ${start}%,${color} ${end}%,transparent ${end}%,transparent 100%)`;

describe('independent Baseline paint layers', () => {
  it('keeps ordinary fill free of Baseline colors and retains inactive layer identities', () => {
    const layers = getFillPaintLayers(null, 30, paint, '#123456');
    expect(layers.map(layer => layer.id)).toEqual(['base', 'baseline-above', 'baseline-below', 'above-target']);
    expect(layers[0].paintStyle).toBe(background('linear-gradient(to right,#123456 0%,#123456 100%)'));
    expect(layers.filter(layer => layer.visible).map(layer => layer.id)).toEqual(['base']);
    for (const layer of layers.filter(layer => layer.id.startsWith('baseline-'))) {
      expect(layer.paintStyle).toBe('display:none;');
      expect(layer.revealStyle).toBe('display:none;');
    }
  });

  it.each([
    ['normal', 'normal', 0, 25, 25, 100, 25, 80],
    ['normal', 'reverse', 0, 25, 25, 100, 25, 80],
    ['reverse', 'normal', 75, 100, 0, 75, 20, 75],
    ['reverse', 'reverse', 75, 100, 0, 75, 20, 75],
  ])('preserves semantic Baseline regions with %s Scale and %s Bar directions', (scaleDirection, barDirection, belowStart, belowEnd, aboveStart, aboveEnd, start, end) => {
    const state = getFillRenderState(80, 30, paint, '#123456', 60, 25, 0, 100, false, scaleDirection, barDirection);
    const [base, above, below, target] = state.paintLayers;
    expect(state.geometry).toMatchObject({ start, end, usesBaseline: true });
    expect(base.paintStyle).not.toContain('transparent');
    expect(above).toMatchObject({ id: 'baseline-above', visible: true, zIndex: 1,
      paintStyle: background(overlay(aboveStart, aboveEnd, '#ff0000')) });
    expect(below).toMatchObject({ id: 'baseline-below', visible: true, zIndex: 1,
      paintStyle: background(overlay(belowStart, belowEnd, '#0000ff')) });
    // DOM order resolves equal z-indices; Target stays above all three paints.
    expect(state.paintLayers.map(layer => layer.id)).toEqual(['base', 'baseline-above', 'baseline-below', 'above-target']);
    expect(target).toMatchObject({ id: 'above-target', visible: true, zIndex: 2 });
    expect(target.revealStyle).toContain(scaleDirection === 'reverse' ? 'inset(0 60% 0 0%' : 'inset(0 0% 0 60%');
    expect(getFullScalePaintStyle(paint, '#123456', 60, 25, 0, 100, scaleDirection)).toBe(background([
      overlay(belowStart, belowEnd, '#0000ff'), overlay(aboveStart, aboveEnd, '#ff0000'),
      'linear-gradient(to right,#123456 0%,#123456 100%)',
    ].join(',')));
  });

  it.each([0, 100, -20, 120, null, NaN])('keeps empty or unavailable Baseline sides hidden at %s', baselinePct => {
    const layers = getFillPaintLayers(null, 30, paint, '#123456', null, baselinePct);
    const above = layers.find(layer => layer.id === 'baseline-above');
    const below = layers.find(layer => layer.id === 'baseline-below');
    expect(above.visible).toBe(Number.isFinite(baselinePct) && baselinePct < 100);
    expect(below.visible).toBe(Number.isFinite(baselinePct) && baselinePct > 0);
  });

  it.each(['above', 'below'])('does not invent an unconfigured Baseline-%s paint', side => {
    const config = { ...paint, baseline: { [side]: { color: 'red' } } };
    const layers = getFillPaintLayers(null, 30, config, '#123456', null, 50);
    expect(layers.filter(layer => layer.id.startsWith('baseline-') && layer.visible).map(layer => layer.id))
      .toEqual([`baseline-${side}`]);
  });

  it.each(['normal', 'reverse'])('patches every independent layer to its initial-render style under %s Scale', scaleDirection => {
    const appearance = normalizeCardConfig({ entities: [{
      entity: 'sensor.power', scale: { min: 0, max: 100, direction: scaleDirection },
      bar: { ...paint.bar, needle: true, animated: false },
      baseline: { ...paint.baseline, at: { entity: 'sensor.baseline' } }, target: { at: 60 },
    }] }).entities[0];
    const modelFor = (value, baseline) => buildBarRenderModel(buildRowViewModel({
      entityConfig: appearance, entityState: { state: String(value), attributes: {} },
      hass: { states: { 'sensor.baseline': { state: String(baseline), attributes: {} } } },
    }), appearance, { height: 30 });
    const renderedPaints = model => [...renderBar(model).matchAll(/data-layer="([^"]+)" style="([^"]*)"/g)]
      .map(([, id, style]) => ({ id, style }));
    const initial = modelFor(80, 25);
    const fillReveal = createPaintLayerContainer(renderedPaints(initial));
    const root = { querySelector: selector => selector === '.bar-fill-reveal' ? fillReveal : null };
    for (const [value, baseline] of [[10, 70], [80, 'unknown'], [80, 25]]) {
      const model = modelFor(value, baseline);
      patchBar(root, model);
      expect(fillReveal.children.map(node => ({ id: node.dataset.layer, style: node.style.cssText })))
        .toEqual(renderedPaints(model));
      expect(fillReveal.style.cssText).toContain(model.fill.revealStyle);
      expect(model.needle.show).toBe(baseline === 'unknown');
      if (baseline !== 'unknown') expect(model.fill.revealStyle).toContain('round ');
    }
  });
});
