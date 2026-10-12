const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { buildSync, version: esbuildVersion } = require('esbuild');

const root = path.resolve(__dirname, '..');
const distDirectory = path.join(root, 'dist');
const artifactNames = ['sensor-bar-card-plus.js', 'sensor-bar-card-plus-editor.js'];
const buildOptions = {
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2018'],
  supported: { 'dynamic-import': true, 'import-meta': true },
  logLevel: 'info',
};

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(filename) : entry.name.endsWith('.js') ? [filename] : [];
  });
}

function getBuildIdentity() {
  const hash = createHash('sha256');
  hash.update(JSON.stringify({ esbuildVersion, buildOptions }));
  const inputs = [...sourceFiles(path.join(root, 'src')), __filename,
    path.join(root, 'package.json'), path.join(root, 'package-lock.json')].sort();
  for (const filename of inputs) {
    const name = path.relative(root, filename).split(path.sep).join('/');
    const bytes = fs.readFileSync(filename);
    hash.update(`${name.length}:${name}:${bytes.length}:`);
    hash.update(bytes);
  }
  return hash.digest('hex');
}

function buildDist(outdir = distDirectory) {
  const buildIdentity = getBuildIdentity();
  const editorPath = path.join(outdir, artifactNames[1]);
  buildSync({ ...buildOptions,
    entryPoints: [path.join(root, 'src', artifactNames[1])],
    outfile: editorPath,
    define: { __SBCP_BUILD_ID__: JSON.stringify(buildIdentity) },
  });
  const editorDigest = createHash('sha256').update(fs.readFileSync(editorPath)).digest('hex');
  buildSync({ ...buildOptions,
    entryPoints: [path.join(root, 'src', artifactNames[0])],
    outfile: path.join(outdir, artifactNames[0]),
    define: {
      __SBCP_BUILD_ID__: JSON.stringify(buildIdentity),
      __SBCP_EDITOR_FILE__: JSON.stringify(`./${artifactNames[1]}`),
      __SBCP_EDITOR_DIGEST__: JSON.stringify(editorDigest),
    },
  });
  return { buildIdentity, editorDigest };
}

if (require.main === module) buildDist();

module.exports = { buildDist, getBuildIdentity, artifactNames, distDirectory };
