const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { getBuildIdentity } = require('../../tools/build-dist.cjs');

const editorPath = path.resolve(__dirname, '../../dist/sensor-bar-card-plus-editor.js');
const corePath = path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js');
const editorBytes = fs.readFileSync(editorPath);
const editorText = editorBytes.toString();
const digest = createHash('sha256').update(editorBytes).digest('hex');
const tags = ['sensor-bar-card-plus-editor', 'sensor-bar-card-plus-feature-editor'];
const runtimeTags = ['sensor-bar-card-plus', 'sensor-bar-card-plus-feature'];

async function emptyHarness(page) {
  await page.route('**/tests/visual/fixtures/harness.html*', route => route.fulfill({
    contentType: 'text/html', body: fs.readFileSync(path.resolve(__dirname, 'fixtures/harness.html'), 'utf8')
      .replace(/<script type="module"[^>]*><\/script>/, ''),
  }));
  await page.goto('/tests/visual/fixtures/harness.html');
}

async function boot(page, source = 'dist', coreURL = `/${source}/sensor-bar-card-plus.js`) {
  const requests = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.endsWith('/sensor-bar-card-plus-editor.js')) requests.push(request.url());
  });
  await emptyHarness(page);
  await page.evaluate(url => import(url), coreURL);
  return requests;
}

async function state(page) {
  return page.evaluate(tags => tags.map(tag => !!customElements.get(tag)), tags);
}

async function open(page, host = 'card') {
  return page.evaluate(async host => {
    try {
      const runtime = customElements.get(host === 'card' ? 'sensor-bar-card-plus' : 'sensor-bar-card-plus-feature');
      const editor = await runtime.getConfigElement();
      return { tag: editor.localName };
    } catch (error) { return { error: error.message }; }
  }, host);
}

async function render(page) {
  return page.evaluate(async () => {
    const hass = { states: { 'sensor.power': { state: '42', attributes: { unit_of_measurement: 'W' } } } };
    const card = document.createElement('sensor-bar-card-plus');
    card.setConfig({ entities: ['sensor.power'] }); card.hass = hass;
    const feature = document.createElement('sensor-bar-card-plus-feature');
    feature.setConfig({ type: 'custom:sensor-bar-card-plus-feature' });
    feature.context = { entity_id: 'sensor.power' }; feature.hass = hass;
    document.querySelector('#mount').replaceChildren(card, feature);
    await feature.updateComplete;
    return [card.shadowRoot.textContent.includes('42'), feature._row.numericValue];
  });
}

for (const source of ['src', 'dist']) {
  test(`${source}: runtime rendering does not request or register editors; factories share a companion and return fresh instances`, async ({ page }) => {
    const requests = await boot(page, source);
    expect(await state(page)).toEqual([false, false]);
    expect(await render(page)).toEqual([true, 42]);
    expect(requests).toHaveLength(0);
    const results = await page.evaluate(async runtimeTags => {
      const [card, feature] = runtimeTags.map(tag => customElements.get(tag));
      const editors = await Promise.all(Array.from({ length: 20 }, (_, index) => (index % 2 ? feature : card).getConfigElement()));
      const extra = await card.getConfigElement();
      return { tags: editors.map(editor => editor.localName), unique: new Set([...editors, extra]).size };
    }, runtimeTags);
    expect(requests).toHaveLength(1);
    expect(results.unique).toBe(21);
    expect(results.tags).toEqual(Array.from({ length: 20 }, (_, index) => tags[index % 2]));
    expect(await state(page)).toEqual([true, true]);
    const url = new URL(requests[0]);
    expect(url.pathname).toBe(`/${source}/sensor-bar-card-plus-editor.js`);
    expect(url.searchParams.get('sbcp_build')).toBe(source === 'dist' ? digest : `source:${getBuildIdentity()}`);
  });
}

test('companion evaluation exports the pair without registration or discovery side effects', async ({ page }) => {
  await emptyHarness(page);
  const result = await page.evaluate(async () => {
    const before = JSON.stringify([window.customCards, window.customCardFeatures]);
    const companion = await import('/dist/sensor-bar-card-plus-editor.js');
    return { exports: Object.keys(companion).sort(), identity: companion.buildIdentity,
      untouched: before === JSON.stringify([window.customCards, window.customCardFeatures]),
      tags: ['sensor-bar-card-plus', 'sensor-bar-card-plus-feature', 'sensor-bar-card-plus-editor', 'sensor-bar-card-plus-feature-editor'].map(tag => !!customElements.get(tag)) };
  });
  expect(result).toEqual({ exports: ['SensorBarCardPlusEditor', 'SensorBarCardPlusFeatureEditor', 'buildIdentity'],
    identity: getBuildIdentity(), untouched: true, tags: [false, false, false, false] });
});

test('core URL, including a nested deployment path and core cache query, determines the companion path', async ({ page }) => {
  await page.route('**/local/community/sbcp/sensor-bar-card-plus.js?*', route => route.fulfill({ path: corePath, contentType: 'text/javascript' }));
  await page.route('**/local/community/sbcp/sensor-bar-card-plus-editor.js?*', route => route.fulfill({ path: editorPath, contentType: 'text/javascript' }));
  const requests = await boot(page, 'dist', '/local/community/sbcp/sensor-bar-card-plus.js?v=core-cache');
  expect(await open(page)).toEqual({ tag: tags[0] });
  expect(requests).toEqual([`http://127.0.0.1:4173/local/community/sbcp/sensor-bar-card-plus-editor.js?sbcp_build=${digest}`]);
});

test('same-version mismatched identity fails closed on both explicit attempts', async ({ page }) => {
  await page.route('**/dist/sensor-bar-card-plus-editor.js?*', route => route.fulfill({
    contentType: 'text/javascript', body: editorText.replace(getBuildIdentity(), '0'.repeat(64)),
  }));
  const requests = await boot(page);
  for (const host of ['card', 'feature', 'card']) {
    expect((await open(page, host)).error).toBe('Sensor Bar Card Plus was updated. Refresh Home Assistant to load the matching visual editor.');
    expect(await state(page)).toEqual([false, false]);
  }
  expect(requests).toHaveLength(2);
  expect(await render(page)).toEqual([true, 42]);
});

for (const index of [0, 1]) {
  for (const owner of ['foreign', 'unproven matching companion']) {
    test(`${owner} ${tags[index]} rejects the whole pair before either new registration`, async ({ page }) => {
      await boot(page);
      await page.evaluate(async ({ tag, index, owner }) => {
        let ctor = class ForeignEditor extends HTMLElement {};
        if (owner !== 'foreign') {
          const companion = await import('/dist/sensor-bar-card-plus-editor.js');
          ctor = index ? companion.SensorBarCardPlusFeatureEditor : companion.SensorBarCardPlusEditor;
        }
        customElements.define(tag, ctor);
      }, { tag: tags[index], index, owner });
      expect((await open(page)).error).toContain('resources conflict');
      expect(await state(page)).toEqual([index === 0, index === 1]);
      expect(await render(page)).toEqual([true, 42]);
    });
  }
}

test('a conflicting feature editor arriving during the import cannot leave a partially registered card editor', async ({ page }) => {
  let release;
  const held = new Promise(resolve => { release = resolve; });
  await page.route('**/dist/sensor-bar-card-plus-editor.js?*', async route => {
    await held; await route.fulfill({ path: editorPath, contentType: 'text/javascript' });
  });
  const requests = await boot(page);
  await page.evaluate(() => {
    window.editorResult = customElements.get('sensor-bar-card-plus').getConfigElement().then(() => 'loaded', error => error.message);
  });
  await expect.poll(() => requests.length).toBe(1);
  await page.evaluate(() => customElements.define('sensor-bar-card-plus-feature-editor', class extends HTMLElement {}));
  release();
  expect(await page.evaluate(() => window.editorResult)).toContain('resources conflict');
  expect(await state(page)).toEqual([false, true]);
});

for (const failure of ['missing', 'invalid module']) {
  test(`${failure}: failed pending load resets, a shared explicit retry uses one new cache identity and succeeds`, async ({ page }) => {
    let requestsServed = 0;
    await page.route('**/dist/sensor-bar-card-plus-editor.js?*', route => {
      requestsServed++;
      return requestsServed === 1
        ? route.fulfill({ status: failure === 'missing' ? 404 : 200, contentType: 'text/javascript', body: 'invalid javascript !!!' })
        : route.fulfill({ path: editorPath, contentType: 'text/javascript' });
    });
    const requests = await boot(page);
    expect((await open(page)).error).toContain('Check connectivity');
    expect(await state(page)).toEqual([false, false]);
    expect(await render(page)).toEqual([true, 42]);
    const results = await Promise.all([open(page), open(page, 'feature')]);
    expect(results).toEqual([{ tag: tags[0] }, { tag: tags[1] }]);
    expect(requests).toHaveLength(2);
    expect(new URL(requests[1]).searchParams.get('sbcp_retry')).toBe('1');
    expect(new URL(requests[1]).searchParams.get('sbcp_build')).toBe(digest);
    await open(page); expect(requests).toHaveLength(2);
  });
}

test('persistent missing companion stops after two requests and leaves both runtimes working', async ({ page }) => {
  await page.route('**/dist/sensor-bar-card-plus-editor.js?*', route => route.fulfill({ status: 404, body: 'Not found' }));
  const requests = await boot(page);
  for (let attempt = 0; attempt < 6; attempt++) expect((await open(page, attempt % 2 ? 'feature' : 'card')).error).toContain('Check connectivity');
  expect(requests).toHaveLength(2);
  expect(await state(page)).toEqual([false, false]);
  expect(await render(page)).toEqual([true, 42]);
});

test('duplicate core modules preserve winning constructors and discovery and use the original loader', async ({ page }) => {
  const requests = await boot(page);
  expect(await page.evaluate(async runtimeTags => {
    const before = runtimeTags.map(tag => customElements.get(tag));
    await import('/dist/sensor-bar-card-plus.js?duplicate=1');
    return { same: runtimeTags.every((tag, index) => customElements.get(tag) === before[index]),
      cards: window.customCards.length, features: window.customCardFeatures.length };
  }, runtimeTags)).toEqual({ same: true, cards: 1, features: 1 });
  expect(requests).toHaveLength(0);
  expect(await open(page, 'feature')).toEqual({ tag: tags[1] });
  expect(requests).toHaveLength(1);
});

for (const source of ['src', 'dist']) {
  test(`${source}: rejects the other mode's companion provenance`, async ({ page }) => {
    const sourceModule = `export { SensorBarCardPlusEditor } from '/src/editor/SensorBarCardPlusEditor.js';\nexport { SensorBarCardPlusFeatureEditor } from '/src/feature/SensorBarCardPlusFeatureEditor.js';\nexport const buildIdentity = ${JSON.stringify(`source:${getBuildIdentity()}`)};`;
    await page.route(`**/${source}/sensor-bar-card-plus-editor.js?*`, route => route.fulfill({
      contentType: 'text/javascript', body: source === 'src' ? editorText : sourceModule,
    }));
    await boot(page, source);
    expect((await open(page)).error).toContain('was updated');
    expect(await state(page)).toEqual([false, false]);
  });

  test(`${source} first: loading both resource modes preserves the winning runtime and editor owner`, async ({ page }) => {
    const requests = await boot(page, source);
    await open(page);
    const result = await page.evaluate(async ({ runtimeTags, tags, other }) => {
      const before = [...runtimeTags, ...tags].map(tag => customElements.get(tag));
      await import(`/${other}/sensor-bar-card-plus.js`);
      const editor = await customElements.get(runtimeTags[1]).getConfigElement();
      return { same: [...runtimeTags, ...tags].every((tag, i) => customElements.get(tag) === before[i]), tag: editor.localName,
        cards: window.customCards.length, features: window.customCardFeatures.length };
    }, { runtimeTags, tags, other: source === 'src' ? 'dist' : 'src' });
    expect(result).toEqual({ same: true, tag: tags[1], cards: 1, features: 1 });
    expect(requests).toHaveLength(1);
  });
}
