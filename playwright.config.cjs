const path = require('path');

module.exports = {
  testDir: path.join(__dirname, 'tests/visual'),
  snapshotPathTemplate: '{testDir}/snapshots/{testFilePath}-snapshots/{arg}-{platform}{ext}',
  updateSnapshots: 'none',
  expect: {
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 50,
    },
  },
  fullyParallel: false,
  retries: 0,
  projects: [
    { name: '', use: { browserName: 'chromium' } },
    { name: 'webkit-editor-acceptance', testMatch: /acceptance\/editor-acceptance\.spec\.js/, use: { browserName: 'webkit' } },
    { name: 'webkit-reference-identity', testMatch: /editor-reference-marker-identity\.spec\.js/, use: { browserName: 'webkit' } },
    { name: 'webkit-lazy-editors', testMatch: /lazy-editor-loading\.spec\.js/, use: { browserName: 'webkit' } },
  ],
  use: {
    headless: true,
    locale: 'nl-BE',
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 900, height: 720 },
  },
  webServer: {
    command: 'node tests/visual/server.cjs',
    url: 'http://127.0.0.1:4173/tests/visual/fixtures/harness.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
};
