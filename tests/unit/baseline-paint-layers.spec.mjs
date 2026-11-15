import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import {
  buildBarRenderModel, getFillPaintLayers, getFillRenderState, getFullScalePaintStyle,
} from '../../src/view-model/bar-render-model.js';
import { patchBar, renderBar } from '../../src/render/bar-renderer.js';
import { createPaintLayerContainer } from '../support/paint-layer-dom.mjs';
import { resolveBaselinePaints } from '../../src/view-model/baseline-paint-resolver.js';

const paint = { bar: { fill_style: 'solid', color: '#123456', above_target_color: '#ffff00' },
  baseline: { above: { color: '#ff0000' }, below: { color: '#0000ff' } } };
const background = gradient => `display:block;inset:0;background-image:${gradient};background-repeat:no-repeat;background-size:100% 100%;`;
const overlay = (start, end, color) => `linear-gradient(to right,transparent 0%,transparent ${start}%,${color} ${start}%,${color} ${end}%,transparent ${end}%,transparent 100%)`;

describe('independent Baseline paint layers', () => {
  it('normalizes directional Paint with matching-side inheritance, null disablement, and property overrides', () => {
    const config = normalizeCardConfig({
      bar: { paint: { color: '#111111', fill_style: 'solid' } },
      baseline: {
        above: { paint: { fill_style: 'gradient', opacity: 0, gradient_stops: [
          { pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' },
        ] } },
        below: { paint: { fill_style: 'solid', color: '#0000ff', opacity: 35 } },
      },
      entities: [
        { entity: 'sensor.inherit' },
        { entity: 'sensor.override', baseline: { above: { paint: { color: '#ff0000' } }, below: { paint: null } } },
      ],
    });
    const [inherited, local] = config.entities.map(entity => entity.baseline);
    expect(inherited.above.paint).toMatchObject({ fill_style: 'gradient', opacity: 0 });
    expect(inherited.below.paint).toMatchObject({ fill_style: 'solid', color: '#0000ff', opacity: 35 });
    expect(local.above.paint).toMatchObject({ fill_style: 'gradient', color: '#ff0000', opacity: 0 });
    expect(local.below.paint).toBeNull();
    expect(config.baseline.above.paint.color).toBe('var(--accent-color, #4a9eff)');
  });

  it('compiles full-scale Baseline gradients with independent clipping and opacity', () => {
    const config = normalizeCardConfig({ baseline: { at: 50, above: { paint: {
      fill_style: 'gradient', opacity: 0,
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }],
    } } }, entities: [{ entity: 'sensor.x' }] }).entities[0];
    const layer = getFillPaintLayers(null, 30, config, '#123456', null, 50).find(item => item.id === 'baseline-above');
    expect(layer.visible).toBe(true);
    expect(layer.paintStyle).toContain('background-image:linear-gradient(to right,rgb(0,0,0) 0%,rgb(255,255,255) 100%)');
    expect(layer.paintStyle).toContain('opacity:0;');
    expect(layer.revealStyle).toContain('clip-path:inset(0 0% 0 50%');
  });

  it('resolves named presets independently by direction and falls back without stale paint', () => {
    const config = normalizeCardConfig({ baseline: {
      above: { paint: { preset: 'warm', color: '#ff0000' } },
      below: { paint: { preset: 'missing' } },
    }, entities: [{ entity: 'sensor.x', baseline: { above: { paint: { opacity: 0 } } } }] });
    const cardBaseline = config.baseline;
    const entityBaseline = config.entities[0].baseline;
    const registry = { status: 'ready', presets: { warm: { fill_style: 'gradient',
      gradient_stops: [{ pos: 0, color: '#000000' }, { pos: 100, color: '#ffffff' }], opacity: 40 } } };
    const resolved = resolveBaselinePaints(entityBaseline, cardBaseline, registry);
    expect(resolved.paints.above).toMatchObject({ fill_style: 'gradient', color: '#ff0000', opacity: 0 });
    expect(resolved.paints.below.color).toBe('var(--accent-color, #4a9eff)');
    expect(resolved.diagnostics).toContainEqual(expect.objectContaining({
      code: 'paint_preset_missing', path: 'below.paint.preset', reference: 'missing', fallback: 'default',
    }));
    expect(resolveBaselinePaints({ ...entityBaseline, below: { ...entityBaseline.below, paint: null } }, cardBaseline, registry).paints)
      .not.toHaveProperty('below');
  });

  it('keeps ordinary fill free of Baseline colors and retains inactive layer identities', () => {
    const layers = getFillPaintLayers(null, 30, paint, '#123456');
    expect(layers.map(layer => layer.id)).toEqual(['base', 'baseline-above', 'baseline-below', 'above-target', 'target-below', 'target-above']);
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
    expect(state.paintLayers.map(layer => layer.id)).toEqual(['base', 'baseline-above', 'baseline-below', 'above-target', 'target-below', 'target-above']);
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
