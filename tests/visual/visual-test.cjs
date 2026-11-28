const { test: baseTest, expect } = require('@playwright/test');
const { createBrowserWithContextLimit } = require('./browser-with-recycling.cjs');

function toAsciiJson(value) {
  return JSON.stringify(value).replace(/[^\x00-\x7f]/g, character =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

const test = baseTest.extend({
  browser: [async ({ playwright, browserName, _browserOptions, connectOptions }, use, workerInfo) => {
    // Playwright 1.60 supplies _browserOptions as a private worker fixture. Keep this guard and
    // the compatibility unit test in sync when upgrading Playwright.
    if (!_browserOptions || typeof _browserOptions !== 'object') {
      throw new Error('Playwright compatibility error: expected the internal _browserOptions worker fixture.');
    }

    if (connectOptions) {
      const browser = await playwright[browserName].connect(connectOptions.wsEndpoint, {
        ...connectOptions,
        exposeNetwork: connectOptions.exposeNetwork,
        headers: {
          'x-playwright-launch-options': toAsciiJson(_browserOptions),
          ...connectOptions.headers,
        },
      });
      try {
        await use(browser);
      } finally {
        await browser.close({ reason: 'Test ended.' });
      }
      return;
    }

    const managed = await createBrowserWithContextLimit({
      browserType: playwright[browserName],
      launchOptions: _browserOptions,
      maxContexts: browserName === 'webkit' ? 50 : Infinity,
      onLaunch: browser => process.env.PLAYWRIGHT_DASHBOARD
        ? browser.bind(`worker-${workerInfo.parallelIndex}`)
        : undefined,
    });
    try {
      await use(managed.browser);
    } finally {
      await managed.close();
    }
  }, { scope: 'worker', timeout: 0 }],
});

module.exports = { test, expect };
