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

function resolveRequest(requestUrl) {
  let urlPath;
  try {
    urlPath = decodeURIComponent((requestUrl || '/').split('?')[0]);
  } catch {
    return { status: 400, body: 'Bad request' };
  }
  if (urlPath.includes('\0')) return { status: 400, body: 'Bad request' };

  const requested = urlPath === '/' ? '/tests/visual/fixtures/harness.html' : urlPath;
  const filePath = path.resolve(root, requested.replace(/^\/+/, ''));
  const relative = path.relative(root, filePath);
  const outside = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  if (outside || relative === '') return { status: 403, body: 'Forbidden' };
  return { status: 200, requested, filePath };
}

function createServer() {
  return http.createServer((req, res) => {
    const resolved = resolveRequest(req.url);
    if (resolved.status !== 200) {
      res.writeHead(resolved.status);
      res.end(resolved.body);
      return;
    }

    fs.readFile(resolved.filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      let source = false;
      try {
        source = new URL(req.url, 'http://localhost').searchParams.get('source') === 'dist';
      } catch { /* Invalid query strings are served from source. */ }
      if (resolved.requested === '/tests/visual/fixtures/harness.html' && source) {
        content = Buffer.from(content.toString().replace('/src/sensor-bar-card-plus.js', '/dist/sensor-bar-card-plus.js'));
      }
      if (resolved.requested === '/src/editor-loader.js' || resolved.requested === '/src/sensor-bar-card-plus-editor.js') {
        // Separate provenance from production; recompute so a changed source pair
        // cannot be accepted by an already-loaded source runtime.
        const identity = `source:${getBuildIdentity()}`;
        content = Buffer.concat([Buffer.from(`const __SBCP_BUILD_ID__ = ${JSON.stringify(identity)};\nconst __SBCP_EDITOR_DIGEST__ = ${JSON.stringify(identity)};\n`), content]);
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(resolved.filePath)] || 'application/octet-stream' });
      res.end(content);
    });
  });
}

if (require.main === module) createServer().listen(port, '127.0.0.1');

module.exports = { createServer, resolveRequest, root, port };
