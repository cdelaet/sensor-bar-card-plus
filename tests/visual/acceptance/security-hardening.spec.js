const { test, expect } = require('../visual-test.cjs');
const d = require('./editor-driver.cjs');

test.setTimeout(60_000);

// Inert structural probes. They are never executed; they only attempt to escape
// an attribute, create a new tag, add a CSS declaration, or load a resource.
const ATTRIBUTE = 'red" data-injected="true';
const DECLARATION = 'red;position:fixed;inset:0;background-image:url(about:invalid)';
const MARKUP = 'red"><img data-injected="true" src="about:invalid">';
const WIDTH = '100px" data-injected="true';

const HOSTILE_COLOR = DECLARATION;
const HOSTILE_MARKER = MARKUP;

function states() {
  return {
    'sensor.power': {
      state: '50',
      attributes: { friendly_name: 'Power', unit_of_measurement: 'W' },
    },
  };
}

function cardConfig(extra = {}) {
  return {
    entities: [{
      entity: 'sensor.power',
      bar: {
        paint: {
          color: HOSTILE_COLOR,
          fill_style: 'bands',
          segments: [
            { from: 0, to: 50, color: HOSTILE_COLOR },
            { from: 50, to: 100, color: HOSTILE_MARKER },
          ],
          gradient_stops: [
            { pos: 0, color: HOSTILE_COLOR },
            { pos: 100, color: '#ffffff' },
          ],
        },
        needle: { show: true, color: HOSTILE_MARKER },
      },
      baseline: {
        enabled: true,
        at: 20,
        above: { color: HOSTILE_COLOR },
        below: { color: HOSTILE_MARKER },
      },
      target: {
        at: 60,
        color: HOSTILE_MARKER,
        when_exceeded: { fill_color: HOSTILE_COLOR },
      },
      peak: { enabled: true, color: HOSTILE_MARKER },
      floor: { enabled: true, color: HOSTILE_COLOR },
      markers: [{ at: 70, color: HOSTILE_MARKER }],
      layout: { label: { position: 'left', width: WIDTH } },
    }],
    above_target_color: HOSTILE_COLOR,
    ...extra,
  };
}

function featureFromCard(config) {
  const { entities, ...physical } = config;
  const row = entities?.[0] ?? {};
  return { type: 'custom:sensor-bar-card-plus-feature', ...physical, ...row };
}

function legacyConfig() {
  return {
    entity: 'sensor.power',
    color_mode: 'severity',
    color: HOSTILE_COLOR,
    severity: [
      { from: 0, to: 50, color: HOSTILE_COLOR },
      { from: 50, to: 100, color: HOSTILE_MARKER },
    ],
    gradient_stops: [
      { pos: 0, color: HOSTILE_COLOR },
      { pos: 100, color: '#ffffff' },
    ],
    target: 60,
    target_color: HOSTILE_MARKER,
    above_target_color: HOSTILE_COLOR,
    show_peak: true,
    peak_color: HOSTILE_MARKER,
    label_position: 'left',
    label_width: WIDTH,
  };
}

async function mountCard(page, source, config, hass = { states: states() }) {
  await page.goto(`/tests/visual/fixtures/harness.html${source === 'dist' ? '?source=dist' : ''}`);
  await page.waitForFunction(() => customElements.get('sensor-bar-card-plus'));
  await page.evaluate(async ({ config, hass }) => {
    await window.__sbcpRenderCard({ config, hass });
  }, { config, hass });
}

async function mountFeature(page, source, config, hass = { states: states() }) {
  await page.goto(`/tests/visual/fixtures/harness.html${source === 'dist' ? '?source=dist' : ''}`);
  await page.waitForFunction(() => customElements.get('sensor-bar-card-plus-feature'));
  await page.evaluate(async ({ config, hass }) => {
    await window.__sbcpRenderFeature({ config, hass });
  }, { config, hass });
}

async function expectInert(page, host) {
  const audit = await page.evaluate((host) => {
    const root = host === 'feature'
      ? document.querySelector('sensor-bar-card-plus-feature')?.shadowRoot
      : document.querySelector('sensor-bar-card-plus')?.shadowRoot;
    return root ? (() => {
      const elements = [root, ...root.querySelectorAll('*')];
      return {
        injectedElements: root.querySelectorAll('[data-injected]').length,
        forbiddenTags: root.querySelectorAll('img,script,iframe,object,embed,link').length,
        eventAttributes: elements.flatMap(element =>
          [...(element.attributes ?? [])].filter(attribute => attribute.name.startsWith('on')).map(attribute => attribute.name)),
        payloadStyles: elements
          .map(element => element.getAttribute?.('style') ?? '')
          .filter(style => /data-injected|about:invalid|--injected|position:\s*fixed/i.test(style)),
      };
    })() : null;
  }, host);
  expect(audit, `${host} shadow root must exist`).not.toBeNull();
  expect(audit.injectedElements, `${host} injected elements`).toBe(0);
  expect(audit.forbiddenTags, `${host} injected tags`).toBe(0);
  expect(audit.eventAttributes, `${host} injected event attributes`).toEqual([]);
  expect(audit.payloadStyles, `${host} injected CSS declarations`).toEqual([]);
}

async function fillEditorColorAndAssertNotCommitted(page, editor, control, value) {
  const before = await d.saved(page);
  await control.fill(value);
  await control.blur();
  await editor.evaluate(el => el.updateComplete);
  await page.waitForTimeout(50);
  expect(await d.saved(page)).toEqual(before);
}

for (const source of ['src', 'dist']) {
  for (const host of ['card', 'feature']) {
    test(`${host} hostile configuration is inert on initial render (${source})`, async ({ page }) => {
      if (host === 'card') await mountCard(page, source, cardConfig());
      else await mountFeature(page, source, featureFromCard(cardConfig()));
      await expectInert(page, host);
    });

    test(`${host} hostile legacy aliases are inert (${source})`, async ({ page }) => {
      if (host === 'card') await mountCard(page, source, legacyConfig());
      else await mountFeature(page, source, { type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.power', ...legacyConfig() });
      await expectInert(page, host);
    });

    test(`${host} incremental hostile configuration is inert (${source})`, async ({ page }) => {
      const safe = host === 'card'
        ? { entities: [{ entity: 'sensor.power', bar: { color: 'var(--accent, #4a9eff)' } }] }
        : { type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.power', bar: { color: 'var(--accent, #4a9eff)' } };
      if (host === 'card') await mountCard(page, source, safe);
      else await mountFeature(page, source, safe);
      await expectInert(page, host);

      await page.evaluate(async ({ host, config }) => {
        if (host === 'card') {
          const card = document.querySelector('sensor-bar-card-plus');
          card.setConfig(config);
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        } else {
          const feature = document.querySelector('sensor-bar-card-plus-feature');
          feature.setConfig(config);
          await feature.updateComplete;
        }
      }, { host, config: host === 'card' ? cardConfig() : featureFromCard(cardConfig()) });
      await expectInert(page, host);
    });
  }
}

for (const source of ['src', 'dist']) {
  for (const host of ['card', 'feature']) {
    test(`${host} safe theme, functional and gradient colors render (${source})`, async ({ page }) => {
      const safe = {
        entities: [{
          entity: 'sensor.power',
          bar: {
            color: 'var(--accent, #4a9eff)',
            needle: { show: true, color: 'color-mix(in srgb, var(--accent, #4a9eff) 70%, #ffffff)' },
            paint: {
              fill_style: 'bands',
              segments: [{ from: 0, to: 100, color: 'color-mix(in srgb, #4a9eff 50%, #ffffff)' }],
            },
          },
          target: { at: 60, color: 'rgb(255 0 0 / 50%)' },
          markers: [{ at: 70, color: 'var(--marker-color, #ff8800)' }],
        }],
      };
      if (host === 'card') await mountCard(page, source, safe);
      else await mountFeature(page, source, featureFromCard(safe));

      const rendered = await page.evaluate((host) => {
        const root = host === 'feature'
          ? document.querySelector('sensor-bar-card-plus-feature')?.shadowRoot
          : document.querySelector('sensor-bar-card-plus')?.shadowRoot;
        return {
          layer: root?.querySelector('.bar-paint-layer')?.getAttribute('style') ?? '',
          marker: root?.querySelector('.target-marker')?.getAttribute('style') ?? '',
          needle: root?.querySelector('.needle-marker')?.getAttribute('style') ?? '',
        };
      }, host);
      expect(rendered.layer).toContain('linear-gradient');
      expect(rendered.layer).toContain('color-mix');
      expect(rendered.marker).toContain('--marker-color:rgb(255 0 0 / 50%)');
      expect(rendered.needle).toContain('--needle-color:color-mix');
    });
  }
}

for (const source of ['src', 'dist']) {
  for (const host of ['standalone', 'feature']) {
    test(`${host} editor rejects unsafe bar paint colors (${source})`, async ({ page }) => {
      const editor = await d.mount(page, host, d.seed(host), source === 'dist' ? { source: 'dist' } : {});
      const paint = editor.locator('#card-paint-editor');
      if (!await paint.evaluate(node => node.open)) await paint.locator('summary').click();
      const control = paint.locator('#bar-color-text-fallback');
      await expect(control).toHaveCount(1);
      await fillEditorColorAndAssertNotCommitted(page, editor, control, DECLARATION);
      await expect(control).toHaveValue(DECLARATION);
    });
  }
}

for (const source of ['src', 'dist']) {
  test(`card editor rejects unsafe generic marker colors (${source})`, async ({ page }) => {
    const editor = await d.mount(page, 'standalone', d.seed('standalone'), source === 'dist' ? { source: 'dist' } : {});
    await d.openDisclosure(editor.locator('#card-group-generic-markers'));
    const row = editor.locator('.card-subgroup[data-group="generic-markers"] .generic-marker-item').first();
    await d.openDisclosure(row.locator('.generic-marker-toggle'));
    const control = row.locator('[data-kind="generic-marker-color-text-fallback"]');
    await expect(control).toHaveCount(1);
    await fillEditorColorAndAssertNotCommitted(page, editor, control, ATTRIBUTE);
    await expect(control).toHaveValue(ATTRIBUTE);
  });
}

for (const source of ['src', 'dist']) {
  for (const host of ['card', 'feature']) {
    test(`${host} hostile dashboard paint preset is inert (${source})`, async ({ page }) => {
      const dashboard = {
        views: [{
          cards: [{
            type: 'custom:sensor-bar-card-plus',
            preset_library: { paint: { hostile: { color: HOSTILE_COLOR } } },
          }],
        }],
      };
      await page.goto(`/tests/visual/fixtures/harness.html${source === 'dist' ? '?source=dist' : ''}`);
      await page.waitForFunction(() => customElements.get('sensor-bar-card-plus'));
      await page.evaluate((dashboard) => {
        const listeners = new Map();
        window.__sbcpPresetLoaded = false;
        window.__hass = {
          states: {
            'sensor.power': { state: '50', attributes: { friendly_name: 'Power', unit_of_measurement: 'W' } },
          },
          config: { time_zone: 'UTC' },
          locale: { language: 'en' },
          connection: {
            connected: true,
            addEventListener: (name, callback) => listeners.set(name, callback),
            removeEventListener: name => listeners.delete(name),
            subscribeEvents: async () => () => {},
            sendMessagePromise: async () => {
              window.__sbcpPresetLoaded = true;
              return dashboard;
            },
          },
        };
      }, dashboard);
      await page.evaluate(async ({ host }) => {
        if (host === 'card') {
          await window.__sbcpRenderCard({
            config: { entities: [{ entity: 'sensor.power', bar: { paint: { preset: 'hostile' } } }] },
            hass: window.__hass,
          });
        } else {
          await window.__sbcpRenderFeature({
            config: { type: 'custom:sensor-bar-card-plus-feature', entity: 'sensor.power', bar: { paint: { preset: 'hostile' } } },
            hass: window.__hass,
          });
        }
      }, { host });
      await page.waitForFunction(() => window.__sbcpPresetLoaded === true);
      await page.waitForTimeout(100);
      await expectInert(page, host);
    });
  }
}
