const { test, expect } = require('@playwright/test');

async function mount(page, host, source) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host }) => {
    const tag = host === 'Card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    const segments = Array.from({ length: 12 }, (_, index) => ({
      from: index * 10, to: (index + 1) * 10,
      color: `#${(0x102030 + index * 0x010101).toString(16).padStart(6, '0')}`,
    }));
    const config = { bar: { fill_style: 'band_gradient', segments } };
    if (host === 'Card') config.entities = ['sensor.power'];
    else config.type = 'custom:sensor-bar-card-plus-feature';
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    editor.setConfig(config);
    editor.hass = { states: {} };
    if (host === 'Feature') editor.context = { entity_id: 'sensor.power' };
    document.querySelector('#mount').style.width = '360px';
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, { host });
  return page.locator(host === 'Card' ? 'sensor-bar-card-plus-editor' : 'sensor-bar-card-plus-feature-editor');
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} keeps twelve segment rows responsive through refreshes and edits (${source})`, async ({ page }) => {
    const editor = await mount(page, host, source);
    await editor.locator('#card-paint-editor > summary').click();

    const segmentInputs = editor.locator('input[data-kind="segment-from"]');
    await expect(segmentInputs).toHaveCount(12);

    const profile = await editor.evaluate(el => {
      const section = el._segmentsSection;
      const metrics = { validationBatches: 0, temporaryTemplates: 0 };
      const build = section._buildSegmentValidationRows.bind(section);
      section._buildSegmentValidationRows = (...args) => { metrics.validationBatches += 1; return build(...args); };
      const resolveAutomatic = section._resolveAutomaticEndRows.bind(section);
      section._resolveAutomaticEndRows = (...args) => { metrics.validationBatches += 1; return resolveAutomatic(...args); };
      const syncRows = section._syncRows.bind(section);
      section._syncRows = (...args) => {
        const render = section.render;
        let rendered = false;
        section.render = (...renderArgs) => { rendered = true; return render.apply(section, renderArgs); };
        try { return syncRows(...args); }
        finally {
          section.render = render;
          if (rendered) metrics.temporaryTemplates += 1;
        }
      };
      window.__segmentProfile = metrics;
      return metrics;
    });
    await editor.locator('#card-group-segments').click();
    const expansion = await editor.evaluate(() => ({ ...window.__segmentProfile }));

    await editor.evaluate(el => { window.__segmentProfile.validationBatches = 0; window.__segmentProfile.temporaryTemplates = 0; });
    const color = editor.locator('input[data-kind="segment-color"]').nth(5);
    await color.evaluate(input => {
      input.value = '#aabbcc';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(color).toHaveValue('#aabbcc');
    await expect(editor.locator('#card-segment-preview-track [data-preview-kind="segment"]').nth(5))
      .toHaveAttribute('style', /background-color:#aabbcc/i);
    const colorEdit = await editor.evaluate(() => ({ ...window.__segmentProfile }));

    await editor.evaluate(el => { window.__segmentProfile.validationBatches = 0; window.__segmentProfile.temporaryTemplates = 0; });
    await editor.evaluate(el => { window.__stableSegmentInput = el.shadowRoot.querySelector('input[data-kind="segment-from"]'); });
    await editor.evaluate(el => {
      el.hass = { states: { 'sensor.power': { state: '42' } } };
    });
    const hassRefresh = await editor.evaluate(() => ({ ...window.__segmentProfile }));
    expect(await editor.evaluate(el => el.shadowRoot.querySelector('input[data-kind="segment-from"]') === window.__stableSegmentInput)).toBe(true);
    expect(hassRefresh.temporaryTemplates).toBe(0);

    const start = segmentInputs.nth(4);
    await start.evaluate(input => {
      input.value = '35';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(editor.locator('#segment-row-hint-4')).toContainText('Segments overlap.');
    const draft = editor.locator('#segment-draft-from');
    await draft.fill('unfinished');
    await editor.evaluate(el => { el.hass = { states: {} }; });
    await expect(draft).toHaveValue('unfinished');

    await editor.evaluate(el => { window.__oldSegmentInput = el.shadowRoot.querySelector('input[data-kind="segment-from"]'); });
    await editor.evaluate(el => {
      const config = structuredClone(el._config);
      config.bar.segments.push({ from: 120, to: 130, color: '#abcdef' });
      el.setConfig(config);
    });
    await expect(segmentInputs).toHaveCount(13);
    await expect(editor.locator('#segment-draft-from')).toHaveValue('130');
    expect(await editor.evaluate(el => el.shadowRoot.querySelector('input[data-kind="segment-from"]') === window.__oldSegmentInput)).toBe(false);
    expect(expansion.validationBatches).toBeLessThanOrEqual(12);
    expect(colorEdit.validationBatches).toBeLessThanOrEqual(12);
  });
}
