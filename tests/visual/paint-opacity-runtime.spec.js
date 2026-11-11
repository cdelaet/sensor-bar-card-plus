const { test, expect } = require('@playwright/test');

for (const fillStyle of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
  for (const scaleDirection of ['normal', 'reverse']) for (const barDirection of ['normal', 'reverse']) {
    test(`${fillStyle} opacity matches fresh and incremental renders (${scaleDirection}, ${barDirection})`, async ({ page }) => {
      await page.goto('/tests/visual/fixtures/harness.html');
      const result = await page.evaluate(async ({ fillStyle, scaleDirection, barDirection }) => {
        const { normalizeCardConfig } = await import('/src/config/normalize.js');
        const { buildRowViewModel } = await import('/src/view-model/row-view-model.js');
        const { buildBarRenderModel } = await import('/src/view-model/bar-render-model.js');
        const { renderBar, patchBar } = await import('/src/render/bar-renderer.js');
        const { barTrackStyles, barMarkerStyles } = await import('/src/render/bar-styles.js');
        const raw = opacity => ({ entities: [{
          entity: 'sensor.power',
          scale: { min: 0, max: 100, direction: scaleDirection },
          bar: { direction: barDirection, needle: true, above_target_color: 'rgb(20 30 40 / 60%)', paint: {
            fill_style: fillStyle, color: 'rgb(18 52 86 / 50%)', opacity,
            segments: [{ from: 0, to: 50, color: 'rgb(18 52 86 / 50%)' }, { from: 50, to: 100, color: '#abcdef' }],
            gradient_stops: [{ pos: 0, color: 'rgb(18 52 86 / 50%)' }, { pos: 100, color: '#abcdef' }],
          } },
          target: { at: 50 }, peak: { enabled: true }, floor: { enabled: true },
          markers: [{ id: 'reference', at: 25 }],
        }] });
        const getModel = opacity => {
          const config = normalizeCardConfig(raw(opacity)).entities[0];
          const entityState = { state: '75', attributes: {} };
          const row = buildRowViewModel({ entityConfig: config, entityState, extrema: { peak: { value: 90 }, floor: { value: 10 } } });
          return buildBarRenderModel(row, config, { height: 32 });
        };
        const host = document.createElement('div');
        host.attachShadow({ mode: 'open' }).innerHTML = `<style>${barTrackStyles}${barMarkerStyles}</style><div id="container">${renderBar(getModel(100), { insideContent: '<span class="bar-inner-label">75</span>' })}</div>`;
        document.body.append(host);
        const root = host.shadowRoot;
        const container = root.querySelector('#container');
        const layerNodes = [...container.querySelectorAll('.bar-paint-layer')];
        const outputs = [];
        for (const opacity of [0, 37, 100]) {
          const model = getModel(opacity);
          patchBar(container, model);
          const actual = [...container.querySelectorAll('.bar-paint-layer')].map(node => node.getAttribute('style'));
          const fresh = document.createElement('div');
          fresh.innerHTML = renderBar(model, { insideContent: '<span class="bar-inner-label">75</span>' });
          const expected = [...fresh.querySelectorAll('.bar-paint-layer')].map(node => node.getAttribute('style'));
          outputs.push({
            opacity,
            actual,
            expected,
            reveal: container.querySelector('.bar-fill-reveal').style.clipPath,
            expectedReveal: fresh.querySelector('.bar-fill-reveal').style.clipPath,
            labelOpacity: getComputedStyle(container.querySelector('.bar-inner-label')).opacity,
            needleOpacity: getComputedStyle(container.querySelector('.needle-marker')).opacity,
            markerOpacity: getComputedStyle(container.querySelector('.target-marker')).opacity,
            aboveTargetOpacity: container.querySelector('[data-layer="above-target"]').style.opacity,
            sameNodes: layerNodes.every((node, index) => node === container.querySelectorAll('.bar-paint-layer')[index]),
          });
        }
        return outputs;
      }, { fillStyle, scaleDirection, barDirection });

      for (const render of result) {
        expect(render.actual).toEqual(render.expected);
        expect(render.sameNodes).toBe(true);
        expect(render.reveal).toBe(render.expectedReveal);
        if (render.opacity === 100) expect(render.actual[0]).not.toContain('opacity:');
        else expect(render.actual[0]).toContain(`opacity:${render.opacity / 100};`);
        expect(render.actual.slice(1).every(style => !style.includes('opacity:'))).toBe(true);
        expect(render.labelOpacity).toBe('1');
        expect(render.needleOpacity).toBe('1');
        expect(render.markerOpacity).toBe('1');
        expect(render.aboveTargetOpacity).toBe('');
      }
    });
  }
}
