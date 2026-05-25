const path = require('path');

module.exports = {
  testDir: path.join(__dirname, 'tests/visual'),
  fullyParallel: false,
  retries: 0,
  use: {
    headless: true,
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
