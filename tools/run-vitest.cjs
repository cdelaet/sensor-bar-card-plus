const path = require('node:path');
const { spawnSync } = require('node:child_process');

const vitestCli = path.join(path.dirname(require.resolve('vitest')), 'vitest.mjs');
const result = spawnSync(process.execPath, [vitestCli, 'run', ...process.argv.slice(2)], {
  env: {
    ...process.env,
    LANG: 'nl_BE.UTF-8',
    LC_ALL: 'nl_BE.UTF-8',
  },
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
