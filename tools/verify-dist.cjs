const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildDist, distPath } = require('./build-dist.cjs');

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sbcp-verify-dist-'));

try {
  const temporaryArtifact = path.join(temporaryDirectory, path.basename(distPath));
  buildDist(temporaryArtifact);
  if (!fs.existsSync(distPath) || !fs.readFileSync(distPath).equals(fs.readFileSync(temporaryArtifact))) {
    console.error('Production bundle is stale or missing. Run npm run build and commit dist/sensor-bar-card-plus.js.');
    process.exitCode = 1;
  } else {
    console.log('Production bundle matches the current source and build configuration.');
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
