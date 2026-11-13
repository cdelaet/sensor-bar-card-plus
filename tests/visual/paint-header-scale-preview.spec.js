const { test, expect } = require('@playwright/test');

const colors = ['#3949AB', '#1E88E5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A', '#D4E157', '#FFCA28',
  '#FFA726', '#FB8C00', '#E53935', '#8E24AA'];
const boundaries = [5, 10, 15, 18, 20, 22, 24, 26, 28, 30, 33, 36, 40];
const scaleSegments = colors.map((color, index) => ({ from: boundaries[index], to: boundaries[index + 1], color }));

async function mount(page, host, source) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ host }) => {
    const tag = host === 'Card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature';
    await customElements.whenDefined(tag);
    const editor = await customElements.get(tag).getConfigElement();
    const config = { scale: { min: { fixed: 15 }, max: { fixed: 25 } },
      bar: { fill_style: 'band_gradient', color: '#123456', segments: structuredClone(window.__scaleSegments),
        gradient_stops: [{ pos: 0, color: '#123456' }, { pos: 45, color: '#abcdef' }, { pos: 100, color: '#fedcba' }] } };
    if (host === 'Card') config.entities = ['sensor.temperature'];
    else config.type = 'custom:sensor-bar-card-plus-feature';
    window.__headerPreviewEvents = 0;
    editor.addEventListener('config-changed', () => { window.__headerPreviewEvents += 1; });
    editor.setConfig(config);
    if (host === 'Feature') editor.context = { entity_id: 'sensor.temperature' };
    editor.hass = { states: {} };
    document.querySelector('#mount').style.width = '360px';
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
    const runtime = document.createElement('sensor-bar-card-plus');
    runtime.setConfig({ ...config, entities: ['sensor.temperature'] });
    runtime.hass = { states: { 'sensor.temperature': { state: '20', attributes: {} } } };
    document.body.append(runtime);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.__headerPreviewEditor = editor;
    window.__headerPreviewRuntime = runtime;
  }, { host });
  return page.locator(host === 'Card' ? 'sensor-bar-card-plus-editor' : 'sensor-bar-card-plus-feature-editor');
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Feature']) {
  test(`${host} Paint header preview uses complete segment extent (${source})`, async ({ page }) => {
    await page.addInitScript(segmentColors => { window.__scaleSegments = segmentColors.map((color, index) => ({
      from: [5, 10, 15, 18, 20, 22, 24, 26, 28, 30, 33, 36][index],
      to: [10, 15, 18, 20, 22, 24, 26, 28, 30, 33, 36, 40][index], color,
    })); }, colors);
    const editor = await mount(page, host, source);
    const result = await editor.evaluate(async el => {
      const { getBarPaintEditorState } = await import('/src/editor/sections/bar-appearance.js');
      const { compilePaint } = await import('/src/view-model/paint-compiler.js');
      const state = () => getBarPaintEditorState(el._createSectionContext(), { type: 'card' });
      const runtime = window.__headerPreviewRuntime;
      const normalizedGradient = gradient => {
        const probe = document.createElement('span');
        probe.style.backgroundImage = gradient;
        return probe.style.backgroundImage;
      };
      const cssColors = window.__scaleSegments.map(segment => {
        const channels = segment.color.slice(1).match(/.{2}/g).map(channel => parseInt(channel, 16));
        return `rgb(${channels.join(', ')})`;
      });
      const eventsBefore = window.__headerPreviewEvents;
      const results = {};

      for (const fill_style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
        const next = structuredClone(el._config);
        next.bar.fill_style = fill_style;
        el.setConfig(next);
        runtime.setConfig({ ...next, entities: ['sensor.temperature'] });
        await new Promise(resolve => requestAnimationFrame(resolve));
        const paint = state();
        const preview = el.shadowRoot.querySelector('#card-paint-editor .paint-editor-swatch');
        const runtimeLayer = runtime.shadowRoot.querySelector('.bar-paint-layer[data-layer="base"]');
        results[fill_style] = {
          image: preview.style.backgroundImage,
          expected: normalizedGradient(compilePaint(paint.paint, paint.previewScale).gradient),
          effectiveExpected: normalizedGradient(compilePaint(paint.paint, paint.scale).gradient),
          runtimeImage: runtimeLayer?.style.backgroundImage ?? null,
          previewScale: paint.previewScale,
          scale: paint.scale,
          size: (() => { const rect = preview.getBoundingClientRect(); return [rect.width, rect.height]; })(),
          savedSegments: JSON.stringify(el._config.bar.segments),
          cssColors,
        };
      }

      const percentConfig = structuredClone(el._config);
      percentConfig.bar.fill_style = 'band_gradient';
      percentConfig.bar.segments = Array.from({ length: 12 }, (_, index) => ({
        from: `${index * (100 / 12)}%`, to: `${(index + 1) * (100 / 12)}%`, color: window.__scaleSegments[index].color,
      }));
      el.setConfig(percentConfig);
      await new Promise(resolve => requestAnimationFrame(resolve));
      const percentState = state();
      const percentPreview = el.shadowRoot.querySelector('#card-paint-editor .paint-editor-swatch').style.backgroundImage;
      const percent = { image: percentPreview, expected: normalizedGradient(compilePaint(percentState.paint, percentState.scale).gradient),
        previewScale: percentState.previewScale, scale: percentState.scale, savedSegments: JSON.stringify(el._config.bar.segments) };
      return { results, percent, eventsBefore, eventsAfter: window.__headerPreviewEvents,
        scaleConfig: el._config.scale, runtimeScaleConfig: runtime._config.scale };
    });

    for (const fillStyle of ['bands', 'soft_bands', 'band_gradient']) {
      expect(result.results[fillStyle].image).toBe(result.results[fillStyle].expected);
      for (const color of result.results[fillStyle].cssColors) expect(result.results[fillStyle].image).toContain(color);
      expect(result.results[fillStyle].previewScale).toMatchObject({ minValue: 5, maxValue: 40 });
    }
    for (const fillStyle of ['solid', 'gradient']) {
      expect(result.results[fillStyle].image).toBe(result.results[fillStyle].effectiveExpected);
      expect(result.results[fillStyle].previewScale).toEqual(result.results[fillStyle].scale);
    }
    for (const fillStyle of ['bands', 'soft_bands', 'band_gradient']) {
      const runtimeImage = result.results[fillStyle].runtimeImage;
      expect(runtimeImage).toBe(result.results[fillStyle].effectiveExpected);
      for (const color of result.results[fillStyle].cssColors.slice(0, 2).concat(result.results[fillStyle].cssColors.slice(7))) {
        expect(runtimeImage).not.toContain(color);
      }
      for (const color of result.results[fillStyle].cssColors.slice(2, 7)) {
        expect(runtimeImage).toContain(color);
      }
    }
    expect(result.results.band_gradient.size).toEqual([60, 32]);
    for (const fillStyle of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      expect(JSON.parse(result.results[fillStyle].savedSegments)).toEqual(scaleSegments);
    }
    expect(result.percent.image).toBe(result.percent.expected);
    expect(result.percent.previewScale).toEqual(result.percent.scale);
    expect(JSON.parse(result.percent.savedSegments)).toEqual(Array.from({ length: 12 }, (_, index) => ({
      from: `${index * (100 / 12)}%`, to: `${(index + 1) * (100 / 12)}%`, color: colors[index],
    })));
    expect(result.eventsAfter).toBe(result.eventsBefore);
    expect(result.scaleConfig).toEqual({ min: { fixed: 15 }, max: { fixed: 25 } });
    expect(result.runtimeScaleConfig).toMatchObject(result.scaleConfig);
  });
}
