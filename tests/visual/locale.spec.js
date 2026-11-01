const { test, expect } = require('@playwright/test');
const { testLocale } = require('../support/test-locale.cjs');

test('browser tests use the canonical test locale', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  const locale = await page.evaluate(() => ({
    language: navigator.language,
    number: (1234567.5).toLocaleString(),
  }));

  expect(locale).toEqual({ language: testLocale, number: '1.234.567,5' });
});
