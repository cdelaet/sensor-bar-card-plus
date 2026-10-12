import { it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const names = ['sensor-bar-card-plus.js', 'sensor-bar-card-plus-editor.js'];

it('keeps build identity and both artifacts invariant to root and nested source metadata', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'sbcp-metadata-test-'));
  try {
    for (const directory of ['tools', 'src/nested']) fs.mkdirSync(path.join(workspace, directory), { recursive: true });
    for (const file of ['build-dist.cjs', 'verify-dist.cjs']) fs.copyFileSync(path.join(root, 'tools', file), path.join(workspace, 'tools', file));
    for (const file of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(root, file), path.join(workspace, file));
    fs.writeFileSync(path.join(workspace, 'src', names[0]), `window.identity = __SBCP_BUILD_ID__; window.editorURL = new URL(__SBCP_EDITOR_FILE__, import.meta.url); window.editorURL.searchParams.set('sbcp_build', __SBCP_EDITOR_DIGEST__);`);
    fs.writeFileSync(path.join(workspace, 'src', names[1]), 'export const buildIdentity = __SBCP_BUILD_ID__;');
    const options = { cwd: workspace, encoding: 'utf8', env: { ...process.env, NODE_PATH: path.join(root, 'node_modules') } };
    const build = () => {
      const result = spawnSync(process.execPath, ['-e', "console.log(JSON.stringify(require('./tools/build-dist.cjs').buildDist()))"], options);
      expect(result.status, result.stderr).toBe(0);
      return JSON.parse(result.stdout);
    };
    const read = () => names.map(name => fs.readFileSync(path.join(workspace, 'dist', name)));
    const identity = build();
    const artifacts = read();
    const verify = () => {
      const result = spawnSync(process.execPath, ['tools/verify-dist.cjs'], options);
      expect(result.status, result.stderr).toBe(0);
      expect(read()).toEqual(artifacts);
    };
    verify();
    for (const relative of ['src/.DS_Store', 'src/nested/.DS_Store']) {
      for (const contents of ['Finder metadata', 'Changed Finder metadata with different bytes']) {
        fs.writeFileSync(path.join(workspace, relative), contents);
        // Verification must succeed against the original pair before rebuilding.
        verify();
        expect(build()).toEqual(identity);
        expect(read()).toEqual(artifacts);
        verify();
      }
    }
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}, 30_000);

it('builds an exact deterministic ESM pair, fingerprints same-version inputs, and verifies without mutations', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'sbcp-build-test-'));
  try {
    const project = path.join(workspace, 'project');
    const temporaryDirectory = path.join(workspace, 'temporary');
    for (const directory of ['tools', 'src']) fs.mkdirSync(path.join(project, directory), { recursive: true });
    fs.mkdirSync(temporaryDirectory);
    for (const file of ['build-dist.cjs', 'verify-dist.cjs']) fs.copyFileSync(path.join(root, 'tools', file), path.join(project, 'tools', file));
    for (const file of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(root, file), path.join(project, file));
    const source = `window.identity = __SBCP_BUILD_ID__; window.editorURL = new URL(__SBCP_EDITOR_FILE__, import.meta.url); window.editorURL.searchParams.set('sbcp_build', __SBCP_EDITOR_DIGEST__);`;
    fs.writeFileSync(path.join(project, 'src', names[0]), source);
    fs.writeFileSync(path.join(project, 'src', names[1]), 'export const buildIdentity = __SBCP_BUILD_ID__; export class SensorBarCardPlusEditor {} export class SensorBarCardPlusFeatureEditor {}');
    const dist = path.join(project, 'dist');
    const run = script => spawnSync(process.execPath, [path.join(project, 'tools', script)], {
      encoding: 'utf8', env: { ...process.env, NODE_PATH: path.join(root, 'node_modules'),
        TMPDIR: temporaryDirectory, TMP: temporaryDirectory, TEMP: temporaryDirectory },
    });
    const read = () => names.map(name => fs.readFileSync(path.join(dist, name)));
    const verify = status => {
      const before = read();
      expect(run('verify-dist.cjs').status).toBe(status);
      expect(read()).toEqual(before);
      expect(fs.readdirSync(temporaryDirectory)).toEqual([]);
    };
    expect(run('build-dist.cjs').status).toBe(0);
    const first = read();
    expect(fs.readdirSync(dist).sort()).toEqual([...names].sort());
    for (const bytes of first) {
      expect(bytes.length).toBeGreaterThan(0);
      expect(spawnSync(process.execPath, ['--input-type=module', '--check'], { input: bytes }).status).toBe(0);
    }
    expect(first[0].toString()).toContain('import.meta.url');
    expect(first[1].toString()).toContain('export');
    expect(run('build-dist.cjs').status).toBe(0);
    expect(read()).toEqual(first);
    verify(0);
    // Absolute checkout paths are excluded from identity and output.
    const relocated = path.join(workspace, 'relocated');
    fs.cpSync(project, relocated, { recursive: true });
    expect(spawnSync(process.execPath, [path.join(relocated, 'tools/build-dist.cjs')], {
      env: { ...process.env, NODE_PATH: path.join(root, 'node_modules') },
    }).status).toBe(0);
    expect(names.map(name => fs.readFileSync(path.join(relocated, 'dist', name)))).toEqual(first);
    // Same-version source, build and toolchain lockfile edits invalidate both.
    for (const relative of ['src/' + names[0], 'src/' + names[1], 'tools/build-dist.cjs', 'package.json', 'package-lock.json']) {
      fs.appendFileSync(path.join(project, relative), '\n ');
      verify(1);
      const before = read();
      expect(run('build-dist.cjs').status).toBe(0);
      read().forEach((bytes, i) => expect(bytes.equals(before[i])).toBe(false));
    }
    for (const name of names) {
      const filename = path.join(dist, name), bytes = fs.readFileSync(filename);
      fs.writeFileSync(filename, 'stale artifact'); verify(1);
      fs.unlinkSync(filename);
      expect(run('verify-dist.cjs').status).toBe(1);
      expect(fs.existsSync(filename)).toBe(false);
      expect(fs.readdirSync(temporaryDirectory)).toEqual([]);
      fs.writeFileSync(filename, bytes);
    }
    for (const unexpected of ['sensor-bar-card-plus-editor-oldhash.js', 'sensor-bar-card-plus-manifest.json', 'chunk-oldhash.js', 'chunks/editor.js']) {
      const filename = path.join(dist, unexpected);
      fs.mkdirSync(path.dirname(filename), { recursive: true }); fs.writeFileSync(filename, 'unexpected');
      verify(1); expect(fs.readFileSync(filename, 'utf8')).toBe('unexpected'); fs.unlinkSync(filename);
      if (unexpected.startsWith('chunks/')) {
        verify(1); // Even an empty generated chunk directory is unexpected.
        fs.rmdirSync(path.dirname(filename));
      }
    }
    fs.writeFileSync(path.join(dist, 'unrelated.txt'), 'keep'); verify(0);
    expect(fs.readFileSync(path.join(dist, 'unrelated.txt'), 'utf8')).toBe('keep');
  } finally {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}, 30_000);
