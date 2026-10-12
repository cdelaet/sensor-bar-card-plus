const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildDist, artifactNames, distDirectory } = require('./build-dist.cjs');

function generatedArtifacts(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory() && (entry.name.startsWith('sensor-bar-card-plus') || /^chunks?$/.test(entry.name))) {
      return [`${entry.name}/`];
    }
    return entry.isDirectory()
      ? generatedArtifacts(filename).map(name => `${entry.name}/${name}`)
      : entry.name.startsWith('sensor-bar-card-plus') || /^chunk-.*\.(?:js|mjs|map)$/.test(entry.name)
        ? [entry.name] : [];
  }).sort();
}

function verifyDist(directory = distDirectory) {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sbcp-verify-dist-'));
  try {
    buildDist(temporaryDirectory);
    const expected = [...artifactNames].sort();
    if (JSON.stringify(fs.readdirSync(temporaryDirectory).sort()) !== JSON.stringify(expected)
        || JSON.stringify(generatedArtifacts(directory)) !== JSON.stringify(expected)) {
      throw new Error(`Unexpected or missing SBCP production artifacts. Expected exactly ${expected.join(', ')}.`);
    }
    for (const name of artifactNames) {
      if (!fs.readFileSync(path.join(directory, name)).equals(fs.readFileSync(path.join(temporaryDirectory, name)))) {
        throw new Error(`Production artifact ${name} is stale or missing. Run npm run build and include both dist JavaScript files.`);
      }
    }
    console.log('Production artifact pair matches the current source and build configuration.');
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try { verifyDist(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { verifyDist };
