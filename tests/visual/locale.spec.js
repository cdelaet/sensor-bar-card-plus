const { test, expect } = require('@playwright/test');

test('browser tests use the canonical nl-BE locale', async ({ page }) => {
  await page.goto('/tests/visual/fixtures/harness.html');
  const locale = await page.evaluate(() => ({
    language: navigator.language,
    number: (1234567.5).toLocaleString(),
  }));

  expect(locale).toEqual({ language: 'nl-BE', number: '1.234.567,5' });
});
