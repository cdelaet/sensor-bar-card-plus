function createBrowserWithContextLimit({ browserType, launchOptions, maxContexts, onLaunch }) {
  let browser;
  let contextsCreated = 0;
  let activeContexts = 0;
  let restarts = 0;
  let replacementPending = false;
  let closed = false;
  let queue = Promise.resolve();

  const serialize = operation => {
    const result = queue.then(operation);
    queue = result.catch(() => {});
    return result;
  };

  const launch = async () => {
    const nextBrowser = await browserType.launch(launchOptions);
    try {
      await onLaunch?.(nextBrowser);
    } catch (error) {
      try {
        await nextBrowser.close({ reason: 'Browser setup failed.' });
      } catch (cleanupError) {
        if (error && typeof error === 'object') error.cleanupError = cleanupError;
      }
      throw error;
    }
    browser = nextBrowser;
    if (replacementPending) {
      restarts += 1;
      replacementPending = false;
    }
  };

  const closeCurrentBrowser = async reason => {
    if (!browser) return;
    const currentBrowser = browser;
    await currentBrowser.close({ reason });
    if (browser === currentBrowser) browser = undefined;
  };

  const newContext = (...args) => serialize(async () => {
    if (closed) throw new Error('Cannot create a browser context after the test worker browser has closed.');
    if (!browser) await launch();

    if (contextsCreated >= maxContexts && activeContexts === 0) {
      await closeCurrentBrowser('Recycling browser after its context limit.');
      contextsCreated = 0;
      replacementPending = true;
      await launch();
    }

    const context = await browser.newContext(...args);
    contextsCreated += 1;
    activeContexts += 1;
    context.once('close', () => { activeContexts -= 1; });
    return context;
  });

  const close = reason => serialize(async () => {
    if (closed) {
      await closeCurrentBrowser(reason);
      return;
    }
    closed = true;
    await closeCurrentBrowser(reason);
  });

  const browserProxy = new Proxy({}, {
    get(_target, property) {
      if (property === 'newContext') return newContext;
      if (property === 'newPage') {
        return () => {
          throw new Error('browser.newPage() is unsupported by the recycling fixture; use browser.newContext() and context.newPage() so each context is accounted for.');
        };
      }
      if (property === 'close') return () => close('Test ended.');
      const value = browser?.[property];
      return typeof value === 'function' ? value.bind(browser) : value;
    },
  });

  return serialize(async () => {
    await launch();
    return {
      browser: browserProxy,
      get restarts() { return restarts; },
      close: () => close('Test worker ended.'),
    };
  });
}

module.exports = { createBrowserWithContextLimit };
