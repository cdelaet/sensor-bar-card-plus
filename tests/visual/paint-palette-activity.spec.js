const { test, expect } = require('@playwright/test');

const styles = ['gradient', 'solid', 'bands', 'soft_bands', 'band_gradient'];
const palette = {
  segments: [{ from: '0%', to: '100%', color: '#123456' }],
  gradient_stops: [{ pos: 0, color: '#1133aa' }, { pos: 100, color: '#22cc66' }],
};
const rootId = destination => destination === 'Entity' ? 'entity-0-paint-editor' : 'card-paint-editor';
const fillId = destination => destination === 'Entity' ? 'entity-0-bar-fill-style' : 'bar-fill-style';

function configFor(destination, mode, style) {
  const local = mode === 'override' ? { fill_style: style } : mode === 'preset' ? { preset: 'night' } : {};
  if (mode === 'override' && destination !== 'Entity') local.preset = 'night';
  const config = { bar: { paint: local } };
  if (destination === 'Feature') config.type = 'custom:sensor-bar-card-plus-feature';
  else config.entities = ['sensor.power'];
  if (destination === 'Entity') {
    config.bar.paint = mode === 'inherited-local' ? { fill_style: style, ...palette } : { preset: 'night' };
    config.entities = [{ entity: 'sensor.power', bar: { paint: local } }];
  }
  return config;
}

async function mount(page, source, destination, mode, style) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async ({ destination, config, style }) => {
    const tag = destination === 'Feature' ? 'sensor-bar-card-plus-feature' : 'sensor-bar-card-plus';
    const editor = await customElements.get(tag).getConfigElement();
    let dashboard = { views: [{ cards: [{ type: 'custom:sensor-bar-card-plus', preset_library: {
      paint: { night: { fill_style: style,
        segments: [{ from: '0%', to: '100%', color: '#123456' }],
        gradient_stops: [{ pos: 0, color: '#1133aa' }, { pos: 100, color: '#22cc66' }],
      } },
    } }] }] };
    let listener;
    window.__activityEvents = [];
    window.__updateActivityRegistry = style => {
      dashboard.views[0].cards[0].preset_library.paint.night.fill_style = style;
      listener?.({ event_type: 'lovelace_updated' });
    };
    editor.setConfig(config);
    editor.hass = { states: {}, connection: {
      connected: true,
      sendMessagePromise: async () => structuredClone(dashboard),
      subscribeEvents: async callback => { listener = callback; return () => {}; },
      addEventListener() {}, removeEventListener() {},
    } };
    if (destination === 'Feature') editor.context = { entity_id: 'sensor.power' };
    editor.style.setProperty('--accent-color', '#b844cc');
    editor.style.setProperty('--secondary-text-color', '#556677');
    const parent = document.querySelector('#mount');
    parent.style.width = '420px';
    parent.addEventListener('config-changed', event => {
      window.__activityEvents.push(structuredClone(event.detail.config));
      editor.setConfig(event.detail.config);
    });
    parent.append(editor);
    await editor.updateComplete;
  }, { destination, config: configFor(destination, mode, style), style: mode === 'override' ? 'solid' : style });
  const editor = page.locator(destination === 'Feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
  const root = editor.locator(`#${rootId(destination)}`);
  await expect(root.locator('[data-paint-preset="true"] option[value="night"]')).toHaveCount(1);
  if (destination === 'Entity') await editor.locator('button[data-action="toggle-entity-overrides"][data-index="0"]').click();
  await root.locator(':scope > summary').press('Enter');
  for (const group of ['segments', 'gradient-stops']) {
    await root.locator(`#${destination === 'Entity' ? 'entity-0' : 'card'}-group-${group}`).click();
  }
  return { editor, root };
}

async function assertActivity(root, destination, style) {
  await expect(root.locator(`#${fillId(destination)}`)).toHaveValue(style);
  const gradient = root.locator('.override-group[data-group="gradient-stops"]');
  const segments = root.locator('.override-group[data-group="segments"]');
  const gradientNote = gradient.getByText('Only used with Gradient fill style', { exact: true });
  const segmentNote = segments.getByText('Only used with segment-based fill styles.', { exact: true });
  if (style === 'gradient') {
    await expect(gradientNote).toBeHidden();
    await expect(gradient).not.toHaveClass(/is-inactive/);
    await expect(gradient.locator('.override-group-summary')).not.toContainText('Inactive fill style');
  } else {
    await expect(gradientNote).toBeVisible();
    await expect(gradient).toHaveClass(/is-inactive/);
  }
  if (['bands', 'soft_bands', 'band_gradient'].includes(style)) {
    await expect(segmentNote).toBeHidden();
    await expect(segments).not.toHaveClass(/is-inactive/);
  } else {
    await expect(segmentNote).toBeVisible();
    await expect(segments).toHaveClass(/is-inactive/);
  }
}

for (const source of ['src', 'dist']) for (const destination of ['Card', 'Entity', 'Feature']) {
  const modes = destination === 'Entity' ? ['preset', 'override', 'inherited-preset', 'inherited-local'] : ['preset', 'override', 'default'];
  for (const mode of modes) test(`${destination} palette activity follows ${mode} paint across fill styles (${source})`, async ({ page }) => {
    const { editor, root } = await mount(page, source, destination, mode, 'gradient');
    for (const style of mode === 'default' ? ['bands'] : styles) {
      await page.evaluate(style => window.__updateActivityRegistry(style), mode === 'override' ? 'solid' : style);
      await editor.evaluate((editor, config) => editor.setConfig(config), configFor(destination, mode, style));
      await assertActivity(root, destination, style);
    }
    expect(await page.evaluate(() => window.__activityEvents)).toEqual([]);
  });

  test(`${destination} palette activity updates in place when preset paint changes (${source})`, async ({ page }) => {
    const { root } = await mount(page, source, destination, destination === 'Entity' ? 'inherited-preset' : 'preset', 'gradient');
    await root.evaluate(root => { window.__activityRoot = root; });
    for (const style of styles) {
      await page.evaluate(style => window.__updateActivityRegistry(style), style);
      await assertActivity(root, destination, style);
      expect(await root.evaluate(root => root === window.__activityRoot)).toBe(true);
    }
    expect(await page.evaluate(() => window.__activityEvents)).toEqual([]);
  });

  test(`${destination} Override labels use only theme accent color and clear with ownership (${source})`, async ({ page }) => {
    const { root } = await mount(page, source, destination, destination === 'Entity' ? 'inherited-preset' : 'preset', 'gradient');
    const label = root.locator('[data-paint-source="opacity"]');
    await expect(label).toHaveText('Preset');
    const weight = await label.evaluate(node => getComputedStyle(node).fontWeight);
    await root.locator('[data-paint-property="opacity"]').fill('37');
    await expect(label).toHaveText('Override');
    await expect(label).toHaveCSS('color', 'rgb(184, 68, 204)');
    await expect(label).toHaveCSS('font-weight', weight);
    for (const meta of await root.locator('.paint-property-meta').all()) {
      if (await meta.innerText() === 'Override') await expect(meta).toHaveCSS('color', 'rgb(184, 68, 204)');
      else await expect(meta).toHaveCSS('color', 'rgb(85, 102, 119)');
    }
    await root.locator('[data-action="clear-paint-property"][data-property="opacity"]').click();
    await expect(label).toHaveText('Preset');
    await expect(label).toHaveCSS('color', 'rgb(85, 102, 119)');
    await expect(label).toHaveCSS('font-weight', weight);
  });
}
