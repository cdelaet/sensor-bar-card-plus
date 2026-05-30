import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const converterPath = join(repoRoot, 'tools', 'convert-legacy-config.py');
const pythonPath = join(repoRoot, '.venv', 'bin', 'python');

function convertYaml(inputYaml) {
  const tempDir = mkdtempSync(join(tmpdir(), 'sbcp-convert-'));
  const inputPath = join(tempDir, 'input.yaml');
  writeFileSync(inputPath, inputYaml, 'utf8');

  const output = execFileSync(pythonPath, [converterPath, inputPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return output;
}

function parseYaml(yamlText) {
  const json = execFileSync('ruby', ['-e', 'require "yaml"; require "json"; puts JSON.generate(YAML.load(ARGF.read))'], {
    cwd: repoRoot,
    input: yamlText,
    encoding: 'utf8',
  });
  return JSON.parse(json);
}

describe('legacy config converter', () => {
  it('maps color_mode compatibility syntax to fill_style output', () => {
    const output = convertYaml(`
views:
  - title: Test
    cards:
      - type: custom:sensor-bar-card-plus
        color_mode: single
        color: '#2563eb'
        entity: sensor.one
      - type: custom:sensor-bar-card-plus
        color_mode: gradient
        gradient_stops:
          - pos: 0
            color: '#2563eb'
          - pos: 100
            color: '#ef4444'
        entity: sensor.two
      - type: custom:sensor-bar-card-plus
        color_mode: severity
        severity:
          - from: 0
            to: 30
            color: '#22c55e'
          - from: 30
            to: 100
            color: '#ef4444'
        entity: sensor.three
      - type: custom:sensor-bar-card-plus
        color_mode: severity_gradient
        severity:
          - from: 0
            to: 30
            color: '#22c55e'
          - from: 30
            to: 100
            color: '#ef4444'
        entity: sensor.four
`);

    expect(output).not.toContain('color_mode:');

    const parsed = parseYaml(output);
    const cards = parsed.views[0].cards;
    expect(cards[0].bar.fill_style).toBe('solid');
    expect(cards[1].bar.fill_style).toBe('gradient');
    expect(cards[2].bar.fill_style).toBe('bands');
    expect(cards[3].bar.fill_style).toBe('band_gradient');
  });

  it('keeps severity conversion behavior while emitting fill_style bands', () => {
    const output = convertYaml(`
views:
  - title: Test
    cards:
      - type: custom:sensor-bar-card-plus
        color_mode: severity
        severity:
          - from: 0
            to: 50
            color: '#22c55e'
          - from: 50
            to: 100
            color: '#ef4444'
        entity: sensor.power
`);

    const parsed = parseYaml(output);
    const card = parsed.views[0].cards[0];
    expect(card.bar.fill_style).toBe('bands');
    expect(card.bar.segments).toEqual([
      { from: '0%', to: '50%', color: '#22c55e' },
      { from: '50%', to: '100%', color: '#ef4444' },
    ]);
  });

  it('prefers existing structured fill_style and preserves unrelated keys like card_mod', () => {
    const output = convertYaml(`
views:
  - title: Test
    cards:
      - type: custom:sensor-bar-card-plus
        bar:
          fill_style: gradient
          color_mode: severity
          gradient_stops:
            - pos: 0
              color: '#2563eb'
            - pos: 100
              color: '#ef4444'
        card_mod:
          style: |
            ha-card {
              background: red !important;
            }
        entity: sensor.one
`);

    expect(output).not.toContain('color_mode:');

    const parsed = parseYaml(output);
    const card = parsed.views[0].cards[0];
    expect(card.bar.fill_style).toBe('gradient');
    expect(card.card_mod.style).toContain('background: red');
  });
});
