import { describe, expect, it } from 'vitest';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { buildRowViewModel } from '../../src/view-model/row-view-model.js';
import { buildBarRenderModel } from '../../src/view-model/bar-render-model.js';
import { patchBar, renderBar } from '../../src/render/bar-renderer.js';

function needleFromMarkup(html) {
  const match = html.match(/class="needle-marker" data-edge="([^"]*)" style="([^"]*)"/);
  if (!match) return null;
  const style = Object.fromEntries(match[2].split(';').filter(Boolean).map(declaration => {
    const colon = declaration.indexOf(':');
    return [declaration.slice(0, colon), declaration.slice(colon + 1)];
  }));
  return { style, dataset: { edge: match[1] } };
}

// Only the Needle subtree needs a DOM here; native browser tests cover the bar.
function needleDom(initialModel) {
  let needle = needleFromMarkup(renderBar(initialModel));
  const operations = [];
  const wrapper = () => ({ remove() {
    operations.push('remove'); needle = null; layer = null;
  } });
  let layer = needle ? wrapper() : null;
  const track = {
    insertAdjacentHTML(position, markup) {
      expect(position).toBe('beforeend');
      needle = needleFromMarkup(markup);
      expect(needle).not.toBeNull();
      layer = wrapper();
      operations.push('create');
    },
    querySelector: selector => selector === '.needle-marker' ? needle : null,
  };
  const root = { querySelector: selector => ({
    '.bar-track': track, '.needle-marker': needle, '.needle-layer': layer,
  })[selector] ?? null };
  return { root, operations, get needle() { return needle; }, get layer() { return layer; } };
}

function models(needleEnabled) {
  const appearance = normalizeCardConfig({ entities: ['sensor.power'],
    bar: { needle: { show: needleEnabled, color: '#00ffcc' } },
    baseline: { at: { entity: 'sensor.baseline' } },
  }).entities[0];
  return (baseline, value = 75) => buildBarRenderModel(buildRowViewModel({ entityConfig: appearance,
    entityState: { state: String(value), attributes: {} },
    hass: { states: { 'sensor.baseline': { state: String(baseline), attributes: {} } } },
  }), appearance, { height: 30 });
}

describe('incremental Needle lifecycle', () => {
  it.each([[true, 25], [true, 'unknown'], [false, 25], [false, 'unknown']])(
    'matches fresh rendering with Needle %s and initial Baseline %s', (enabled, baseline) => {
      const modelFor = models(enabled);
      const dom = needleDom(modelFor(baseline));
      for (const next of [baseline, 'unknown', 'unknown', 25, 25, 'unavailable', 25]) {
        const model = modelFor(next);
        const previous = dom.needle;
        dom.operations.length = 0;
        patchBar(dom.root, model);
        expect(dom.needle).toEqual(needleFromMarkup(renderBar(model)));
        expect(Boolean(dom.layer)).toBe(Boolean(model.needle.configured));
        if (previous && model.needle.configured) {
          expect(dom.needle).toBe(previous);
          expect(dom.operations).toEqual([]);
        } else if (previous) expect(dom.operations).toEqual(['remove']);
        else expect(dom.operations).toEqual(model.needle.configured ? ['create'] : []);
      }
    },
  );

  it('keeps a configured Needle node hidden for unavailable primary values and reuses it on recovery', () => {
    const modelFor = models(true);
    const dom = needleDom(modelFor(25));
    patchBar(dom.root, modelFor('unknown', 'unknown'));
    const needle = dom.needle;
    expect(needle.style.display).toBe('none');
    expect(dom.needle).toEqual(needleFromMarkup(renderBar(modelFor('unknown', 'unknown'))));
    dom.operations.length = 0;
    patchBar(dom.root, modelFor('unknown'));
    expect(dom.needle).toBe(needle);
    expect(needle.style.display).toBe('block');
    expect(needle.style.left).toBe('75%');
    expect(dom.operations).toEqual([]);
  });
});
