const { test, expect } = require('@playwright/test');
for (const source of ['src', 'dist']) for (const scaleDirection of ['normal', 'reverse']) for (const barDirection of ['normal', 'reverse']) {
  test(`grouped paint runtime ${source}, Scale ${scaleDirection}, Bar ${barDirection}`, async ({ page }) => {
    await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
    const results = await page.evaluate(async ({ scaleDirection, barDirection }) => {
      const { normalizeCardConfig } = await import('/src/config/normalize.js');
      const { buildRowViewModel } = await import('/src/view-model/row-view-model.js');
      const { buildBarRenderModel } = await import('/src/view-model/bar-render-model.js');
      const { renderBar } = await import('/src/render/bar-renderer.js');
      const read = root => ({ clip: root.querySelector('.bar-fill-reveal').style.clipPath,
        layers: [...root.querySelectorAll('.bar-paint-layer')].map(node => [node.dataset.layer, node.style.backgroundImage]) });
      const results = [];
      for (const fill_style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) for (const solid_fill of [false, true]) {
        const config = { scale: { min: 0, max: { entity: 'sensor.maximum' }, direction: scaleDirection },
          bar: { animated: false, direction: barDirection, paint: { fill_style, solid_fill, opacity: 0, color: '#123456',
            segments: [{ from: 0, to: '40%', color: '#123456' }, { from: '60%', to: 200, color: '#abcdef' }],
            gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }] } } };
        const hassFor = max => ({ states: { 'sensor.power': window.__sbcpCreateState(75), 'sensor.maximum': window.__sbcpCreateState(max) } });
        const card = await window.__sbcpRenderCard({ config: { ...config, entities: ['sensor.power'] }, hass: hassFor(100) });
        const feature = await window.__sbcpRenderFeature({ config, context: { entity_id: 'sensor.power' }, hass: hassFor(100) });
        const roots = [card.shadowRoot, feature.shadowRoot], nodes = roots.map(root => root.querySelector('.bar-fill-reveal'));
        const appearance = normalizeCardConfig({ ...config, entities: ['sensor.power'] }).entities[0];
        for (const max of [100, 200, 'unknown']) {
          const hass = hassFor(max); card.hass = hass; feature.hass = hass; await feature.updateComplete;
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const row = buildRowViewModel({ hass, entityConfig: appearance, entityState: hass.states['sensor.power'] });
          const fresh = document.createElement('div'); fresh.innerHTML = renderBar(buildBarRenderModel(row, appearance, { height: 38 }));
          results.push({ expected: read(fresh), actual: roots.map(read), stable: roots.every((root, i) => root.querySelector('.bar-fill-reveal') === nodes[i]) });
        }
        feature.parentElement.remove();
      }
      return results;
    }, { scaleDirection, barDirection });
    for (const result of results) {
      expect(result.actual).toEqual([result.expected, result.expected]); expect(result.stable).toBe(true);
    }
  });
}
