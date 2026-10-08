import { it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

it('builds deterministic minified output and verifies it without rewriting dist or leaving temporary artifacts', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'sbcp-build-test-'));
  try {
    const project = path.join(workspace, 'project');
    const temporaryDirectory = path.join(workspace, 'temporary');
    for (const directory of ['tools', 'src']) fs.mkdirSync(path.join(project, directory), { recursive: true });
    fs.mkdirSync(temporaryDirectory);
    for (const file of ['build-dist.cjs', 'verify-dist.cjs']) {
      fs.copyFileSync(path.join(root, 'tools', file), path.join(project, 'tools', file));
    }
    const source = `
      // This readable fixture exercises the production command's public contract.
      const message = 'SBCP build verification';
      window.message = message;
    `;
    fs.writeFileSync(path.join(project, 'src', 'sensor-bar-card-plus.js'), source);
    const artifact = path.join(project, 'dist', 'sensor-bar-card-plus.js');
    const run = script => spawnSync(process.execPath, [path.join(project, 'tools', script)], {
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: path.join(root, 'node_modules'),
        TMPDIR: temporaryDirectory, TMP: temporaryDirectory, TEMP: temporaryDirectory },
    });

    expect(run('build-dist.cjs').status).toBe(0);
    const first = fs.readFileSync(artifact);
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThan(Buffer.byteLength(source));
    const context = { window: {} };
    vm.runInNewContext(first.toString(), context);
    expect(context.window.message).toBe('SBCP build verification');
    expect(context.message).toBeUndefined();
    expect(run('build-dist.cjs').status).toBe(0);
    expect(fs.readFileSync(artifact).equals(first)).toBe(true);

    const current = run('verify-dist.cjs');
    expect(current.status).toBe(0);
    expect(current.stdout).toContain('matches the current source');
    expect(fs.readFileSync(artifact).equals(first)).toBe(true);
    expect(fs.readdirSync(temporaryDirectory)).toEqual([]);

    fs.writeFileSync(artifact, 'stale artifact');
    const stale = run('verify-dist.cjs');
    expect(stale.status).toBe(1);
    expect(stale.stderr).toContain('stale or missing. Run npm run build');
    expect(fs.readFileSync(artifact, 'utf8')).toBe('stale artifact');
    expect(fs.readdirSync(temporaryDirectory)).toEqual([]);

    fs.unlinkSync(artifact);
    const missing = run('verify-dist.cjs');
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('stale or missing');
    expect(fs.existsSync(artifact)).toBe(false);
    expect(fs.readdirSync(temporaryDirectory)).toEqual([]);
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}, 10_000);
