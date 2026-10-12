const http = require('http');
const fs = require('fs');
const path = require('path');
const { getBuildIdentity } = require('../../tools/build-dist.cjs');

const root = path.resolve(__dirname, '../..');
const port = 4173;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const requested = urlPath === '/' ? '/tests/visual/fixtures/harness.html' : urlPath;
  const filePath = path.join(root, requested);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    if (requested === '/tests/visual/fixtures/harness.html' && new URL(req.url, 'http://localhost').searchParams.get('source') === 'dist') {
      content = Buffer.from(content.toString().replace('/src/sensor-bar-card-plus.js', '/dist/sensor-bar-card-plus.js'));
    }
    if (requested === '/src/editor-loader.js' || requested === '/src/sensor-bar-card-plus-editor.js') {
      // Separate provenance from production; recompute so a changed source pair
      // cannot be accepted by an already-loaded source runtime.
      const identity = `source:${getBuildIdentity()}`;
      content = Buffer.concat([Buffer.from(`const __SBCP_BUILD_ID__ = ${JSON.stringify(identity)};\nconst __SBCP_EDITOR_DIGEST__ = ${JSON.stringify(identity)};\n`), content]);
    }
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(content);
  });
}).listen(port, '127.0.0.1');
