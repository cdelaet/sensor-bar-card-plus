const path = require('path');
const { buildSync } = require('esbuild');

const root = path.resolve(__dirname, '..');
const distPath = path.join(root, 'dist', 'sensor-bar-card-plus.js');

function buildDist(outfile = distPath) {
  buildSync({
    entryPoints: [path.join(root, 'src', 'sensor-bar-card-plus.js')],
    outfile,
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2018'],
    logLevel: 'info',
  });
}

if (require.main === module) buildDist();

module.exports = { buildDist, distPath };
