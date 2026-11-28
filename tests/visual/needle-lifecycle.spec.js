const { test, expect } = require('./visual-test.cjs');

for (const [scaleDirection, barDirection] of [['normal', 'normal'], ['normal', 'reverse'], ['reverse', 'normal'], ['reverse', 'reverse']]) {
  for (const needleEnabled of [true, false]) {
    for (const initialBaseline of [25, 'unknown']) {
      test(`Needle ${needleEnabled ? 'on' : 'off'}, Baseline initially ${initialBaseline}, Scale ${scaleDirection}, Bar ${barDirection}`, async ({ page }) => {
        await page.goto('/tests/visual/fixtures/harness.html');
        const results = await page.evaluate(async ({ scaleDirection, barDirection, needleEnabled, initialBaseline }) => {
          const { normalizeCardConfig } = await import('/src/config/normalize.js');
          const { buildRowViewModel } = await import('/src/view-model/row-view-model.js');
          const { buildBarRenderModel } = await import('/src/view-model/bar-render-model.js');
          const { renderBar, patchBar } = await import('/src/render/bar-renderer.js');
          const config = {
            scale: { min: 0, max: 100, direction: scaleDirection },
            bar: { needle: { show: needleEnabled, color: '#00ffcc' }, direction: barDirection, animated: false,
              fill_style: 'gradient', gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }] },
            baseline: { at: { entity: 'sensor.baseline' }, above: { color: 'red' }, below: { color: 'blue' } },
            target: { at: 60 },
          };
          const power = window.__sbcpCreateState(75);
          const hassFor = baseline => ({ states: { 'sensor.power': power,
            'sensor.baseline': window.__sbcpCreateState(baseline) } });
          const card = await window.__sbcpRenderCard({ config: { ...config, entities: ['sensor.power'] }, hass: hassFor(initialBaseline) });
          const feature = await window.__sbcpRenderFeature({ config, context: { entity_id: 'sensor.power' }, hass: hassFor(initialBaseline) });
          const roots = [card.shadowRoot, feature.shadowRoot];
          const appearance = normalizeCardConfig({ ...config, entities: ['sensor.power'] }).entities[0];
          const stableNodes = root => [...root.querySelectorAll('.bar-track, .bar-fill-reveal, .bar-paint-layer, .baseline-indicator, .target-marker')];
          const original = roots.map(stableNodes);
          const read = root => {
            const needle = root.querySelector('.needle-marker');
            return {
              needle: needle ? { edge: needle.dataset.edge, left: needle.style.left, display: needle.style.display,
                color: needle.style.getPropertyValue('--needle-color'), border: needle.style.getPropertyValue('--needle-border-color') } : null,
              wrappers: root.querySelectorAll('.needle-layer').length,
              clip: root.querySelector('.bar-fill-reveal').style.clipPath,
              paint: [...root.querySelectorAll('.bar-paint-layer')].map(node => [node.dataset.layer, node.style.cssText]),
            };
          };
          const sequence = initialBaseline === 25 ? [25, 'unknown', 'unknown', 25, 25] : ['unknown', 'unknown', 25, 25, 'unknown'];
          const results = [];
          for (const [index, baseline] of sequence.entries()) {
            const previousNeedles = roots.map(root => root.querySelector('.needle-marker'));
            if (index) {
              const hass = hassFor(baseline);
              card.hass = hass; feature.hass = hass;
              await feature.updateComplete;
            }
            const model = buildBarRenderModel(buildRowViewModel({ entityConfig: appearance,
              entityState: power, hass: hassFor(baseline) }), appearance, { height: 'var(--sbcp-row-height)' });
            const fresh = document.createElement('div');
            fresh.innerHTML = renderBar(model);
            const noRebuild = roots.every((root, host) => {
              const nodes = stableNodes(root);
              return nodes.length === original[host].length && nodes.every((node, i) => node === original[host][i]);
            });
            const needles = roots.map(root => root.querySelector('.needle-marker'));
            const preserved = needles.every((node, host) => !node || !previousNeedles[host] || node === previousNeedles[host]);
            const adapterStates = roots.map(read);
            const observers = roots.map(root => {
              const observer = new MutationObserver(() => {});
              observer.observe(root.querySelector('.bar-track'), { childList: true, subtree: true, attributes: true });
              return observer;
            });
            // Exercise the patcher even when an adapter would skip equal readings.
            roots.forEach(root => patchBar(root, model));
            const needleChurn = observers.some((observer, host) => {
              const records = observer.takeRecords(); observer.disconnect();
              return records.some(record => record.type === 'childList'
                || (needles[host] && (record.target === needles[host] || record.target === needles[host].parentElement)));
            });
            results.push({ baseline, card: adapterStates[0], feature: adapterStates[1], patched: roots.map(read),
              fresh: read(fresh), noRebuild, preserved, needleChurn,
              appearance: needles.map(node => node ? { width: getComputedStyle(node).width,
                color: getComputedStyle(node).backgroundColor, filter: getComputedStyle(node).filter } : null) });
          }
          return results;
        }, { scaleDirection, barDirection, needleEnabled, initialBaseline });
        for (const result of results) {
          expect(result.card).toEqual(result.fresh);
          expect(result.feature).toEqual(result.fresh);
          for (const patched of result.patched) expect(patched).toEqual(result.fresh);
          expect(result.noRebuild).toBe(true);
          expect(result.preserved).toBe(true);
          expect(result.needleChurn).toBe(false);
          const visible = needleEnabled && result.baseline === 'unknown';
          expect(result.card.wrappers).toBe(visible ? 1 : 0);
          if (visible) {
            expect(result.card.needle).toMatchObject({ display: 'block', left: scaleDirection === 'reverse' ? '25%' : '75%' });
            for (const appearance of result.appearance) {
              expect(appearance).toMatchObject({ width: '6px', color: 'rgb(0, 255, 204)' });
              expect(appearance.filter).toContain('drop-shadow');
            }
          } else expect(result.card.needle).toBeNull();
        }
      });
    }
  }
}
