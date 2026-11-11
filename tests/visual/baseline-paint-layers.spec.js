const { test, expect } = require('@playwright/test');

for (const scaleDirection of ['normal', 'reverse']) {
  test(`independent Baseline layers preserve compositing and patching with ${scaleDirection} Scale`, async ({ page }) => {
    await page.goto('/tests/visual/fixtures/harness.html');
    await page.evaluate(async scaleDirection => {
      const { normalizeCardConfig } = await import('/src/config/normalize.js');
      const { buildRowViewModel } = await import('/src/view-model/row-view-model.js');
      const { buildBarRenderModel, getFullScalePaintStyle, getColor } = await import('/src/view-model/bar-render-model.js');
      const { renderBar, patchBar } = await import('/src/render/bar-renderer.js');
      const { barTrackStyles, barMarkerStyles, getBarAnimationStyles } = await import('/src/render/bar-styles.js');
      const mount = document.getElementById('mount');
      mount.innerHTML = `<style>${barTrackStyles}${barMarkerStyles}${getBarAnimationStyles('[data-bar-animated="false"]')}</style>
        <div id="patched" data-bar-animated="false"></div><div id="fresh" data-bar-animated="false"></div><div id="legacy" data-bar-animated="false"></div>`;
      for (const root of mount.querySelectorAll('[data-bar-animated]')) root.style.cssText = 'width:401px;--sbcp-row-height:37px';
      let nodes;
      window.__drawBaselineLayers = (fill_style, value, baseline, patch) => {
        const appearance = normalizeCardConfig({ entities: [{
          entity: 'sensor.power', scale: { min: 0, max: 100, direction: scaleDirection },
          bar: { fill_style, color: '#123456', direction: 'reverse', animated: false,
            gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 100, color: '#abcdef' }],
            segments: [{ from: 0, to: 40, color: '#123456' }, { from: 60, to: 100, color: '#abcdef' }],
            above_target_color: 'rgba(0,255,0,0.4)' },
          baseline: { at: { entity: 'sensor.baseline' },
            below: { color: 'rgba(0,0,255,0.5)' }, above: { color: 'rgba(255,0,0,0.5)' } },
          target: { at: 60 },
        }] }).entities[0];
        const row = buildRowViewModel({ entityConfig: appearance,
          entityState: { state: String(value), attributes: {} },
          hass: { states: { 'sensor.baseline': { state: String(baseline), attributes: {} } } } });
        const model = buildBarRenderModel(row, appearance, { height: 37 });
        const root = document.getElementById('patched');
        if (patch) patchBar(root, model);
        else {
          root.innerHTML = renderBar(model);
          nodes = [...root.querySelectorAll('*')];
        }
        document.getElementById('fresh').innerHTML = renderBar(model);
        // Keep the former single-background composition as a visual oracle.
        const legacyBase = { ...model.fill.paintLayers[0], paintStyle: getFullScalePaintStyle(
          appearance, getColor(row.percent, appearance, row.min, row.max), row.targetPercent,
          row.baselinePercent, row.min, row.max, scaleDirection,
        ) };
        const legacy = { ...model, fill: { ...model.fill, paintLayers: [
          legacyBase, model.fill.paintLayers.find(layer => layer.id === 'above-target'),
        ] } };
        document.getElementById('legacy').innerHTML = renderBar(legacy);
        const read = node => [...node.querySelectorAll('.bar-paint-layer')].map(layer => [layer.dataset.layer, layer.style.cssText]);
        return {
          stable: nodes.every((node, index) => node === root.querySelectorAll('*')[index]),
          patched: read(root), fresh: read(document.getElementById('fresh')),
          clip: root.querySelector('.bar-fill-reveal').style.clipPath,
          freshClip: document.querySelector('#fresh .bar-fill-reveal').style.clipPath,
        };
      };
    }, scaleDirection);
    for (const fillStyle of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      for (const [value, baseline, patch] of [[85, 27.35, false], [10, 68.75, true], [85, 'unknown', true], [85, 27.35, true]]) {
        const result = await page.evaluate(args => window.__drawBaselineLayers(...args), [fillStyle, value, baseline, patch]);
        expect(result.stable).toBe(true);
        expect(result.patched).toEqual(result.fresh);
        expect(result.clip).toBe(result.freshClip);
        const actual = await page.locator('#patched .bar-track').screenshot({ animations: 'disabled' });
        const expected = await page.locator('#legacy .bar-track').screenshot({ animations: 'disabled' });
        const maxChannelDelta = await page.evaluate(async images => {
          const pixels = await Promise.all(images.map(async base64 => {
            const image = new Image();
            image.src = `data:image/png;base64,${base64}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width; canvas.height = image.height;
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            return context.getImageData(0, 0, canvas.width, canvas.height).data;
          }));
          return pixels[0].reduce((max, channel, index) => Math.max(max, Math.abs(channel - pixels[1][index])), 0);
        }, [actual.toString('base64'), expected.toString('base64')]);
        if (maxChannelDelta > 1) {
          await test.info().attach('separated-layers', { body: actual, contentType: 'image/png' });
          await test.info().attach('legacy-composition', { body: expected, contentType: 'image/png' });
        }
        // Separate surfaces can round alpha compositing by one 8-bit channel step.
        expect(maxChannelDelta, `${fillStyle}, value ${value}, baseline ${baseline}`).toBeLessThanOrEqual(1);
      }
    }
  });

  test(`Baseline layer updates stay in Card/Feature parity with ${scaleDirection} Scale`, async ({ page }) => {
    await page.goto('/tests/visual/fixtures/harness.html');
    await page.evaluate(async scaleDirection => {
      const config = {
        scale: { min: 0, max: 100, direction: scaleDirection },
        bar: { fill_style: 'solid', color: '#123456', direction: 'reverse', animated: false,
          needle: true, above_target_color: '#00ff00' },
        baseline: { at: { entity: 'sensor.baseline' }, above: { color: '#ff0000' }, below: { color: '#0000ff' } },
        target: { at: { entity: 'sensor.target' } },
      };
      const states = { 'sensor.power': window.__sbcpCreateState(85), 'sensor.baseline': window.__sbcpCreateState(25),
        'sensor.target': window.__sbcpCreateState(60) };
      await window.__sbcpRenderCard({ config: { ...config, entities: ['sensor.power'] }, states });
      await window.__sbcpRenderFeature({ config, states, context: { entity_id: 'sensor.power' } });
    }, scaleDirection);
    for (const [value, baseline, target] of [[85, 25, 60], [10, 70, 15], [85, 'unknown', 'unknown'], [85, 25, 60]]) {
      const result = await page.evaluate(async ([value, baseline, target]) => {
        const card = document.querySelector('sensor-bar-card-plus');
        const feature = document.querySelector('sensor-bar-card-plus-feature');
        const hass = { states: { 'sensor.power': window.__sbcpCreateState(value), 'sensor.baseline': window.__sbcpCreateState(baseline),
          'sensor.target': window.__sbcpCreateState(target) } };
        card.hass = hass;
        feature.hass = hass;
        await feature.updateComplete;
        const read = element => {
          const root = element.shadowRoot;
          return {
            layers: [...root.querySelectorAll('.bar-paint-layer')].map(layer => ({ id: layer.dataset.layer,
              image: getComputedStyle(layer).backgroundImage, color: getComputedStyle(layer).backgroundColor,
              display: layer.style.display, clip: layer.style.clipPath, zIndex: layer.style.zIndex })),
            clip: root.querySelector('.bar-fill-reveal').style.clipPath,
          };
        };
        return { card: read(card), feature: read(feature) };
      }, [value, baseline, target]);
      expect(result.card).toEqual(result.feature);
      expect(result.card.layers.filter(layer => layer.id.startsWith('baseline-')).map(layer => layer.display))
        .toEqual(baseline === 'unknown' ? ['none', 'none'] : ['block', 'block']);
      expect(result.card.layers.find(layer => layer.id === 'above-target').display).toBe(target === 'unknown' ? 'none' : 'block');
    }
  });
}
