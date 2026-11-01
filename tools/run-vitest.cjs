const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { nodeLocale } = require('../tests/support/test-locale.cjs');

const vitestCli = path.join(path.dirname(require.resolve('vitest')), 'vitest.mjs');
const result = spawnSync(process.execPath, [vitestCli, 'run', ...process.argv.slice(2)], {
  env: {
    ...process.env,
    LANG: nodeLocale,
    LC_ALL: nodeLocale,
  },
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
