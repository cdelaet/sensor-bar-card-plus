const { test, expect } = require('./visual-test.cjs');
const { testLocale } = require('../support/test-locale.cjs');

test('browser tests use the canonical test locale', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit exposes nl-NL for the configured nl-BE locale');
  await page.goto('/tests/visual/fixtures/harness.html');
  const locale = await page.evaluate(() => ({
    language: navigator.language,
    number: (1234567.5).toLocaleString(),
  }));

  expect(locale).toEqual({ language: testLocale, number: '1.234.567,5' });
});

for (const source of ['src', 'dist']) test(`Card and Feature follow HA number format changes (${source})`, async ({ page }) => {
  await page.goto(`/tests/visual/fixtures/harness.html${source === 'dist' ? '?source=dist' : ''}`);
  const hass = {
    locale: { language: 'en-US', number_format: 'comma_decimal' },
    states: { 'sensor.locale': { state: '1234567.89', attributes: { friendly_name: 'Locale value', unit_of_measurement: 'W' } } },
  };
  await page.evaluate(async ({ hass }) => {
    const element = document.createElement('sensor-bar-card-plus');
    element.setConfig({ entities: [{ entity: 'sensor.locale' }] });
    element.hass = hass;
    document.querySelector('#mount').append(element);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, { hass });
  const value = page.locator('sensor-bar-card-plus .value-right-number').first();
  await expect(value).toHaveText('1,234,567.89');

  const updated = await page.evaluate(async () => {
    const card = document.querySelector('sensor-bar-card-plus');
    card.hass = { ...card._hass, locale: { language: 'en-US', number_format: 'decimal_comma' } };
    const feature = document.createElement('sensor-bar-card-plus-feature');
    feature.setConfig({ type: 'custom:sensor-bar-card-plus-feature' });
    feature.hass = card._hass;
    feature.context = { entity_id: 'sensor.locale' };
    document.querySelector('#mount').append(feature);
    await feature.updateComplete;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const collectValues = root => [...root.querySelectorAll('*')].flatMap(node => [
      ...(node.classList?.contains('value-right-number') ? [node.textContent] : []),
      ...(node.shadowRoot ? collectValues(node.shadowRoot) : []),
    ]);
    return {
      cardValues: collectValues(card.shadowRoot),
      featureLabel: feature.shadowRoot.querySelector('.surface')?.getAttribute('aria-label'),
    };
  });
  expect(updated.cardValues.length).toBeGreaterThan(0);
  expect(updated.cardValues.every(text => text === '1.234.567,89')).toBe(true);
  expect(updated.featureLabel).toMatch(/1\.234\.567,89 W/);
});
