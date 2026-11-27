const path = require('path');
const { testLocale } = require('./tests/support/test-locale.cjs');

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
    { name: 'webkit-editor-acceptance', testMatch: /acceptance\/(?:editor-acceptance|editor-palette-escape-focus|editor-gradient-enter-focus)\.spec\.js/, use: { browserName: 'webkit' } },
    { name: 'webkit-reference-identity', testMatch: /editor-reference-marker-identity\.spec\.js/, use: { browserName: 'webkit' } },
    { name: 'webkit-editor-disclosure-scroll', testMatch: /(?:editor-disclosure-scroll|editor-inherited-sync|external-editor-sync|editor-color-controls|paint-editor-ux|editor-paint-preset-library)\.spec\.js/, use: { browserName: 'webkit' } },
    { name: 'webkit-lazy-editors', testMatch: /lazy-editor-loading\.spec\.js/, use: { browserName: 'webkit' } },
    { name: 'webkit-paint-destinations', testMatch: /(?:paint-destination-contract|paint-destination-isolation|paint-editor-default-segments|paint-header-scale-preview|paint-palette-activity|paint-preset-runtime|target-above-paint|target-directional)\.spec\.js/, use: { browserName: 'webkit' } },
    { name: 'webkit-security-acceptance', testMatch: /acceptance\/security-hardening\.spec\.js/, use: { browserName: 'webkit' } },
    {
      name: 'webkit-visual',
      testMatch: /(?:^|[/\\])(?:card-feature|locale|editor-(?:bar-appearance|extrema|infrastructure|needle-baseline|palettes|reference-markers|sections|target)|feature-editor(?:-(?:capabilities|extrema|needle-baseline|palettes|reference-markers|target|ux))?|feature-marker-label-colors|minimum-height|paint-editor|sbcp)\.spec\.js$/,
      use: { browserName: 'webkit' },
    },
  ],
  use: {
    headless: true,
    locale: testLocale,
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
