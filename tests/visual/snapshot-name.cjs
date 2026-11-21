const { existsSync } = require('node:fs');
const { test } = require('@playwright/test');

function snapshotName(name) {
  const info = test.info();
  if (info.project.use.browserName !== 'webkit') return name;
  const webkitName = name.replace(/\.png$/, '-webkit.png');
  // Keep sharing the reference when the checked browser renders it within tolerance.
  return existsSync(info.snapshotPath(webkitName, { kind: 'screenshot' })) ? webkitName : name;
}

module.exports = { snapshotName };
