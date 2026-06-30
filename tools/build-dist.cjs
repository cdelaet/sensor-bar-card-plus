const path = require('path');
const { buildSync } = require('esbuild');

const root = path.resolve(__dirname, '..');

buildSync({
  entryPoints: [path.join(root, 'src', 'sensor-bar-card-plus.js')],
  outfile: path.join(root, 'dist', 'sensor-bar-card-plus.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2018'],
  logLevel: 'info',
});
