import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import { createServer } from '../visual/server.cjs';

let server;
let port;

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method: 'GET' }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

afterAll(async () => {
  await new Promise(resolve => server.close(resolve));
});

describe('visual development server containment', () => {
  it('serves the harness and normal files', async () => {
    const root = await request('/');
    expect(root.status).toBe(200);
    expect(root.body).toContain('SBCP Visual Harness');

    const harness = await request('/tests/visual/fixtures/harness.html');
    expect(harness.status).toBe(200);
    expect(harness.body).toContain('SBCP Visual Harness');

    const source = await request('/src/sensor-bar-card-plus.js');
    expect(source.status).toBe(200);
    expect(source.body).toContain('sensor-bar-card-plus');
  });

  it('does not serve paths outside the repository root', async () => {
    for (const pathName of ['/../package.json', '/%2e%2e/package.json', '/%2e%2e/%2e%2e/etc/passwd']) {
      const response = await request(pathName);
      expect(response.status, pathName).toBe(403);
    }
  });

  it('rejects malformed URL encoding and null bytes without crashing', async () => {
    for (const pathName of ['/%E0%A4%A', '/%00']) {
      const response = await request(pathName);
      expect(response.status, pathName).toBe(400);
    }
    expect((await request('/missing-file.html')).status).toBe(404);
  });
});
