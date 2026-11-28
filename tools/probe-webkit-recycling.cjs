const assert = require('node:assert/strict');
const { webkit } = require('playwright');
const { createServer } = require('../tests/visual/server.cjs');
const { createBrowserWithContextLimit } = require('../tests/visual/browser-with-recycling.cjs');

async function main() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const { port } = server.address();
  const started = Date.now();
  let managed;
  let completed = 0;
  let previousContext;
  const navigationMs = [];

  try {
    managed = await createBrowserWithContextLimit({
      browserType: webkit,
      launchOptions: { headless: true },
      maxContexts: 50,
    });

    for (let index = 0; index < 200; index += 1) {
      const context = await managed.browser.newContext();
      assert.notEqual(context, previousContext, 'each navigation must use a fresh context');
      previousContext = context;
      const page = await context.newPage();
      const source = index % 2 === 0 ? 'src' : 'dist';
      const navigationStarted = Date.now();
      try {
        await page.goto(`http://127.0.0.1:${port}/tests/visual/fixtures/harness.html?source=${source}`);
        await page.waitForFunction(() => customElements.get('sensor-bar-card-plus'));
        navigationMs.push(Date.now() - navigationStarted);
      } finally {
        await context.close();
      }
      completed += 1;
      if (completed % 50 === 0) {
        console.log(`Completed ${completed}/200 navigations; browser restarts: ${managed.restarts}`);
      }
    }

    assert.equal(managed.restarts, 3, '200 contexts with a 50-context limit should restart WebKit three times');
  } finally {
    if (managed) await managed.close();
    await new Promise(resolve => server.close(resolve));
  }

  navigationMs.sort((a, b) => a - b);
  console.log(JSON.stringify({
    navigations: completed,
    browserRestarts: managed.restarts,
    elapsedMs: Date.now() - started,
    p50NavigationMs: navigationMs[Math.floor(navigationMs.length * 0.5)],
    p95NavigationMs: navigationMs[Math.floor(navigationMs.length * 0.95)],
    sourceAndDist: true,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
