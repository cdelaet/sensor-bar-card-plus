const { test, expect } = require('./visual-test.cjs');

for (const scaleDirection of ['normal', 'reverse']) {
  test(`paint layers reconcile membership, order and identity with ${scaleDirection} Scale`, async ({ page }) => {
    await page.goto('/tests/visual/fixtures/harness.html');
    await page.evaluate(async scaleDirection => {
      const { normalizeCardConfig } = await import('/src/config/normalize.js');
      const { buildRowViewModel } = await import('/src/view-model/row-view-model.js');
      const { buildBarRenderModel } = await import('/src/view-model/bar-render-model.js');
      const { renderBar, patchBar } = await import('/src/render/bar-renderer.js');
      const { barTrackStyles, barMarkerStyles } = await import('/src/render/bar-styles.js');
      const appearance = normalizeCardConfig({ entities: [{ entity: 'sensor.power',
        scale: { min: 0, max: 100, direction: scaleDirection },
        bar: { fill_style: 'solid', color: '#123456', above_target_color: '#00ff00', animated: false },
        baseline: { at: 25, above: { color: 'red' }, below: { color: 'blue' } }, target: { at: 60 },
      }] }).entities[0];
      const model = buildBarRenderModel(buildRowViewModel({ entityConfig: appearance,
        entityState: { state: '85', attributes: {} } }), appearance, { height: 38 });
      const layers = model.fill.paintLayers.map(layer => layer.id.startsWith('baseline-')
        ? { ...layer, paintStyle: `display:block;inset:0;background:${layer.id === 'baseline-above' ? 'red' : 'blue'};` }
        : layer);
      const mount = document.getElementById('mount');
      mount.innerHTML = `<style>${barTrackStyles}${barMarkerStyles}#mount * { transition:none!important; }</style>
        <div id="patched"></div><div id="fresh"></div>`;
      const root = document.getElementById('patched');
      const fresh = document.getElementById('fresh');
      for (const host of [root, fresh]) host.style.cssText = 'position:absolute;left:24px;top:24px;width:400px;--sbcp-row-height:38px';
      fresh.style.visibility = 'hidden';
      const withLayers = paintLayers => ({ ...model, fill: { ...model.fill, paintLayers } });
      root.innerHTML = renderBar(withLayers(layers));
      const reveal = root.querySelector('.bar-fill-reveal');
      const readNodes = () => new Map([...reveal.children].map(node => [node.dataset.layer, node]));
      let previous = readNodes();
      const observer = new MutationObserver(() => {});
      observer.observe(reveal, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
      window.__patchPaintLayers = step => {
        let next = layers;
        if (step === 'remove') next = layers.filter(layer => layer.id !== 'baseline-above');
        if (step === 'reorder') next = [layers[0], layers[2], layers[1], layers[3]];
        if (step === 'update' || step === 'repeat') next = [layers[0], layers[2],
          { ...layers[1], paintStyle: 'display:block;inset:0;background:yellow;' }, layers[3]];
        if (step === 'empty') next = [];
        if (step === 'custom') next = [{ ...layers[0], id: 'custom-layer' }];
        const nextModel = withLayers(next);
        observer.takeRecords();
        patchBar(root, nextModel);
        const mutations = observer.takeRecords().filter(record => record.type === 'childList' || record.target !== reveal);
        const current = readNodes();
        const preserved = [...previous].filter(([id]) => current.has(id)).every(([id, node]) => current.get(id) === node);
        previous = current;
        fresh.innerHTML = renderBar(nextModel);
        const read = host => [...host.querySelectorAll('.bar-paint-layer')].map(node => ({
          id: node.dataset.layer, css: node.style.cssText,
        }));
        return { patched: read(root), fresh: read(fresh), preserved, revealPreserved: reveal === root.querySelector('.bar-fill-reveal'),
          moves: mutations.filter(record => record.type === 'childList').length,
          styleWrites: mutations.filter(record => record.type === 'attributes').length };
      };
    }, scaleDirection);
    let beforeReorder;
    for (const step of ['remove', 'restore', 'reorder', 'update', 'repeat', 'empty', 'custom', 'restore']) {
      const result = await page.evaluate(step => window.__patchPaintLayers(step), step);
      expect(result.patched, step).toEqual(result.fresh);
      expect(result.preserved, step).toBe(true);
      expect(result.revealPreserved, step).toBe(true);
      if (step === 'update' || step === 'repeat') expect(result.moves, step).toBe(0);
      if (step === 'reorder' || step === 'repeat') expect(result.styleWrites, step).toBe(0);
      // Capture both trees at the same physical pixels to avoid edge dithering.
      const actual = await page.locator('#patched .bar-track').screenshot({ animations: 'disabled' });
      await page.evaluate(() => {
        document.getElementById('patched').style.visibility = 'hidden';
        document.getElementById('fresh').style.visibility = 'visible';
      });
      const expected = await page.locator('#fresh .bar-track').screenshot({ animations: 'disabled' });
      await page.evaluate(() => {
        document.getElementById('patched').style.visibility = 'visible';
        document.getElementById('fresh').style.visibility = 'hidden';
      });
      expect(actual.equals(expected), step).toBe(true);
      if (step === 'restore' && !beforeReorder) beforeReorder = actual;
      if (step === 'reorder') expect(actual.equals(beforeReorder)).toBe(false);
    }
  });
}
