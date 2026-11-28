import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { createBrowserWithContextLimit } = require('../visual/browser-with-recycling.cjs');

class FakeContext extends EventEmitter {
  closed = false;

  close() {
    if (this.closed) return;
    this.closed = true;
    this.emit('close');
  }
}

class FakeBrowser {
  contexts = [];
  close = vi.fn(async () => {
    for (const context of this.contexts) context.close();
  });
  newContext = vi.fn(async () => {
    const context = new FakeContext();
    this.contexts.push(context);
    return context;
  });
}

function fakeBrowserType({ failLaunchCalls = [], failContextCreations = 0 } = {}) {
  const browsers = [];
  let launchCalls = 0;
  const launch = vi.fn(async () => {
    launchCalls += 1;
    if (failLaunchCalls.includes(launchCalls)) {
      throw new Error('launch failed');
    }
    const browser = new FakeBrowser();
    if (failContextCreations > 0) {
      browser.newContext.mockImplementationOnce(async () => {
        failContextCreations -= 1;
        throw new Error('context creation failed');
      });
    }
    browsers.push(browser);
    return browser;
  });
  return { browserType: { launch }, browsers, launch };
}

describe('WebKit browser recycling lifecycle', () => {
  it('serializes concurrent context creation at the recycling boundary and restarts once', async () => {
    const fake = fakeBrowserType();
    const managed = await createBrowserWithContextLimit({ browserType: fake.browserType, maxContexts: 2 });
    const first = await managed.browser.newContext();
    const second = await managed.browser.newContext();
    first.close();
    second.close();

    const [third, fourth] = await Promise.all([
      managed.browser.newContext(),
      managed.browser.newContext(),
    ]);

    expect(fake.launch).toHaveBeenCalledTimes(2);
    expect(fake.browsers[0].close).toHaveBeenCalledTimes(1);
    expect(managed.restarts).toBe(1);
    expect(third).not.toBe(fourth);
    expect(fake.browsers[1].newContext).toHaveBeenCalledTimes(2);
    await managed.close();
  });

  it('closes a launched browser when dashboard setup fails', async () => {
    const fake = fakeBrowserType();
    const setupError = new Error('dashboard bind failed');
    await expect(createBrowserWithContextLimit({
      browserType: fake.browserType,
      maxContexts: 1,
      onLaunch: () => { throw setupError; },
    })).rejects.toBe(setupError);
    expect(fake.browsers).toHaveLength(1);
    expect(fake.browsers[0].close).toHaveBeenCalledTimes(1);
  });

  it('propagates launch failures and can recover after a failed replacement launch', async () => {
    const initialFailure = fakeBrowserType({ failLaunchCalls: [1] });
    await expect(createBrowserWithContextLimit({
      browserType: initialFailure.browserType,
      maxContexts: 1,
    })).rejects.toThrow('launch failed');
    expect(initialFailure.browsers).toHaveLength(0);

    const replacementFailure = fakeBrowserType({ failLaunchCalls: [2] });
    const managed = await createBrowserWithContextLimit({ browserType: replacementFailure.browserType, maxContexts: 1 });
    const firstContext = await managed.browser.newContext();
    firstContext.close();
    await expect(managed.browser.newContext()).rejects.toThrow('launch failed');
    expect(replacementFailure.browsers[0].close).toHaveBeenCalledTimes(1);

    const recoveredContext = await managed.browser.newContext();
    expect(managed.restarts).toBe(1);
    await managed.close();
    expect(recoveredContext.closed).toBe(true);
  });

  it('closes active contexts and the current browser once during worker cleanup', async () => {
    const fake = fakeBrowserType();
    const managed = await createBrowserWithContextLimit({ browserType: fake.browserType, maxContexts: 1 });
    const context = await managed.browser.newContext();

    await Promise.all([managed.close(), managed.browser.close()]);

    expect(context.closed).toBe(true);
    expect(fake.browsers[0].close).toHaveBeenCalledTimes(1);
    await expect(managed.browser.newContext()).rejects.toThrow(/after the test worker browser has closed/);
  });

  it('rejects browser.newPage because it bypasses context accounting', async () => {
    const fake = fakeBrowserType();
    const managed = await createBrowserWithContextLimit({ browserType: fake.browserType, maxContexts: 1 });
    expect(() => managed.browser.newPage()).toThrow(/use browser\.newContext\(\)/);
    await managed.close();
  });

  it('does not count failed context creation and recovers before cleanup', async () => {
    const fake = fakeBrowserType({ failContextCreations: 1 });
    const managed = await createBrowserWithContextLimit({ browserType: fake.browserType, maxContexts: 2 });
    await expect(managed.browser.newContext()).rejects.toThrow('context creation failed');
    const context = await managed.browser.newContext();

    expect(fake.launch).toHaveBeenCalledTimes(1);
    expect(fake.browsers[0].newContext).toHaveBeenCalledTimes(2);
    await managed.close();
    expect(context.closed).toBe(true);
    expect(fake.browsers[0].close).toHaveBeenCalledTimes(1);
  });
});

describe('Playwright fixture compatibility', () => {
  it('keeps the Playwright 1.60 internal _browserOptions fixture contract visible', () => {
    const playwrightFixtureSource = readFileSync(resolve(dirname(require.resolve('playwright')), 'lib/index.js'), 'utf8');
    expect(playwrightFixtureSource).toMatch(/_browserOptions:\s*\[async\s*\(/);
    expect(playwrightFixtureSource).toMatch(/browser:\s*\[async\s*\(\{\s*playwright,\s*browserName,\s*_browserOptions,\s*connectOptions\s*\}/);
  });
});
