const { test, expect } = require('./visual-test.cjs');

const destinations = ['Preset', 'Card', 'Entity', 'Feature'];
const rootId = destination => destination === 'Preset' ? 'preset-paint-editor'
  : destination === 'Entity' ? 'entity-0-paint-editor' : 'card-paint-editor';
const kind = (destination, suffix) => `${destination === 'Entity' ? 'entity-' : ''}${suffix}`;
const paint = (colors, fill_style = 'gradient') => ({
  fill_style, color: colors[0], opacity: 63,
  segments: colors.map((color, index) => ({ from: `${index * 50}%`, to: `${(index + 1) * 50}%`, color })),
  gradient_stops: colors.map((color, index) => ({ pos: index * 100, color })),
});
const initial = {
  card: {
    type: 'custom:sensor-bar-card-plus', future: { keep: true },
    preset_library: { paint: { warm: paint(['#1133aa', '#22cc66']), sibling: paint(['#336699', '#996633']) }, custom: { keep: true } },
    bar: { paint: paint(['#990011', '#009922']) },
    entities: [{ entity: 'sensor.power', bar: { paint: paint(['#445566', '#778899']) } }],
  },
  feature: { type: 'custom:sensor-bar-card-plus-feature', bar: { paint: paint(['#bb4400', '#00aabb']) }, future: true },
};

async function mount(page, source, configs = initial) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async configs => {
    window.__destinationEvents = { card: [], feature: [] };
    window.__nativePaintEvents = [];
    for (const host of ['card', 'feature']) {
      const tag = host === 'card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature';
      await customElements.whenDefined(tag);
      const editor = await customElements.get(tag).getConfigElement();
      const parent = document.createElement('section');
      parent.dataset.host = host;
      parent.style.width = '420px';
      // Observe across the editor's shadow boundary, as HA does, and echo the config.
      parent.addEventListener('config-changed', event => {
        window.__destinationEvents[host].push({ config: structuredClone(event.detail.config), bubbles: event.bubbles, composed: event.composed });
        editor.setConfig(event.detail.config);
      });
      editor.shadowRoot.addEventListener('input', event => {
        if (event.target.type === 'color') window.__nativePaintEvents.push({
          type: event.type, trusted: event.isTrusted, value: event.target.value,
          destination: event.target.closest('.paint-editor')?.id, host,
        });
      }, true);
      editor.shadowRoot.addEventListener('change', event => {
        if (event.target.type === 'color') window.__nativePaintEvents.push({
          type: event.type, trusted: event.isTrusted, value: event.target.value,
          destination: event.target.closest('.paint-editor')?.id, host,
        });
      }, true);
      editor.setConfig(structuredClone(configs[host]));
      if (host === 'feature') editor.context = { entity_id: 'sensor.power' };
      editor.hass = { states: {} };
      parent.append(editor);
      document.querySelector('#mount').append(parent);
      await editor.updateComplete;
    }
  }, configs);
}

function editorFor(page, destination) {
  return page.locator(destination === 'Feature' ? 'sensor-bar-card-plus-feature-editor' : 'sensor-bar-card-plus-editor');
}
const rootFor = (page, destination) => editorFor(page, destination).locator(`#${rootId(destination)}`);
const paintAt = (configs, destination) => destination === 'Preset' ? configs.card.preset_library.paint.warm
  : destination === 'Entity' ? configs.card.entities[0].bar.paint
    : configs[destination === 'Feature' ? 'feature' : 'card'].bar.paint;

async function open(page, destination, palette = 'gradient_stops') {
  const editor = editorFor(page, destination);
  if (destination === 'Preset' && !await editor.locator('#paint-presets').evaluate(node => node.open)) {
    await editor.locator('#paint-presets > summary').click();
  }
  if (destination === 'Entity') {
    const toggle = editor.locator('button[data-action="toggle-entity-overrides"][data-index="0"]');
    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
    const bar = editor.locator('#entity-0-group-bar');
    if (await bar.getAttribute('aria-expanded') === 'false') await bar.click();
  }
  const root = rootFor(page, destination);
  if (!await root.evaluate(node => node.open)) await root.locator(':scope > summary').press('Enter');
  await expect(root).toHaveJSProperty('open', true);
  if (destination !== 'Preset') {
    const toggle = root.locator(`button[data-action="${destination === 'Entity' ? 'toggle-override-group' : 'toggle-card-group'}"][data-group="${palette === 'segments' ? 'segments' : 'gradient-stops'}"]`);
    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
  }
  return root;
}

async function hassUpdate(page) {
  await page.evaluate(() => {
    for (const editor of document.querySelectorAll('sensor-bar-card-plus-editor, sensor-bar-card-plus-feature-editor')) {
      editor.hass = { states: { 'sensor.power': { state: '52', attributes: {} } } };
    }
  });
}

// Chromium's native chooser has saturation, eyedropper and hue before RGB.
// Keyboard input here produces trusted events; assigning .value/dispatchEvent
// would miss both the native picker lifecycle and the original regression.
async function nativeRed(page, input, red, whileOpen = async () => {}, afterInput = async () => {}) {
  const next = `#${red.toString(16).padStart(2, '0')}${(await input.inputValue()).slice(3)}`;
  await input.focus();
  await input.press('Space');
  await expect.poll(() => input.evaluate(node => node.matches(':open'))).toBe(true);
  // The chooser paints outside the page DOM; let its opening frame complete
  // before sending keys to the popup rather than the underlying editor.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await whileOpen();
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('Tab');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(String(red));
  try {
    await afterInput(next);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
  } finally {
    await page.keyboard.press('Escape');
    await input.press('Tab');
  }
  return next;
}

async function assertPalettes(page, expected) {
  for (const destination of destinations) {
    const root = rootFor(page, destination);
    const p = paintAt(expected, destination);
    await expect.poll(() => root.locator(`input[data-kind="${kind(destination, 'gradient-color')}"]`).evaluateAll(nodes => nodes.map(node => node.value))).toEqual(p.gradient_stops.map(row => row.color));
    await expect.poll(() => root.locator(`input[data-kind="${kind(destination, 'segment-color')}"]`).evaluateAll(nodes => nodes.map(node => node.value))).toEqual(p.segments.map(row => row.color));
  }
}

for (const source of ['src', 'dist']) {
  for (const fill_style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
    for (const palette of ['omitted', 'authored', 'empty']) for (const solid_fill of [false, true]) {
      test(`library and editor resolve ${palette} ${fill_style} palettes consistently${solid_fill ? ' with solid sampling' : ''} (${source})`, async ({ page }) => {
        const configs = structuredClone(initial);
        const definition = { fill_style, solid_fill, color: '#123456', opacity: 63,
          ...(palette === 'authored' ? {
            segments: [{ from: '0%', to: '40%', color: '#1133aa' }, { from: '40%', to: '100%', color: '#22cc66' }],
            gradient_stops: [{ pos: 0, color: '#1133aa' }, { pos: 100, color: '#22cc66' }],
          } : palette === 'empty' ? { segments: [], gradient_stops: [] } : {}),
        };
        configs.card.preset_library.paint.warm = definition;
        await mount(page, source, configs);
        const editor = editorFor(page, 'Preset');
        const root = await open(page, 'Preset');
        const library = editor.locator('.paint-preset-choice[data-preset-name="warm"]');
        const assertPreview = async opacity => {
          const swatches = await editor.evaluate(element => {
            const style = selector => {
              const node = element.shadowRoot.querySelector(selector);
              return { image: getComputedStyle(node).backgroundImage, opacity: getComputedStyle(node).opacity };
            };
            return { library: style('.paint-preset-choice[data-preset-name="warm"] .paint-preset-swatch'),
              header: style('#preset-paint-editor .paint-editor-swatch') };
          });
          expect(swatches.library).toEqual(swatches.header);
          expect(swatches.library.opacity).toBe(String(opacity / 100));
          if (palette !== 'empty') expect(swatches.library.image).not.toBe('none');
          await expect(library.locator('.paint-preset-choice-description')).toHaveText(await root.locator('.paint-editor-description').innerText());
          if (['bands', 'soft_bands', 'band_gradient'].includes(fill_style)) {
            await expect(library.locator('.paint-preset-choice-description')).toContainText(`${palette === 'omitted' ? 3 : palette === 'authored' ? 2 : 0} segments`);
            if (palette === 'omitted' && !solid_fill) for (const color of ['rgb(76, 175, 80)', 'rgb(255, 152, 0)', 'rgb(244, 67, 54)']) expect(swatches.library.image).toContain(color);
          }
        };
        await assertPreview(63);
        expect(await page.evaluate(() => window.__destinationEvents)).toEqual({ card: [], feature: [] });
        // An opacity edit takes the nonstructural sync path as well as initial render.
        await root.locator('#preset-paint-opacity').fill('41');
        await expect(library.locator('.paint-preset-swatch')).toHaveCSS('opacity', '0.41');
        await assertPreview(41);
        configs.card.preset_library.paint.warm = { ...definition, opacity: 41 };
        expect(await page.evaluate(() => window.__destinationEvents.card.at(-1)?.config)).toEqual(configs.card);
        expect(await page.evaluate(() => window.__destinationEvents.feature)).toEqual([]);
      });
    }

  }

  test(`Baseline Above and Below palettes remain isolated across Card, Entity and Feature (${source})`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Native color chooser keyboard controls are Chromium-specific.');
    const configs = structuredClone(initial);
    configs.card.bar.paint = paint(['#111111', '#222222'], 'bands');
    configs.card.baseline = {
      above: { paint: { ...paint(['#aa0000'], 'bands'), segments: [{ from: '0%', to: '100%', color: '#aa0000' }] } },
      below: { paint: { ...paint(['#0000bb'], 'bands'), segments: [{ from: '0%', to: '100%', color: '#0000bb' }] } },
    };
    configs.card.entities[0].baseline = {
      above: { paint: { ...paint(['#aa55aa'], 'bands'), segments: [{ from: '0%', to: '100%', color: '#aa55aa' }] } },
    };
    configs.feature.bar.paint = paint(['#333333', '#444444'], 'bands');
    configs.feature.baseline = {
      above: { paint: { ...paint(['#cc5500'], 'bands'), segments: [{ from: '0%', to: '100%', color: '#cc5500' }] } },
      below: { paint: { ...paint(['#0055cc'], 'bands'), segments: [{ from: '0%', to: '100%', color: '#0055cc' }] } },
    };
    await mount(page, source, configs);
    const card = editorFor(page, 'Card');
    const feature = editorFor(page, 'Feature');
    const editBaseline = async (editor, id, expectedBefore, selected) => {
      if (id.includes('entity-0-')) {
        const toggle = editor.locator('button[data-action="toggle-entity-overrides"][data-index="0"]');
        if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
        const barGroup = editor.locator('#entity-0-group-bar');
        if (await barGroup.getAttribute('aria-expanded') === 'false') await barGroup.click();
      }
      const baselineGroup = id.includes('entity-0-')
        ? editor.locator('button[data-group="baseline"][data-action="toggle-override-group"][data-index="0"]')
        : editor.locator('button[data-group="baseline"][data-action="toggle-card-group"]');
      if (await baselineGroup.count() && await baselineGroup.getAttribute('aria-expanded') === 'false') await baselineGroup.click();
      const root = editor.locator(`#${id}`);
      if (!await root.evaluate(node => node.open)) await root.locator(':scope > summary').press('Enter');
      await expect(root).toHaveJSProperty('open', true);
      const palette = root.locator('button[data-group*="baseline-"][data-group$="-segments"]');
      if (await palette.count()) {
        if (await palette.getAttribute('aria-expanded') === 'false') await palette.click();
        await expect(palette).toHaveAttribute('aria-expanded', 'true');
      }
      const input = root.locator(`input[data-kind="${id.includes('entity-0-') ? 'entity-segment-color' : 'segment-color'}"]`).first();
      await expect(input).toBeVisible();
      await expect(input).toHaveValue(expectedBefore);
      await root.evaluate(node => { window.__baselinePaintRoot = node; window.__baselinePaintInputs = [...node.querySelectorAll('input')]; });
      await nativeRed(page, input, parseInt(selected.slice(1, 3), 16));
      await expect(input).toHaveValue(selected);
      expect(await root.evaluate(node => node === window.__baselinePaintRoot
        && window.__baselinePaintInputs.every((control, index) => control === node.querySelectorAll('input')[index]))).toBe(true);
    };
    await editBaseline(card, 'baseline-above-paint-editor', '#aa0000', '#000000');
    await expect.poll(() => page.evaluate(() => window.__destinationEvents.card.at(-1)?.config.baseline.above.paint.segments[0].color)).toBe('#000000');
    let observed = await page.evaluate(() => window.__destinationEvents.card.at(-1).config);
    expect(observed.baseline.below.paint.segments[0].color).toBe('#0000bb');
    expect(observed.entities[0].baseline.above.paint.segments[0].color).toBe('#aa55aa');
    expect(observed.bar.paint.segments[0].color).toBe('#111111');
    await editBaseline(card, 'entity-0-baseline-above-paint-editor', '#aa55aa', '#0055aa');
    await expect.poll(() => page.evaluate(() => window.__destinationEvents.card.at(-1)?.config.entities[0].baseline.above.paint.segments[0].color)).toBe('#0055aa');
    observed = await page.evaluate(() => window.__destinationEvents.card.at(-1).config);
    expect(observed.baseline.above.paint.segments[0].color).toBe('#000000');
    expect(observed.baseline.below.paint.segments[0].color).toBe('#0000bb');
    await editBaseline(feature, 'baseline-above-paint-editor', '#cc5500', '#ff5500');
    await expect.poll(() => page.evaluate(() => window.__destinationEvents.feature.at(-1)?.config.baseline.above.paint.segments[0].color)).toBe('#ff5500');
    const featureConfig = await page.evaluate(() => window.__destinationEvents.feature.at(-1).config);
    expect(featureConfig.baseline.below.paint.segments[0].color).toBe('#0055cc');
    expect(featureConfig.bar.paint.segments[0].color).toBe('#333333');
  });

  for (const destination of destinations) for (const palette of ['gradient_stops', 'segments']) {
    test(`${destination} ${palette} track updates during color input without replacing controls (${source})`, async ({ page, browserName }) => {
      const configs = structuredClone(initial);
      for (const dest of destinations) paintAt(configs, dest).fill_style = palette === 'segments' ? 'bands' : 'gradient';
      await mount(page, source, configs);
      const root = await open(page, destination, palette);
      const prefix = palette === 'segments' ? 'segment' : 'gradient';
      const color = root.locator(`input[data-kind="${kind(destination, `${prefix}-color`)}"]`).first();
      await root.evaluate(root => {
        window.__livePaletteRoot = root;
        window.__livePaletteInputs = [...root.querySelectorAll('input')];
        window.__livePaletteGenerations = window.__livePaletteInputs.map(input => input.dataset.paletteGeneration);
      });
      const previews = async () => Promise.all(destinations.map(dest => rootFor(page, dest).locator('.gradient-preview-track').evaluateAll(nodes => nodes.map(node => node.getAttribute('style') + node.innerHTML))));
      const before = await previews();
      const expected = structuredClone(configs);
      const assertLivePreview = async selected => {
        const host = destination === 'Feature' ? 'feature' : 'card';
        paintAt(expected, destination)[palette][0].color = selected;
        await expect.poll(() => page.evaluate(host => window.__destinationEvents[host].at(-1)?.config, host)).toEqual(expected[host]);
        const channels = selected.slice(1).match(/../g).map(hex => parseInt(hex, 16));
        const cssColor = `rgb(${channels.join(', ')})`;
        // Assert the palette track itself while the color input still owns focus.
        // Header/library swatches are intentionally not used as preview evidence.
        if (palette === 'segments') {
          await expect(root.locator('.segment-preview-interval[data-preview-kind="segment"]').first()).toHaveCSS('background-color', cssColor);
        } else {
          await expect.poll(() => root.locator('.gradient-preview-track:not(.segment-preview-track)').evaluate(node => getComputedStyle(node).backgroundImage)).toContain(cssColor);
        }
        await expect(color).toBeFocused();
        expect(await root.evaluate(root => root === window.__livePaletteRoot
          && window.__livePaletteInputs.every((input, index) => input === root.querySelectorAll('input')[index]
            && input.dataset.paletteGeneration === window.__livePaletteGenerations[index]))).toBe(true);
        const after = await previews();
        for (const [index, dest] of destinations.entries()) if (dest !== destination) expect(after[index]).toEqual(before[index]);
      };
      if (browserName === 'chromium') {
        await nativeRed(page, color, 160, async () => {}, assertLivePreview);
        expect(await page.evaluate(() => window.__nativePaintEvents.every(event => event.trusted))).toBe(true);
      } else {
        // WebKit's headless platform chooser is unavailable; exercise delegated
        // color input while focused, without a blur/coordinate edit to repair it.
        const selected = `#a0${(await color.inputValue()).slice(3)}`;
        await color.fill(selected);
        await assertLivePreview(selected);
      }
      await hassUpdate(page);
      await assertPalettes(page, expected);
    });

    test(`${destination} ${palette} coordinate commits refresh the palette track (${source})`, async ({ page }) => {
      await mount(page, source);
      const root = await open(page, destination, palette);
      const segment = palette === 'segments';
      const track = root.locator(segment ? '.segment-preview-track' : '.gradient-preview-track:not(.segment-preview-track)');
      const before = await track.evaluate(node => node.getAttribute('style') + node.innerHTML);
      const input = root.locator(`input[data-kind="${kind(destination, segment ? 'segment-to' : 'gradient-pos')}"]`).first();
      await input.fill(segment ? '40%' : '10');
      await input.press('Tab');
      await expect.poll(() => track.evaluate(node => node.getAttribute('style') + node.innerHTML)).not.toBe(before);
      expect(await page.evaluate(() => window.__destinationEvents.card.length + window.__destinationEvents.feature.length)).toBeGreaterThan(0);
    });
  }

  for (const palette of ['gradient_stops', 'segments']) for (const updates of [false, true]) {
    test(`fresh Preset native ${palette} color emits to its parent${updates ? ' through hass updates' : ''} (${source})`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Headless WebKit does not expose its platform color chooser; Chromium exercises trusted native color events.');
      await mount(page, source);
      const root = await open(page, 'Preset', palette);
      const color = root.locator(`input[data-kind="${palette === 'segments' ? 'segment' : 'gradient'}-color"]`).first();
      const selected = await nativeRed(page, color, 160, updates ? async () => {
        // Public HA updates while the chooser owns focus must preserve its input.
        for (let i = 0; i < 4; i += 1) await hassUpdate(page);
      } : undefined);
      const expected = structuredClone(initial);
      paintAt(expected, 'Preset')[palette][0].color = selected;
      await expect.poll(() => page.evaluate(() => window.__destinationEvents.card.at(-1)?.config)).toEqual(expected.card);
      await expect.poll(() => page.evaluate(() => window.__nativePaintEvents)).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'input', trusted: true, value: selected, destination: 'preset-paint-editor' }),
        expect.objectContaining({ type: 'change', trusted: true, value: selected, destination: 'preset-paint-editor' }),
      ]));
      const native = await page.evaluate(() => window.__nativePaintEvents);
      expect(native.every(event => event.trusted)).toBe(true);
      await hassUpdate(page);
      await assertPalettes(page, expected);
      expect(await page.evaluate(() => window.__destinationEvents.feature)).toEqual([]);
      expect(await page.evaluate(() => window.__destinationEvents.card.every(event => event.bubbles && event.composed))).toBe(true);
    });
  }

  test(`fresh destinations retain independent rows, drafts, hints and previews through hass updates (${source})`, async ({ page }) => {
    await mount(page, source);
    await assertPalettes(page, initial);
    for (const [index, destination] of destinations.entries()) {
      const root = await open(page, destination);
      await root.locator(`input[data-kind="${kind(destination, 'gradient-draft-pos')}"]`).fill(String(25 + index * 10));
      await root.locator(`input[data-kind="${kind(destination, 'gradient-draft-pos')}"]`).press('Tab');
      await open(page, destination, 'segments');
      await root.locator(`input[data-kind="${kind(destination, 'segment-draft-from')}"]`).fill(`${110 + index * 10}%`);
      await root.locator(`input[data-kind="${kind(destination, 'segment-draft-to')}"]`).fill('unfinished');
      await root.locator(`input[data-kind="${kind(destination, 'segment-draft-to')}"]`).press('Tab');
    }
    const snapshot = async () => Promise.all(destinations.map(destination => rootFor(page, destination).evaluate(root => ({
      drafts: [...root.querySelectorAll('.gradient-stop-draft input, .segment-draft input')].map(node => [node.value, node.dataset.paletteGeneration]),
      hints: [...root.querySelectorAll('[id$="draft-hint"]')].map(node => node.textContent),
      previews: [...root.querySelectorAll('.gradient-preview-track')].map(node => node.innerHTML + node.getAttribute('style')),
    }))));
    const before = await snapshot();
    for (let i = 0; i < 4; i += 1) await hassUpdate(page);
    expect(await snapshot()).toEqual(before);
    await assertPalettes(page, initial);
    expect(await page.evaluate(() => window.__destinationEvents)).toEqual({ card: [], feature: [] });
  });

  for (const palette of ['gradient_stops', 'segments']) {
    test(`edits and structural ${palette} operations stay inside each destination (${source})`, async ({ page, browserName }) => {
      await mount(page, source);
      const expected = structuredClone(initial);
      for (const [index, destination] of [...destinations, 'Card', 'Preset'].entries()) {
        const root = await open(page, destination, palette);
        const prefix = palette === 'segments' ? 'segment' : 'gradient';
        const input = root.locator(`input[data-kind="${kind(destination, `${prefix}-color`)}"]`).first();
        const next = browserName === 'chromium' ? await nativeRed(page, input, 160 + index)
          : `#${(160 + index).toString(16)}${(await input.inputValue()).slice(3)}`;
        // WebKit covers delegated input/change in addition to real boundary typing
        // and clicks below; its headless platform picker is unavailable.
        if (browserName !== 'chromium') await input.fill(next);
        paintAt(expected, destination)[palette][0].color = next;
        const host = destination === 'Feature' ? 'feature' : 'card';
        await expect.poll(() => page.evaluate(host => window.__destinationEvents[host].at(-1)?.config, host)).toEqual(expected[host]);
        await hassUpdate(page);
        await assertPalettes(page, expected);
      }

      for (const destination of destinations) {
        let root = await open(page, destination, palette);
        const prefix = palette === 'segments' ? 'segment' : 'gradient';
        const boundary = palette === 'segments' ? 'to' : 'pos';
        const boundaryInput = root.locator(`input[data-kind="${kind(destination, `${prefix}-${boundary}`)}"]`).first();
        await boundaryInput.fill(palette === 'segments' ? '40%' : '10');
        await boundaryInput.press('Tab');
        paintAt(expected, destination)[palette][0][boundary] = palette === 'segments' ? '40%' : 10;
        const host = destination === 'Feature' ? 'feature' : 'card';
        await expect.poll(() => page.evaluate(host => window.__destinationEvents[host].at(-1)?.config, host)).toEqual(expected[host]);
        await assertPalettes(page, expected);
        root = await open(page, destination, palette);
        const route = suffix => `input[data-kind="${kind(destination, `${prefix}-draft-${suffix}`)}"]`;
        if (palette === 'segments') {
          await root.locator(route('from')).fill('110%');
          await root.locator(route('to')).fill('120%');
        } else await root.locator(route('pos')).fill('50');
        const draftColor = await root.locator(route('color')).inputValue();
        const action = verb => `${verb}-${destination === 'Entity' ? 'entity-' : ''}${prefix}${prefix === 'gradient' ? '-stop' : ''}`;
        await root.locator(`[data-action="${action('add')}"]`).click();
        const rows = paintAt(expected, destination)[palette];
        rows.push(palette === 'segments' ? { from: '110%', to: '120%', color: draftColor } : { pos: 50, color: draftColor });
        if (palette === 'gradient_stops' && destination !== 'Feature') rows.sort((a, b) => a.pos - b.pos);
        await expect.poll(() => page.evaluate(host => window.__destinationEvents[host].at(-1)?.config, host)).toEqual(expected[host]);
        await assertPalettes(page, expected);
        await expect(root.locator(route(palette === 'segments' ? 'from' : 'pos'))).toBeFocused();
        root = await open(page, destination, palette);
        await root.locator(`[data-action="${action('remove')}"]`).first().click();
        rows.shift();
        await expect.poll(() => page.evaluate(host => window.__destinationEvents[host].at(-1)?.config, host)).toEqual(expected[host]);
        await hassUpdate(page);
        await assertPalettes(page, expected);
      }
    });

    test(`stale ${palette} events cannot mutate any destination (${source})`, async ({ page }) => {
      await mount(page, source);
      for (const destination of destinations) {
        const root = await open(page, destination, palette);
        const selector = `input[data-kind="${kind(destination, `${palette === 'segments' ? 'segment' : 'gradient'}-color`)}"]`;
        await root.locator(selector).first().evaluate(node => { window.__oldPaintControl = node; });
        await editorFor(page, destination).evaluate((editor, { destination, palette }) => {
          const config = structuredClone(editor._draftConfig ?? editor._config);
          const paint = destination === 'Preset' ? config.preset_library.paint.warm
            : destination === 'Entity' ? config.entities[0].bar.paint : config.bar.paint;
          paint[palette] = paint[palette].slice(1);
          editor.setConfig(config);
        }, { destination, palette });
        // Explicit adversarial events: an old detached control and a connected
        // control carrying that old generation. Neither may pass stale guards.
        await root.evaluate((root, selector) => {
          const old = window.__oldPaintControl;
          old.value = '#ff00ff';
          old.dispatchEvent(new Event('change', { bubbles: true }));
          const current = root.querySelector(selector);
          const stale = current.cloneNode(true);
          stale.dataset.paletteGeneration = old.dataset.paletteGeneration;
          stale.value = '#ff00ff';
          current.parentElement.append(stale);
          stale.dispatchEvent(new Event('input', { bubbles: true }));
          stale.dispatchEvent(new Event('change', { bubbles: true }));
          stale.remove();
          // Even a current generation cannot authorize a control outside its
          // destination root (including a node inside the Preset manager).
          const foreign = current.cloneNode(true);
          foreign.value = '#ff00ff';
          root.parentElement.append(foreign);
          foreign.dispatchEvent(new Event('input', { bubbles: true }));
          foreign.dispatchEvent(new Event('change', { bubbles: true }));
          foreign.remove();
        }, selector);
      }
      expect(await page.evaluate(() => window.__destinationEvents)).toEqual({ card: [], feature: [] });
    });
  }

  test(`all swatches agree across five styles, full authored extents, direction, sampling and opacity (${source})`, async ({ page }) => {
    for (const fill_style of ['solid', 'gradient', 'bands', 'soft_bands', 'band_gradient']) {
      for (const solid_fill of [false, true]) for (const direction of ['normal', 'reverse']) {
        const configs = structuredClone(initial);
        const p = { ...paint(['#000000', '#ffffff'], fill_style), solid_fill, opacity: solid_fill ? 40 : 72,
          segments: [{ from: 5, to: 10, color: '#ff0000' }, { from: 10, to: 40, color: '#0000ff' }] };
        configs.card.preset_library.paint.warm = structuredClone(p);
        configs.card.bar.paint = structuredClone(p);
        configs.card.entities[0].bar.paint = structuredClone(p);
        configs.feature.bar.paint = structuredClone(p);
        configs.card.scale = { min: { fixed: 15 }, max: { fixed: 25 }, direction };
        configs.feature.scale = structuredClone(configs.card.scale);
        await mount(page, source, configs);
        const swatches = await page.evaluate(async ({ p, direction }) => {
          const { normalizeBarConfig } = await import('/src/config/normalize.js');
          const { compilePaint } = await import('/src/view-model/paint-compiler.js');
          const normalized = normalizeBarConfig({ bar: { paint: p } }, null, { isCardScope: true }).paint;
          const complete = !p.solid_fill && ['bands', 'soft_bands', 'band_gradient'].includes(p.fill_style);
          const expected = (minValue, maxValue, scaleDirection) => {
            const probe = document.createElement('span');
            probe.style.backgroundImage = compilePaint(normalized, {
              minValue: complete ? 5 : minValue, maxValue: complete ? 40 : maxValue, scaleDirection, samplePercent: 50,
            }).gradient;
            document.body.append(probe);
            const image = getComputedStyle(probe).backgroundImage;
            probe.remove();
            return image;
          };
          const card = document.querySelector('sensor-bar-card-plus-editor');
          const feature = document.querySelector('sensor-bar-card-plus-feature-editor');
          const style = node => ({ image: getComputedStyle(node).backgroundImage, opacity: getComputedStyle(node).opacity });
          return {
            list: style(card.shadowRoot.querySelector('.paint-preset-swatch')),
            preset: style(card.shadowRoot.querySelector('#preset-paint-editor .paint-editor-swatch')),
            card: style(card.shadowRoot.querySelector('#card-paint-editor .paint-editor-swatch')),
            entity: style(card.shadowRoot.querySelector('#entity-0-paint-editor .paint-editor-swatch')),
            feature: style(feature.shadowRoot.querySelector('#card-paint-editor .paint-editor-swatch')),
            expected: { preset: expected(0, 100, 'normal'), card: expected(15, 25, direction) },
          };
        }, { p, direction });
        const { expected, ...actual } = swatches;
        expect(swatches.list).toEqual(swatches.preset);
        expect(swatches.card).toEqual(swatches.entity);
        expect(swatches.card).toEqual(swatches.feature);
        expect(swatches.card.image).toBe(expected.card);
        expect(swatches.preset.image).toBe(expected.preset);
        for (const swatch of Object.values(actual)) expect(swatch.opacity).toBe(String(p.opacity / 100));
        if (!solid_fill && ['bands', 'soft_bands', 'band_gradient'].includes(fill_style)) {
          for (const swatch of Object.values(actual)) {
            expect(swatch.image).toContain('rgb(255, 0, 0)');
            expect(swatch.image).toContain('rgb(0, 0, 255)');
          }
        }
        if (solid_fill && fill_style === 'gradient') for (const swatch of Object.values(actual)) expect(swatch.image).toContain('rgb(128, 128, 128)');
        expect(await page.evaluate(() => window.__destinationEvents)).toEqual({ card: [], feature: [] });
      }
    }
  });
}
