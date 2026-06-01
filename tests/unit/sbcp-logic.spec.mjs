import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createCard } from '../support/load-card-class.cjs';

describe('Sensor Bar Card Plus logic', () => {
  it('normalizes card defaults and single-entity shorthand', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      entity: 'sensor.one',
      baseline: 0,
    });

    expect(cfg.entities).toHaveLength(1);
    expect(cfg.entities[0].entity).toBe('sensor.one');
    expect(cfg.baseline.at.fixed).toBe(0);
    expect(cfg.bar.color_mode).toBe('severity');
    expect(cfg.layout.label.position).toBe('left');
  });

  it('preserves unknown config keys such as card_mod', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      entity: 'sensor.one',
      card_mod: {
        style: {
          '.': 'ha-card { background: red; }',
        },
      },
    });

    expect(cfg.card_mod).toEqual({
      style: {
        '.': 'ha-card { background: red; }',
      },
    });
  });

  it('merges per-entity scale overrides over card defaults', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      min: 0,
      max: 100,
      baseline: 10,
      entities: [
        { entity: 'sensor.row', max: 500, baseline: { at: 75 } },
      ],
    });

    expect(cfg.entities[0].scale.min.fixed).toBe(0);
    expect(cfg.entities[0].scale.max.fixed).toBe(500);
    expect(cfg.entities[0].baseline.at.fixed).toBe(75);
  });

  it('normalizes legacy layout fields into the nested layout shape', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      label_position: 'left',
      label_width: 160,
      height: 44,
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.layout).toEqual({
      label: {
        position: 'left',
        width: 160,
      },
      height: 44,
      height_explicit: true,
    });
  });

  it('rendering reads the nested layout shape', () => {
    const card = createCard();
    card._hass.states = {
      'sensor.row': {
        state: '42',
        attributes: {
          friendly_name: 'Row',
          icon: 'mdi:flash',
          unit_of_measurement: 'W',
        },
      },
    };

    const ecfg = card.normalizeCardConfig({
      entities: [{ entity: 'sensor.row', label_width: 160 }],
    }).entities[0];

    ecfg.layout.label.width = 222;
    ecfg.label_width = 999;

    const html = card._buildRow(
      ecfg,
      '42',
      'W',
      50,
      '#4a9eff',
      null,
      null,
      null,
      null,
      '#888',
      '#888',
      0,
      100
    );

    expect(html).toContain('min(222px, var(--sbcp-left-label-share))');
    expect(html).not.toContain('999px');
  });

  it('accepts structured layout input', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      layout: {
        label: {
          position: 'above',
          width: 180,
        },
        height: 44,
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.layout).toEqual({
      label: {
        position: 'above',
        width: 180,
      },
      height: 44,
      height_explicit: true,
    });
  });

  it('accepts structured scale input with fixed values', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      scale: {
        min: { fixed: 0 },
        max: { fixed: 100 },
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.scale.min).toEqual({ fixed: 0, entity: null });
    expect(cfg.scale.max).toEqual({ fixed: 100, entity: null });
  });

  it('accepts structured scale input with entity plus fixed fallback', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      scale: {
        min: { entity: 'sensor.dynamic_min', fixed: 0 },
        max: { entity: 'sensor.dynamic_max', fixed: 100 },
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.scale.min).toEqual({ fixed: 0, entity: 'sensor.dynamic_min' });
    expect(cfg.scale.max).toEqual({ fixed: 100, entity: 'sensor.dynamic_max' });
  });

  it('does not treat structured scale bounds as percent-space values', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      scale: {
        min: '50%',
        max: '100%',
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.scale.min).toEqual({ fixed: '50%', entity: null });
    expect(cfg.scale.max).toEqual({ fixed: '100%', entity: null });
    expect(cfg.scale.min.percent).toBeUndefined();
    expect(cfg.scale.max.percent).toBeUndefined();
    expect(card._getNormalizedResolvableNumericValue(cfg.scale.min)).toBe(50);
    expect(card._getNormalizedResolvableNumericValue(cfg.scale.max)).toBe(100);
  });

  it('accepts structured formatting input', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      formatting: {
        decimal: 1,
        unit: 'W',
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.formatting).toEqual({
      decimal: 1,
      unit: 'W',
    });
  });

  it('accepts structured target input and normalizes to target_marker', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      target: {
        at: {
          entity: 'sensor.dynamic_target',
          fixed: 2000,
        },
        color: '#888888',
        label: {
          show: true,
        },
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.target_marker).toEqual({
      source: {
        fixed: 2000,
        entity: 'sensor.dynamic_target',
      },
      color: '#888888',
      show_label: true,
    });
  });

  it('maps structured target when_exceeded.fill_color to above_target_color', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      target: {
        at: { fixed: 65 },
        when_exceeded: {
          fill_color: '#dc2626',
        },
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.above_target_color).toBe('#dc2626');
  });

  it('accepts structured peak input and normalizes to peak_marker', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      peak: {
        enabled: true,
        color: '#888888',
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.peak_marker).toEqual({
      show: true,
      color: '#888888',
    });
  });

  it('normalizes legacy severity arrays into the internal segment model', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      severity: [
        { from: 0, color: '#4CAF50' },
        { from: 33, color: '#FF9800' },
        { from: 75, color: '#F44336' },
      ],
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.segments).toEqual([
      { from: 0, to: 33, color: '#4CAF50', label: null },
      { from: 33, to: 75, color: '#FF9800', label: null },
      { from: 75, to: 100, color: '#F44336', label: null },
    ]);
    expect(cfg.bar.segment_space).toBe('percent');
    expect(cfg.bar.severity).toEqual(cfg.bar.segments);
  });

  it('keeps gradient_stops separate from segment normalization', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      color_mode: 'gradient',
      gradient_stops: [
        { pos: 0, color: '#4CAF50' },
        { pos: 50, color: '#FF9800' },
        { pos: 100, color: '#F44336' },
      ],
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.gradient_stops).toEqual([
      { pos: 0, color: '#4CAF50' },
      { pos: 50, color: '#FF9800' },
      { pos: 100, color: '#F44336' },
    ]);
    expect(cfg.bar.segments).toEqual(cfg.bar.severity);
  });

  it('normalizes percentage-string gradient stop positions to the same internal form as numeric positions', () => {
    const card = createCard();
    const numeric = card.normalizeCardConfig({
      color_mode: 'gradient',
      gradient_stops: [
        { pos: 0, color: '#2563eb' },
        { pos: 50, color: '#06b6d4' },
        { pos: 100, color: '#ef4444' },
      ],
      entities: [{ entity: 'sensor.row' }],
    });
    const percent = card.normalizeCardConfig({
      color_mode: 'gradient',
      gradient_stops: [
        { pos: '0%', color: '#2563eb' },
        { pos: '50%', color: '#06b6d4' },
        { pos: '100%', color: '#ef4444' },
      ],
      entities: [{ entity: 'sensor.row' }],
    });

    expect(percent.bar.gradient_stops).toEqual(numeric.bar.gradient_stops);
  });

  it('renders numeric and percentage-string gradient stop positions identically', () => {
    const card = createCard();
    const numeric = card.normalizeCardConfig({
      bar: {
        fill_style: 'gradient',
        gradient_stops: [
          { pos: 0, color: '#2563eb' },
          { pos: 50, color: '#06b6d4' },
          { pos: 100, color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];
    const percent = card.normalizeCardConfig({
      bar: {
        fill_style: 'gradient',
        gradient_stops: [
          { pos: '0%', color: '#2563eb' },
          { pos: '50%', color: '#06b6d4' },
          { pos: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    expect(card._getGradientInterpolationStops(percent, 0, 100)).toEqual(
      card._getGradientInterpolationStops(numeric, 0, 100)
    );
    expect(card._getColor(25, percent, 0, 100)).toBe(card._getColor(25, numeric, 0, 100));
    expect(card._getColor(50, percent, 0, 100)).toBe(card._getColor(50, numeric, 0, 100));
    expect(card._getColor(75, percent, 0, 100)).toBe(card._getColor(75, numeric, 0, 100));
  });

  it('accepts gauge-compatible top-level segments', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      segments: [
        { from: 0, color: '#4CAF50' },
        { from: 50, color: '#FF9800' },
        { from: 80, color: '#F44336', label: 'High' },
      ],
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.segments).toEqual([
      { from: { fixed: 0, entity: null }, to: { fixed: 50, entity: null }, color: '#4CAF50', label: null },
      { from: { fixed: 50, entity: null }, to: { fixed: 80, entity: null }, color: '#FF9800', label: null },
      { from: { fixed: 80, entity: null }, to: null, color: '#F44336', label: 'High' },
    ]);
    expect(cfg.bar.segment_space).toBe('scale');
  });

  it('accepts structured bar.segments', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: {
        segments: [
          { from: 0, color: '#4CAF50' },
          { from: 60, color: '#F44336' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.segments).toEqual([
      { from: { fixed: 0, entity: null }, to: { fixed: 60, entity: null }, color: '#4CAF50', label: null },
      { from: { fixed: 60, entity: null }, to: null, color: '#F44336', label: null },
    ]);
    expect(cfg.bar.segment_space).toBe('scale');
  });

  it('parses percent literals with optional whitespace and decimals', () => {
    const card = createCard();

    expect(card._parsePercentLiteral('0%')).toBe(0);
    expect(card._parsePercentLiteral('50%')).toBe(50);
    expect(card._parsePercentLiteral('12.5%')).toBe(12.5);
    expect(card._parsePercentLiteral('  75%  ')).toBe(75);
  });

  it('accepts structured bar.segments with percentage-string boundaries', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: {
        segments: [
          { from: '0%', to: '50%', color: '#22c55e' },
          { from: '50%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.segments).toEqual([
      { from: { fixed: null, entity: null, percent: 0 }, to: { fixed: null, entity: null, percent: 50 }, color: '#22c55e', label: null },
      { from: { fixed: null, entity: null, percent: 50 }, to: { fixed: null, entity: null, percent: 100 }, color: '#ef4444', label: null },
    ]);
  });

  it('accepts top-level segments with percentage-string boundaries', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      segments: [
        { from: '0%', color: '#22c55e' },
        { from: '70%', color: '#ef4444' },
      ],
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.segments).toEqual([
      { from: { fixed: null, entity: null, percent: 0 }, to: { fixed: null, entity: null, percent: 70 }, color: '#22c55e', label: null },
      { from: { fixed: null, entity: null, percent: 70 }, to: null, color: '#ef4444', label: null },
    ]);
  });

  it('accepts structured bar settings for color_mode, color, gradient_stops, and animated', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      color_mode: 'single',
      color: '#111111',
      animated: false,
      gradient_stops: [{ pos: 0, color: '#000000' }],
      bar: {
        color_mode: 'gradient',
        color: '#4a9eff',
        gradient_stops: [
          { pos: 0, color: '#22c55e' },
          { pos: 100, color: '#ef4444' },
        ],
        animated: true,
        solid_fill: true,
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.fill_style).toBe('gradient');
    expect(cfg.bar.color_mode).toBe('gradient');
    expect(cfg.bar.solid_fill).toBe(true);
    expect(cfg.bar.color).toBe('#4a9eff');
    expect(cfg.bar.gradient_stops).toEqual([
      { pos: 0, color: '#22c55e' },
      { pos: 100, color: '#ef4444' },
    ]);
    expect(cfg.bar.animated).toBe(true);
  });

  it('prefers bar.segments over top-level segments and severity', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      segments: [
        { from: 0, color: '#2563eb' },
        { from: 75, color: '#ef4444' },
      ],
      severity: [
        { from: 0, to: 50, color: '#4CAF50' },
        { from: 50, to: 100, color: '#F44336' },
      ],
      bar: {
        segments: [
          { from: 0, color: '#111111' },
          { from: 20, color: '#222222' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.segments).toEqual([
      { from: { fixed: 0, entity: null }, to: { fixed: 20, entity: null }, color: '#111111', label: null },
      { from: { fixed: 20, entity: null }, to: null, color: '#222222', label: null },
    ]);
  });

  it('maps fill_style solid to color_mode single', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: { fill_style: 'solid' },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.fill_style).toBe('solid');
    expect(cfg.bar.color_mode).toBe('single');
  });

  it('maps fill_style gradient to color_mode gradient', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: { fill_style: 'gradient' },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.fill_style).toBe('gradient');
    expect(cfg.bar.color_mode).toBe('gradient');
  });

  it('maps fill_style bands to color_mode severity', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: { fill_style: 'bands' },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.fill_style).toBe('bands');
    expect(cfg.bar.color_mode).toBe('severity');
  });

  it('maps fill_style band_gradient to color_mode severity_gradient', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: { fill_style: 'band_gradient' },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.fill_style).toBe('band_gradient');
    expect(cfg.bar.color_mode).toBe('severity_gradient');
  });

  it('prefers fill_style over color_mode when both are specified', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: {
        fill_style: 'bands',
        color_mode: 'gradient',
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.fill_style).toBe('bands');
    expect(cfg.bar.color_mode).toBe('severity');
  });

  it('defaults solid_fill to false', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.solid_fill).toBe(false);
    expect(cfg.entities[0].bar.solid_fill).toBe(false);
  });

  it('normalizes card-level solid_fill', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: {
        fill_style: 'gradient',
        solid_fill: true,
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.solid_fill).toBe(true);
    expect(cfg.entities[0].bar.solid_fill).toBe(true);
  });

  it('lets entity-level solid_fill override the card-level value', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: {
        fill_style: 'gradient',
        solid_fill: true,
      },
      entities: [{
        entity: 'sensor.row',
        bar: {
          solid_fill: false,
        },
      }],
    });

    expect(cfg.entities[0].bar.fill_style).toBe('gradient');
    expect(cfg.entities[0].bar.solid_fill).toBe(false);
  });

  it('inherits card-level fill_style even when an entity-level bar object overrides other bar fields', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: {
        fill_style: 'gradient',
      },
      entities: [{
        entity: 'sensor.row',
        bar: {
          color: '#ff0000',
        },
      }],
    });

    expect(cfg.entities[0].bar.fill_style).toBe('gradient');
    expect(cfg.entities[0].bar.color_mode).toBe('gradient');
    expect(cfg.entities[0].bar.color).toBe('#ff0000');
  });

  it('prefers top-level segments over legacy severity at the same level', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      segments: [
        { from: 0, color: '#2563eb' },
        { from: 80, color: '#ef4444' },
      ],
      severity: [
        { from: 0, to: 50, color: '#4CAF50' },
        { from: 50, to: 100, color: '#F44336' },
      ],
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.segments).toEqual([
      { from: { fixed: 0, entity: null }, to: { fixed: 80, entity: null }, color: '#2563eb', label: null },
      { from: { fixed: 80, entity: null }, to: null, color: '#ef4444', label: null },
    ]);
    expect(cfg.bar.segment_space).toBe('scale');
  });

  it('inherits card-level segments and lets entity-level segments override them', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      bar: {
        segments: [
          { from: 0, color: '#4CAF50' },
          { from: 50, color: '#F44336' },
        ],
      },
      entities: [
        { entity: 'sensor.first' },
        {
          entity: 'sensor.second',
          segments: [
            { from: 0, color: '#2563eb' },
            { from: 80, color: '#ef4444' },
          ],
        },
      ],
    });

    expect(cfg.entities[0].bar.segments).toEqual(cfg.bar.segments);
    expect(cfg.entities[1].bar.segments).toEqual([
      { from: { fixed: 0, entity: null }, to: { fixed: 80, entity: null }, color: '#2563eb', label: null },
      { from: { fixed: 80, entity: null }, to: null, color: '#ef4444', label: null },
    ]);
  });

  it('entity-level structured config overrides card-level structured config', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      layout: {
        label: {
          position: 'left',
          width: 160,
        },
        height: 44,
      },
      scale: {
        min: { fixed: 0 },
        max: { fixed: 100 },
      },
      formatting: {
        decimal: 1,
        unit: 'W',
      },
      target: {
        at: { fixed: 65 },
        color: '#ffffff',
        label: { show: true },
      },
      peak: {
        enabled: true,
        color: '#888888',
      },
      bar: {
        color_mode: 'severity',
        segments: [
          { from: 0, color: '#22c55e' },
          { from: 50, color: '#ef4444' },
        ],
        animated: true,
      },
      entities: [
        {
          entity: 'sensor.row',
          layout: {
            label: {
              position: 'above',
              width: 180,
            },
            height: 50,
          },
          scale: {
            min: { fixed: -10 },
            max: { fixed: 120 },
          },
          formatting: {
            decimal: 2,
            unit: 'kW',
          },
          target: {
            at: { fixed: 80 },
            color: '#ff00ff',
            label: { show: false },
          },
          peak: {
            enabled: false,
            color: '#00ffff',
          },
          bar: {
            color_mode: 'gradient',
            animated: false,
          },
        },
      ],
    });

    const row = cfg.entities[0];
    expect(row.layout).toEqual({
      label: {
        position: 'above',
        width: 180,
      },
      height: 50,
      height_explicit: true,
    });
    expect(row.scale.min).toEqual({ fixed: -10, entity: null });
    expect(row.scale.max).toEqual({ fixed: 120, entity: null });
    expect(row.formatting).toEqual({ decimal: 2, unit: 'kW' });
    expect(row.target_marker).toEqual({
      source: { fixed: 80, entity: null },
      color: '#ff00ff',
      show_label: false,
    });
    expect(row.peak_marker).toEqual({
      show: false,
      color: '#00ffff',
    });
    expect(row.bar.color_mode).toBe('gradient');
    expect(row.bar.animated).toBe(false);
  });

  it('entity-level legacy flat config overrides card-level structured config', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      layout: {
        label: {
          position: 'above',
          width: 180,
        },
        height: 44,
      },
      scale: {
        min: { fixed: 10 },
        max: { fixed: 100 },
      },
      formatting: {
        decimal: 1,
        unit: 'W',
      },
      target: {
        at: { fixed: 65 },
        color: '#ffffff',
        label: { show: false },
      },
      peak: {
        enabled: false,
        color: '#888888',
      },
      bar: {
        color_mode: 'gradient',
        animated: false,
      },
      entities: [
        {
          entity: 'sensor.row',
          label_position: 'left',
          label_width: 140,
          height: 40,
          min: 0,
          max: 120,
          decimal: 3,
          unit: 'kW',
          target: 75,
          target_color: '#ff0000',
          show_target_label: true,
          show_peak: true,
          peak_color: '#00ff00',
          color_mode: 'single',
          animated: true,
        },
      ],
    });

    const row = cfg.entities[0];
    expect(row.layout).toEqual({
      label: {
        position: 'left',
        width: 140,
      },
      height: 40,
      height_explicit: true,
    });
    expect(row.scale.min).toEqual({ fixed: 0, entity: null });
    expect(row.scale.max).toEqual({ fixed: 120, entity: null });
    expect(row.formatting).toEqual({ decimal: 3, unit: 'kW' });
    expect(row.target_marker).toEqual({
      source: { fixed: 75, entity: null },
      color: '#ff0000',
      show_label: true,
    });
    expect(row.peak_marker).toEqual({
      show: true,
      color: '#00ff00',
    });
    expect(row.bar.color_mode).toBe('single');
    expect(row.bar.animated).toBe(true);
  });

  it('entity-level structured config overrides card-level legacy flat config', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      label_position: 'left',
      label_width: 140,
      height: 40,
      min: 0,
      max: 120,
      decimal: 1,
      unit: 'W',
      target: 65,
      target_color: '#ffffff',
      show_target_label: false,
      show_peak: false,
      peak_color: '#888888',
      color_mode: 'single',
      animated: true,
      entities: [
        {
          entity: 'sensor.row',
          layout: {
            label: {
              position: 'inside',
              width: 200,
            },
            height: 50,
          },
          scale: {
            min: { fixed: -10 },
            max: { fixed: 200 },
          },
          formatting: {
            decimal: 2,
            unit: 'kW',
          },
          target: {
            at: { fixed: 80 },
            color: '#ff00ff',
            label: { show: true },
          },
          peak: {
            enabled: true,
            color: '#00ffff',
          },
          bar: {
            color_mode: 'gradient',
            animated: false,
          },
        },
      ],
    });

    const row = cfg.entities[0];
    expect(row.layout).toEqual({
      label: {
        position: 'inside',
        width: 200,
      },
      height: 50,
      height_explicit: true,
    });
    expect(row.scale.min).toEqual({ fixed: -10, entity: null });
    expect(row.scale.max).toEqual({ fixed: 200, entity: null });
    expect(row.formatting).toEqual({ decimal: 2, unit: 'kW' });
    expect(row.target_marker).toEqual({
      source: { fixed: 80, entity: null },
      color: '#ff00ff',
      show_label: true,
    });
    expect(row.peak_marker).toEqual({
      show: true,
      color: '#00ffff',
    });
    expect(row.bar.color_mode).toBe('gradient');
    expect(row.bar.animated).toBe(false);
  });

  it('preserves min_entity and max_entity fallback behavior', () => {
    const card = createCard();
    card._hass.states = {
      'sensor.dynamic_min': { state: '12' },
      'sensor.dynamic_max': { state: '240' },
    };

    const cfg = card.normalizeCardConfig({
      min: 0,
      min_entity: 'sensor.dynamic_min',
      max: 100,
      max_entity: 'sensor.dynamic_max',
      entities: [{ entity: 'sensor.row' }],
    });
    const row = cfg.entities[0];

    expect(card._getNormalizedResolvableNumericValue(row.scale.min)).toBe(12);
    expect(card._getNormalizedResolvableNumericValue(row.scale.max)).toBe(240);

    delete card._hass.states['sensor.dynamic_min'];
    delete card._hass.states['sensor.dynamic_max'];

    expect(card._getNormalizedResolvableNumericValue(row.scale.min)).toBe(0);
    expect(card._getNormalizedResolvableNumericValue(row.scale.max)).toBe(100);
  });

  it('preserves target and target_entity fallback behavior', () => {
    const card = createCard();
    card._hass.states = {
      'sensor.dynamic_target': { state: '77' },
    };

    const cfg = card.normalizeCardConfig({
      target: 50,
      target_entity: 'sensor.dynamic_target',
      entities: [{ entity: 'sensor.row' }],
    });
    const row = cfg.entities[0];

    expect(card._getNormalizedResolvableNumericValue(row.target_marker.source)).toBe(77);

    delete card._hass.states['sensor.dynamic_target'];
    expect(card._getNormalizedResolvableNumericValue(row.target_marker.source)).toBe(50);
  });

  it('resolves structured target percent values against the active scale', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      scale: {
        min: { fixed: 0 },
        max: { fixed: 200 },
      },
      target: {
        at: '50%',
      },
      entities: [{ entity: 'sensor.row' }],
    });
    const row = cfg.entities[0];

    expect(row.target_marker.source).toEqual({
      fixed: null,
      entity: null,
      percent: 50,
    });
    expect(card._getNormalizedResolvableNumericValue(row.target_marker.source, 0, 200)).toBe(100);
  });

  it('supports baseline number shorthand', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      baseline: 5,
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.baseline.at).toMatchObject({ fixed: 5, entity: null });
  });

  it('supports baseline entity-string shorthand', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      baseline: 'sensor.dynamic_baseline',
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.baseline.at).toMatchObject({ fixed: null, entity: 'sensor.dynamic_baseline' });
  });

  it('supports baseline.at shorthand and baseline.at entity shorthand', () => {
    const card = createCard();
    const numericCfg = card.normalizeCardConfig({
      baseline: { at: 0 },
      entities: [{ entity: 'sensor.row' }],
    });
    const entityCfg = card.normalizeCardConfig({
      baseline: { at: 'sensor.dynamic_baseline' },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(numericCfg.baseline.at).toMatchObject({ fixed: 0, entity: null });
    expect(entityCfg.baseline.at).toMatchObject({ fixed: null, entity: 'sensor.dynamic_baseline' });
  });

  it('normalizes baseline.at.value plus entity to baseline.at.fixed plus entity', () => {
    const card = createCard();
    card._hass.states = {
      'sensor.dynamic_baseline': { state: '15' },
    };

    const cfg = card.normalizeCardConfig({
      baseline: {
        at: {
          entity: 'sensor.dynamic_baseline',
          value: 5,
        },
      },
      entities: [{ entity: 'sensor.row' }],
    });
    const row = cfg.entities[0];

    expect(row.baseline.at).toEqual({
      fixed: 5,
      entity: 'sensor.dynamic_baseline',
    });
    expect(card._getNormalizedResolvableNumericValue(row.baseline.at)).toBe(15);

    delete card._hass.states['sensor.dynamic_baseline'];
    expect(card._getNormalizedResolvableNumericValue(row.baseline.at)).toBe(5);
  });

  it('accepts baseline.at.fixed directly', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      baseline: {
        at: {
          fixed: 0,
          entity: 'sensor.dynamic_baseline',
        },
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.entities[0].baseline.at).toEqual({
      fixed: 0,
      entity: 'sensor.dynamic_baseline',
    });
  });

  it('resolves structured baseline percent values against the active scale', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      scale: {
        min: { fixed: -100 },
        max: { fixed: 100 },
      },
      baseline: {
        at: {
          percent: 50,
        },
      },
      entities: [{ entity: 'sensor.row' }],
    });
    const row = cfg.entities[0];

    expect(row.baseline.at).toEqual({
      fixed: null,
      entity: null,
      percent: 50,
    });
    expect(card._getNormalizedResolvableNumericValue(row.baseline.at, -100, 100)).toBe(0);
    expect(card._resolveBaselinePct(row, -100, 100)).toBe(50);
  });

  it('triggers an update when a watched baseline entity appears after first render', () => {
    const card = createCard();
    card._config = card.normalizeCardConfig({
      baseline: 'sensor.dynamic_baseline',
      entities: [{ entity: 'sensor.row' }],
    });

    const oldHass = {
      states: {
        'sensor.row': { state: '10', attributes: {} },
      },
    };
    const newHass = {
      states: {
        'sensor.row': { state: '10', attributes: {} },
        'sensor.dynamic_baseline': { state: '15', attributes: {} },
      },
    };

    expect(card._shouldUpdate(oldHass, newHass)).toBe(true);
  });

  it('supports baseline direction color shorthand and expanded color objects', () => {
    const card = createCard();
    const shorthandCfg = card.normalizeCardConfig({
      baseline: {
        at: 0,
        above: '#34d399',
        below: '#ef4444',
      },
      entities: [{ entity: 'sensor.row' }],
    });
    const expandedCfg = card.normalizeCardConfig({
      baseline: {
        at: 0,
        above: { color: '#34d399' },
        below: { color: '#ef4444' },
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(shorthandCfg.baseline.above.color).toBe('#34d399');
    expect(shorthandCfg.baseline.below.color).toBe('#ef4444');
    expect(expandedCfg.baseline.above.color).toBe('#34d399');
    expect(expandedCfg.baseline.below.color).toBe('#ef4444');
  });

  it('converts scale values to percent and clamps out-of-range values', () => {
    const card = createCard();

    expect(card._toScalePct(-10, 0, 100)).toBe(0);
    expect(card._toScalePct(50, 0, 100)).toBe(50);
    expect(card._toScalePct(120, 0, 100)).toBe(100);
  });

  it('handles min == max safely when converting to percent', () => {
    const card = createCard();

    expect(card._toScalePct(25, 25, 25)).toBe(0);
    expect(card._toScalePct(30, 25, 25)).toBe(100);
  });

  it('does not classify unreliable widths as compressed density', () => {
    const card = createCard();

    expect(card._classifyCompactTier(0, 'normal')).toBe('normal');
    expect(card._classifyRowDensity(0, 'normal')).toBe('normal');
    expect(card._classifyLeftDensity(0, 'dense')).toBe('dense');
  });

  it('recalculates density correctly once a real width is available', () => {
    const card = createCard();

    expect(card._classifyRowDensity(0, 'normal')).toBe('normal');
    expect(card._classifyRowDensity(240, 'normal')).toBe('tight');
    expect(card._classifyLeftDensity(240, 'normal')).toBe('tight');
    expect(card._classifyCompactTier(240, 'normal')).toBe('tight');
  });

  it('still applies compressed density for genuinely narrow widths', () => {
    const card = createCard();

    expect(card._classifyRowDensity(120, 'normal')).toBe('compressed');
    expect(card._classifyLeftDensity(120, 'normal')).toBe('compressed');
    expect(card._classifyCompactTier(120, 'normal')).toBe('compressed');
  });

  it('keeps density scheduling state per instance', () => {
    const cardA = createCard();
    const cardB = createCard();

    cardA._densityPassScheduled = true;
    cardA._densityPassRetries = 2;

    expect(cardB._densityPassScheduled).toBe(false);
    expect(cardB._densityPassRetries).toBe(0);
  });

  it('keeps explicit height unchanged', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      height: 50,
      entities: [{ entity: 'sensor.row' }],
    });
    const mainLine = {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'compressed', rowDensity: 'compressed' },
    };

    expect(cfg.layout.height_explicit).toBe(true);
    expect(card._getEffectiveRowHeight(cfg.layout.height, cfg.layout.height_explicit, mainLine)).toBe(50);
  });

  it('shrinks default height for dense and compressed rows', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.layout.height_explicit).toBe(false);
    expect(card._getEffectiveRowHeight(cfg.layout.height, cfg.layout.height_explicit, {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'dense' },
    })).toBe(28);
    expect(card._getEffectiveRowHeight(cfg.layout.height, cfg.layout.height_explicit, {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'compressed' },
    })).toBe(24);
  });

  it('keeps default height at 38 for normal, compact, and tight rows', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      entities: [{ entity: 'sensor.row' }],
    });

    for (const density of ['normal', 'compact', 'tight']) {
      expect(card._getEffectiveRowHeight(cfg.layout.height, cfg.layout.height_explicit, {
        classList: { contains: (name) => name === 'left-mode' },
        dataset: { leftDensity: density },
      })).toBe(38);
    }
  });

  it('inside mode hides the label before the value and can hide the icon at compressed density', () => {
    const card = createCard();
    const mainLine = { dataset: { rowDensity: 'compressed' } };
    const track = { getBoundingClientRect: () => ({ width: 60 }) };
    const innerLabel = {
      dataset: {},
      closest: (selector) => (
        selector === '.bar-track' ? track
          : selector === '.main-line' ? mainLine
          : null
      ),
      querySelector: (selector) => (
        selector === '.inside-name' ? {}
          : selector === '.inside-value' ? { scrollWidth: 52 }
          : null
      ),
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.bar-inner-label' ? [innerLabel] : [],
      querySelector: () => null,
    };

    card._applyInsideLabelDensity();

    expect(innerLabel.dataset.insideDensity).toBe('compressed');
    expect(innerLabel.dataset.hideName).toBe('true');
    expect(mainLine.dataset.hideInsideIcon).toBe('true');
    expect(card._formatInsideValueMarkup('72', 'W')).toContain('<span class="inside-unit">W</span>');
  });

  it('inside mode hides the icon while keeping the value visible at dense density', () => {
    const card = createCard();
    const mainLine = { dataset: { rowDensity: 'dense' } };
    const track = { getBoundingClientRect: () => ({ width: 100 }) };
    const innerLabel = {
      dataset: {},
      closest: (selector) => (
        selector === '.bar-track' ? track
          : selector === '.main-line' ? mainLine
          : null
      ),
      querySelector: (selector) => (
        selector === '.inside-name' ? {}
          : selector === '.inside-value' ? { scrollWidth: 52 }
          : null
      ),
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.bar-inner-label' ? [innerLabel] : [],
      querySelector: () => null,
    };

    card._applyInsideLabelDensity();

    expect(innerLabel.dataset.insideDensity).toBe('dense');
    expect(innerLabel.dataset.hideName).toBe('true');
    expect(mainLine.dataset.hideInsideIcon).toBe('true');
    expect(card._formatInsideValueMarkup('72', 'W')).toContain('<span class="inside-unit">W</span>');
  });

  it('inside mode can keep the icon when inside label density is dense but row density is not narrow', () => {
    const card = createCard();
    const mainLine = { dataset: { rowDensity: 'tight' } };
    const track = { getBoundingClientRect: () => ({ width: 100 }) };
    const innerLabel = {
      dataset: {},
      closest: (selector) => (
        selector === '.bar-track' ? track
          : selector === '.main-line' ? mainLine
          : null
      ),
      querySelector: (selector) => (
        selector === '.inside-name' ? {}
          : selector === '.inside-value' ? { scrollWidth: 52 }
          : null
      ),
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.bar-inner-label' ? [innerLabel] : [],
      querySelector: () => null,
    };

    card._applyInsideLabelDensity();

    expect(innerLabel.dataset.insideDensity).toBe('dense');
    expect(innerLabel.dataset.hideName).toBe('true');
    expect(mainLine.dataset.hideInsideIcon).toBe('false');
  });

  it('above mode hides the label before the value at dense and compressed densities', () => {
    const card = createCard();
    const denseLabel = { dataset: {}, getBoundingClientRect: () => ({ width: 130 }) };
    const compressedLabel = { dataset: {}, getBoundingClientRect: () => ({ width: 100 }) };
    const denseLine = {
      dataset: {},
      querySelector: (selector) => selector === '.above-bar-label' ? denseLabel : null,
    };
    const compressedLine = {
      dataset: {},
      querySelector: (selector) => selector === '.above-bar-label' ? compressedLabel : null,
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.above-line' ? [denseLine, compressedLine] : [],
      querySelector: () => null,
    };

    card._applyAboveLabelDensity();

    expect(denseLine.dataset.aboveDensity).toBe('dense');
    expect(denseLabel.dataset.hideName).toBe('true');
    expect(compressedLine.dataset.aboveDensity).toBe('compressed');
    expect(compressedLabel.dataset.hideName).toBe('true');
    expect(card._formatAboveValueMarkup('72', 'W')).toContain('<span class="above-bar-label-unit">W</span>');
  });

  it('inside and above narrow-mode CSS preserves value priority', () => {
    const source = readFileSync(new URL('../../src/sensor-bar-card-plus.js', import.meta.url), 'utf8');

    expect(source).not.toContain('.bar-inner-label[data-inside-density="compressed"] {\n          display: none;');
    expect(source).toContain('.main-line.inside-mode[data-hide-inside-icon="true"] .icon-wrap');
    expect(source).toContain('margin-left: auto;');
    expect(source).not.toContain('.above-line[data-above-density="dense"] .above-bar-label-unit');
  });

  const makeLeftModeResponsiveFixture = ({
    text = 'Sensor',
    visibleChars = 6,
    clientWidth = 60,
    scrollWidth = 60,
    labelWidth = 20,
    rowWidth = 140,
    iconWidth = 28,
    valueWidth = 58,
    staleTopValue = false,
    previousForceTopValue = false,
    stalePriorityHidden = false,
    usefulnessHidden = false,
  } = {}) => {
    const card = createCard();
    card._measureVisibleLabelCharacters = () => visibleChars;
    card._measureValueMarkupWidth = () => valueWidth;

    const leftLabelText = {
      textContent: text,
      clientWidth,
      scrollWidth,
    };
    const leftLabel = {
      dataset: usefulnessHidden
        ? { hidden: 'true' }
        : stalePriorityHidden
          ? { priorityHidden: 'true' }
          : {},
      getBoundingClientRect: () => ({ width: labelWidth }),
    };
    const valueEl = {
      dataset: {
        display: encodeURIComponent('72'),
        unit: encodeURIComponent('W'),
      },
      style: {
        getPropertyValue: () => '0',
      },
      clientWidth: valueWidth,
    };
    const iconWrap = {
      getBoundingClientRect: () => ({ width: iconWidth }),
    };
    const rowStack = {
      dataset: {
        ...(staleTopValue ? { topValue: 'true' } : {}),
        ...(previousForceTopValue ? { forceTopValue: 'true' } : {}),
      },
      querySelector: (selector) => selector === '.top-right-value' ? topValue : null,
    };
    const topValue = {
      dataset: staleTopValue ? { active: 'true' } : {},
      innerHTML: '',
    };
    const mainLine = {
      dataset: { leftDensity: 'normal', rowDensity: 'normal' },
      classList: {
        contains: (name) => name === 'left-mode',
      },
      getBoundingClientRect: () => ({ width: rowWidth }),
      closest: (selector) => selector === '.row-stack' ? rowStack : null,
      querySelector: (selector) => (
        selector === '.label-left' ? leftLabel
          : selector === '.label-left-text' ? leftLabelText
          : selector === '.value-right' ? valueEl
          : selector === '.icon-wrap' ? iconWrap
          : null
      ),
    };
    const row = {
      querySelector: (selector) => (
        selector === '.main-line' ? mainLine
          : selector === '.label-left' ? leftLabel
          : selector === '.label-left-text' ? leftLabelText
          : selector === '.value-right' ? valueEl
          : selector === '.icon-wrap' ? iconWrap
          : selector === '.row-stack' ? rowStack
          : null
      ),
    };

    return { card, row, mainLine, rowStack, leftLabel, leftLabelText, valueEl, iconWrap, topValue };
  };

  it('keeps short useful left labels visible even when the bar is below the minimum share', () => {
    const { card, row, rowStack, leftLabel, mainLine } = makeLeftModeResponsiveFixture();
    card._ensureMinimumBarShare([row]);

    expect(leftLabel.dataset.priorityHidden).toBeUndefined();
    expect(rowStack.dataset.forceTopValue).toBe('true');
    expect(mainLine.dataset.hideLeftIcon).toBeUndefined();
  });

  it('keeps fully visible Active labels visible on wide rows', () => {
    const { card, row, rowStack, leftLabel, mainLine } = makeLeftModeResponsiveFixture({
      text: 'Active',
      rowWidth: 264,
    });
    card._ensureMinimumBarShare([row]);

    expect(leftLabel.dataset.priorityHidden).toBeUndefined();
    expect(rowStack.dataset.forceTopValue).toBeUndefined();
    expect(mainLine.dataset.hideLeftIcon).toBeUndefined();
  });

  it('keeps fully visible long left labels visible even when they are wide', () => {
    const { card, row, rowStack, leftLabel } = makeLeftModeResponsiveFixture({
      text: 'Long battery name label',
      visibleChars: 18,
      clientWidth: 120,
      scrollWidth: 120,
      labelWidth: 40,
      rowWidth: 180,
    });
    card._ensureMinimumBarShare([row]);

    expect(leftLabel.dataset.priorityHidden).toBeUndefined();
    expect(rowStack.dataset.forceTopValue).toBe('true');
  });

  it('keeps useful truncated labels with at least five visible characters visible', () => {
    const { card, row, rowStack, leftLabel } = makeLeftModeResponsiveFixture({
      text: 'Watertemperatuur',
      visibleChars: 6,
      clientWidth: 70,
      scrollWidth: 140,
      labelWidth: 28,
      rowWidth: 150,
    });
    card._ensureMinimumBarShare([row]);

    expect(leftLabel.dataset.priorityHidden).toBeUndefined();
    expect(rowStack.dataset.forceTopValue).toBe('true');
  });

  it('hides badly truncated labels with fewer than five visible characters only when barShare is below 0.66', () => {
    const { card, row, leftLabel, rowStack } = makeLeftModeResponsiveFixture({
      text: 'Move current telemetry',
      visibleChars: 4,
      clientWidth: 52,
      scrollWidth: 140,
      labelWidth: 26,
      rowWidth: 138,
    });
    card._ensureMinimumBarShare([row]);

    expect(leftLabel.dataset.priorityHidden).toBe('true');
    expect(rowStack.dataset.forceTopValue).toBe('true');
  });

  it('above-mode keeps fully visible labels and continues to icon sacrifice when needed', () => {
    const card = createCard();
    card._measureVisibleLabelCharacters = () => 12;
    const aboveName = {
      textContent: 'Long battery name',
      clientWidth: 80,
      scrollWidth: 80,
      getBoundingClientRect: () => ({ width: 30 }),
    };
    const aboveLabel = { dataset: {} };
    const aboveLine = { dataset: {} };
    const mainLine = {
      dataset: {},
      classList: {
        contains: (name) => name === 'above-mode',
      },
      getBoundingClientRect: () => ({ width: 120 }),
    };
    const track = {
      getBoundingClientRect: () => {
        let width = 50;
        if (mainLine.dataset.hideAboveIcon === 'true') width = 82;
        return { width };
      },
    };
    const row = {
      querySelector: (selector) => (
        selector === '.main-line' ? mainLine
          : selector === '.bar-track' ? track
          : selector === '.above-bar-label' ? aboveLabel
          : selector === '.above-bar-label-name' ? aboveName
          : selector === '.above-line' ? aboveLine
          : null
      ),
    };

    card._ensureMinimumBarShare([row]);

    expect(aboveLabel.dataset.priorityHideName).toBeUndefined();
    expect(mainLine.dataset.hideAboveIcon).toBe('true');
    expect(aboveLine.dataset.hideAboveIcon).toBe('true');
  });

  it('inside-mode keeps fully visible labels and continues to icon sacrifice when needed', () => {
    const card = createCard();
    card._measureVisibleLabelCharacters = () => 12;
    const insideName = {
      textContent: 'Long battery name',
      clientWidth: 70,
      scrollWidth: 70,
      getBoundingClientRect: () => ({ width: 30 }),
    };
    const innerLabel = { dataset: {} };
    const mainLine = {
      dataset: {},
      classList: {
        contains: (name) => name === 'inside-mode',
      },
      getBoundingClientRect: () => ({ width: 120 }),
    };
    const track = {
      getBoundingClientRect: () => {
        let width = 50;
        if (mainLine.dataset.hideInsideIcon === 'true') width = 82;
        return { width };
      },
    };
    const row = {
      querySelector: (selector) => (
        selector === '.main-line' ? mainLine
          : selector === '.bar-track' ? track
          : selector === '.bar-inner-label' ? innerLabel
          : selector === '.inside-name' ? insideName
          : null
      ),
    };

    card._ensureMinimumBarShare([row]);

    expect(innerLabel.dataset.priorityHideName).toBeUndefined();
    expect(mainLine.dataset.hideInsideIcon).toBe('true');
  });

  it('does nothing when the bar already meets the minimum share', () => {
    const { card, row, leftLabel, rowStack, mainLine } = makeLeftModeResponsiveFixture({
      rowWidth: 264,
    });
    card._ensureMinimumBarShare([row]);

    expect(leftLabel.dataset.priorityHidden).toBeUndefined();
    expect(rowStack.dataset.forceTopValue).toBeUndefined();
    expect(mainLine.dataset.hideLeftIcon).toBeUndefined();
  });

  it('clears and recalculates priority-hidden flags between passes', () => {
    const { card, row, leftLabel, leftLabelText, rowStack } = makeLeftModeResponsiveFixture({
      text: 'Move current telemetry',
      visibleChars: 4,
      clientWidth: 52,
      scrollWidth: 140,
      labelWidth: 26,
      rowWidth: 138,
    });
    card._measureVisibleLabelCharacters = (_el, text) => text === 'Sensor' ? 6 : 4;
    card._ensureMinimumBarShare([row]);
    expect(leftLabel.dataset.priorityHidden).toBe('true');

    leftLabelText.textContent = 'Sensor';
    leftLabelText.clientWidth = 60;
    leftLabelText.scrollWidth = 60;
    leftLabel.getBoundingClientRect = () => ({ width: 20 });
    card._ensureMinimumBarShare([row]);

    expect(leftLabel.dataset.priorityHidden).toBeUndefined();
    expect(rowStack.dataset.forceTopValue).toBe('true');
  });

  it('chooses the same left-mode state for equal-width rows with the same inputs', () => {
    const a = makeLeftModeResponsiveFixture({ rowWidth: 150, labelWidth: 28 });
    const b = makeLeftModeResponsiveFixture({ rowWidth: 150, labelWidth: 28 });

    expect(a.card._chooseLeftModeResponsiveState(a.row)).toEqual(b.card._chooseLeftModeResponsiveState(b.row));
  });

  it('ignores stale top-right DOM state when choosing the left-mode state', () => {
    const clean = makeLeftModeResponsiveFixture({ rowWidth: 150, labelWidth: 28 });
    const stale = makeLeftModeResponsiveFixture({ rowWidth: 150, labelWidth: 28, staleTopValue: true });

    expect(clean.card._chooseLeftModeResponsiveState(clean.row)).toEqual(stale.card._chooseLeftModeResponsiveState(stale.row));
  });

  it('ignores stale priority-hidden label state when choosing the left-mode state', () => {
    const clean = makeLeftModeResponsiveFixture({ rowWidth: 150, labelWidth: 28 });
    const stale = makeLeftModeResponsiveFixture({ rowWidth: 150, labelWidth: 28, stalePriorityHidden: true });

    expect(clean.card._chooseLeftModeResponsiveState(clean.row)).toEqual(stale.card._chooseLeftModeResponsiveState(stale.row));
  });

  it('transitions predictably through left-mode states as row width shrinks', () => {
    const wide = makeLeftModeResponsiveFixture({ rowWidth: 264, labelWidth: 20 });
    const medium = makeLeftModeResponsiveFixture({ rowWidth: 140, labelWidth: 20 });
    const narrow = makeLeftModeResponsiveFixture({ rowWidth: 71, labelWidth: 20 });

    expect(wide.card._chooseLeftModeResponsiveState(wide.row)).toMatchObject({ hideLabel: false, topValue: false, hideIcon: false });
    expect(medium.card._chooseLeftModeResponsiveState(medium.row)).toMatchObject({ hideLabel: false, topValue: true, hideIcon: false });
    expect(narrow.card._chooseLeftModeResponsiveState(narrow.row)).toMatchObject({ hideLabel: true, topValue: true, hideIcon: true });
  });

  it('reverses left-mode states predictably as row width widens', () => {
    const narrow = makeLeftModeResponsiveFixture({ rowWidth: 71, labelWidth: 20 });
    const medium = makeLeftModeResponsiveFixture({ rowWidth: 140, labelWidth: 20 });
    const wide = makeLeftModeResponsiveFixture({ rowWidth: 264, labelWidth: 20 });

    expect(narrow.card._chooseLeftModeResponsiveState(narrow.row)).toMatchObject({ hideLabel: true, topValue: true, hideIcon: true });
    expect(medium.card._chooseLeftModeResponsiveState(medium.row)).toMatchObject({ hideLabel: false, topValue: true, hideIcon: false });
    expect(wide.card._chooseLeftModeResponsiveState(wide.row)).toMatchObject({ hideLabel: false, topValue: false, hideIcon: false });
  });

  it('keeps inline when previous state was inline and predicted share is 0.49 or 0.50', () => {
    const at049 = makeLeftModeResponsiveFixture({ rowWidth: 255, labelWidth: 20 });
    const at050 = makeLeftModeResponsiveFixture({ rowWidth: 260, labelWidth: 20 });

    expect(at049.card._chooseLeftModeResponsiveState(at049.row)).toMatchObject({ topValue: false });
    expect(at050.card._chooseLeftModeResponsiveState(at050.row)).toMatchObject({ topValue: false });
  });

  it('switches to top-right when previous state was inline and predicted share falls below 0.48', () => {
    const below048 = makeLeftModeResponsiveFixture({ rowWidth: 248, labelWidth: 20 });

    expect(below048.card._chooseLeftModeResponsiveState(below048.row)).toMatchObject({ topValue: true });
  });

  it('keeps top-right when previous state was top-right and predicted share is 0.50 or 0.51', () => {
    const at050 = makeLeftModeResponsiveFixture({ rowWidth: 260, labelWidth: 20, previousForceTopValue: true });
    const at051 = makeLeftModeResponsiveFixture({ rowWidth: 266, labelWidth: 20, previousForceTopValue: true });

    expect(at050.card._chooseLeftModeResponsiveState(at050.row)).toMatchObject({ topValue: true });
    expect(at051.card._chooseLeftModeResponsiveState(at051.row)).toMatchObject({ topValue: true });
  });

  it('switches back inline when previous state was top-right and predicted share is above 0.52', () => {
    const above052 = makeLeftModeResponsiveFixture({ rowWidth: 276, labelWidth: 20, previousForceTopValue: true });

    expect(above052.card._chooseLeftModeResponsiveState(above052.row)).toMatchObject({ topValue: false });
  });

  it('does not oscillate when predicted share bounces around 0.50', () => {
    const keepInline = makeLeftModeResponsiveFixture({ rowWidth: 255, labelWidth: 20 });
    const switchTop = makeLeftModeResponsiveFixture({ rowWidth: 248, labelWidth: 20 });
    const keepTop = makeLeftModeResponsiveFixture({ rowWidth: 266, labelWidth: 20, previousForceTopValue: true });
    const switchBackInline = makeLeftModeResponsiveFixture({ rowWidth: 276, labelWidth: 20, previousForceTopValue: true });

    expect(keepInline.card._chooseLeftModeResponsiveState(keepInline.row)).toMatchObject({ topValue: false });
    expect(switchTop.card._chooseLeftModeResponsiveState(switchTop.row)).toMatchObject({ topValue: true });
    expect(keepTop.card._chooseLeftModeResponsiveState(keepTop.row)).toMatchObject({ topValue: true });
    expect(switchBackInline.card._chooseLeftModeResponsiveState(switchBackInline.row)).toMatchObject({ topValue: false });
  });

  it('keeps short complete left labels visible', () => {
    const card = createCard();

    expect(card._shouldHideLeftLabel('EV', 20, 20, 2)).toBe(false);
    expect(card._shouldHideLeftLabel('CPU', 30, 30, 3)).toBe(false);
  });

  it('hides truncated left labels when fewer than five visible characters remain', () => {
    const card = createCard();

    expect(card._shouldHideLeftLabel('SensorLabel', 100, 52, 4)).toBe(true);
    expect(card._shouldHideLeftLabel('BatteryLabel', 120, 62, 4)).toBe(true);
    expect(card._shouldHideLeftLabel('SensorLabel', 100, 62, 5)).toBe(false);
  });

  it('applies the same left-label usefulness rule with and without an icon', () => {
    const card = createCard();
    card._measureTextWidthWithStyles = (_el, text) => (text === '...' ? 12 : text.length * 10);
    const wrapWithIcon = { dataset: {} };
    const wrapWithoutIcon = { dataset: {} };
    const labelWithIcon = { textContent: 'SensorLabel', scrollWidth: 100, clientWidth: 52 };
    const labelWithoutIcon = { textContent: 'SensorLabel', scrollWidth: 100, clientWidth: 52 };
    const lineWithIcon = {
      querySelector: (selector) => (
        selector === '.label-left' ? wrapWithIcon
          : selector === '.label-left-text' ? labelWithIcon
          : selector === '.icon-wrap' ? {}
          : null
      ),
    };
    const lineWithoutIcon = {
      querySelector: (selector) => (
        selector === '.label-left' ? wrapWithoutIcon
          : selector === '.label-left-text' ? labelWithoutIcon
          : null
      ),
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.main-line.left-mode' ? [lineWithIcon, lineWithoutIcon] : [],
      querySelector: () => null,
    };

    card._applyLeftLabelUsefulness();

    expect(wrapWithIcon.dataset.hidden).toBe('true');
    expect(wrapWithoutIcon.dataset.hidden).toBe('true');
  });

  it('does not hide wide left labels that fit normally', () => {
    const card = createCard();
    card._measureTextWidthWithStyles = (_el, text) => (text === '...' ? 12 : text.length * 10);
    const wrap = { dataset: {} };
    const label = { textContent: 'Battery', scrollWidth: 70, clientWidth: 70 };
    const line = {
      querySelector: (selector) => (
        selector === '.label-left' ? wrap
          : selector === '.label-left-text' ? label
          : null
      ),
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.main-line.left-mode' ? [line] : [],
      querySelector: () => null,
    };

    card._applyLeftLabelUsefulness();

    expect(wrap.dataset.hidden).toBe('false');
  });

  it('does not activate the top-right value row from left density alone', () => {
    const card = createCard();

    expect(card._shouldUseTopValueRow({
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'dense' },
      closest: () => ({ dataset: {} }),
    })).toBe(false);
    expect(card._shouldUseTopValueRow({
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'compressed' },
      closest: () => ({ dataset: {} }),
    })).toBe(false);
  });

  it('activates the top-right value row only when forceTopValue is set', () => {
    const card = createCard();

    expect(card._shouldUseTopValueRow({
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'normal' },
      closest: () => ({ dataset: { forceTopValue: 'true' } }),
    })).toBe(true);
    expect(card._shouldUseTopValueRow({
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'compressed' },
      closest: () => ({ dataset: { forceTopValue: 'true' } }),
    })).toBe(true);
    expect(card._shouldUseTopValueRow({
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'tight' },
      closest: () => ({ dataset: {} }),
    })).toBe(false);
  });

  it('clears stale top-right presentation when forceTopValue is not set', () => {
    const card = createCard();
    const { mainLine, rowStack, topValue } = makeLeftModeResponsiveFixture({ staleTopValue: true });

    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.main-line.left-mode' ? [mainLine] : [],
      querySelector: () => null,
    };

    card._applyTopRightValueLayout();

    expect(rowStack.dataset.topValue).toBe('false');
    expect(topValue.dataset.active).toBe('false');
  });

  it('applies final top-right presentation in the same post-layout pass when forceTopValue is chosen', () => {
    const card = createCard();
    const { row, mainLine, rowStack, topValue } = makeLeftModeResponsiveFixture({ rowWidth: 140, labelWidth: 20 });
    const originalRaf = globalThis.requestAnimationFrame;

    card._applyRowDensity = () => {};
    card._applyLeftModeDensity = () => {};
    card._applyAboveLabelDensity = () => {};
    card._applyInsideLabelDensity = () => {};
    card._applyValueWidthReservation = () => {};
    card._applyAdaptiveRowHeight = () => {};
    card._applyValueVisibility = () => {};
    card._applyLeftLabelUsefulness = () => {};
    card._positionTargetLabel = () => {};
    card.shadowRoot = {
      querySelectorAll: (selector) => (
        selector === '.row[data-entity]' ? [row]
          : selector === '.main-line.left-mode' ? [mainLine]
          : []
      ),
      querySelector: () => null,
    };

    globalThis.requestAnimationFrame = (cb) => {
      cb();
      return 1;
    };

    try {
      card._runPostLayoutPasses([row]);
    } finally {
      globalThis.requestAnimationFrame = originalRaf;
    }

    expect(rowStack.dataset.forceTopValue).toBe('true');
    expect(rowStack.dataset.topValue).toBe('true');
    expect(topValue.dataset.active).toBe('true');
  });

  it('hides a left label that becomes badly truncated after final responsive layout is applied', () => {
    const card = createCard();
    const originalRaf = globalThis.requestAnimationFrame;
    card._measureTextWidthWithStyles = (_el, text) => (text === '...' ? 12 : text.length * 10);

    const leftLabelText = {
      textContent: 'Sensor',
      clientWidth: 60,
      scrollWidth: 60,
    };
    const leftLabel = { dataset: {} };
    const valueEl = {
      dataset: {
        display: encodeURIComponent('72'),
        unit: encodeURIComponent('W'),
      },
      innerHTML: '',
      style: { setProperty() {}, getPropertyValue: () => '0' },
      clientWidth: 58,
    };
    const topValue = { dataset: {}, innerHTML: '' };
    const rowStack = {
      dataset: {},
      querySelector: (selector) => selector === '.top-right-value' ? topValue : null,
    };
    const mainLine = {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'normal', rowDensity: 'normal' },
      closest: (selector) => selector === '.row-stack' ? rowStack : null,
      querySelector: (selector) => (
        selector === '.label-left' ? leftLabel
          : selector === '.label-left-text' ? leftLabelText
          : selector === '.value-right' ? valueEl
          : null
      ),
    };
    const row = {
      querySelector: (selector) => (
        selector === '.main-line' ? mainLine
          : selector === '.label-left' ? leftLabel
          : selector === '.label-left-text' ? leftLabelText
          : selector === '.value-right' ? valueEl
          : selector === '.row-stack' ? rowStack
          : null
      ),
    };

    card._applyRowDensity = () => {};
    card._applyLeftModeDensity = () => {};
    card._applyAboveLabelDensity = () => {};
    card._applyInsideLabelDensity = () => {};
    card._applyValueWidthReservation = () => {};
    card._applyAdaptiveRowHeight = () => {};
    card._applyValueVisibility = () => {};
    card._positionTargetLabel = () => {};
    card._ensureMinimumBarShare = () => {
      leftLabelText.clientWidth = 18;
      leftLabelText.scrollWidth = 60;
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => (
        selector === '.row[data-entity]' ? [row]
          : selector === '.main-line.left-mode' ? [mainLine]
          : selector === '.value-right' ? [valueEl]
          : []
      ),
      querySelector: () => null,
    };

    globalThis.requestAnimationFrame = (cb) => {
      cb();
      return 1;
    };

    try {
      card._runPostLayoutPasses([row]);
    } finally {
      globalThis.requestAnimationFrame = originalRaf;
    }

    expect(leftLabel.dataset.hidden).toBe('true');
  });

  it('keeps a left label visible when final layout still shows at least five useful characters', () => {
    const card = createCard();
    const originalRaf = globalThis.requestAnimationFrame;
    card._measureTextWidthWithStyles = (_el, text) => (text === '...' ? 12 : text.length * 10);

    const leftLabelText = {
      textContent: 'Watertemperatuur',
      clientWidth: 160,
      scrollWidth: 160,
    };
    const leftLabel = { dataset: {} };
    const valueEl = {
      dataset: {
        display: encodeURIComponent('72'),
        unit: encodeURIComponent('W'),
      },
      innerHTML: '',
      style: { setProperty() {}, getPropertyValue: () => '0' },
      clientWidth: 58,
    };
    const topValue = { dataset: {}, innerHTML: '' };
    const rowStack = {
      dataset: { forceTopValue: 'true' },
      querySelector: (selector) => selector === '.top-right-value' ? topValue : null,
    };
    const mainLine = {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'normal', rowDensity: 'normal' },
      closest: (selector) => selector === '.row-stack' ? rowStack : null,
      querySelector: (selector) => (
        selector === '.label-left' ? leftLabel
          : selector === '.label-left-text' ? leftLabelText
          : selector === '.value-right' ? valueEl
          : null
      ),
    };
    const row = {
      querySelector: (selector) => (
        selector === '.main-line' ? mainLine
          : selector === '.label-left' ? leftLabel
          : selector === '.label-left-text' ? leftLabelText
          : selector === '.value-right' ? valueEl
          : selector === '.row-stack' ? rowStack
          : null
      ),
    };

    card._applyRowDensity = () => {};
    card._applyLeftModeDensity = () => {};
    card._applyAboveLabelDensity = () => {};
    card._applyInsideLabelDensity = () => {};
    card._applyValueWidthReservation = () => {};
    card._applyAdaptiveRowHeight = () => {};
    card._applyValueVisibility = () => {};
    card._positionTargetLabel = () => {};
    card._ensureMinimumBarShare = () => {
      leftLabelText.clientWidth = 82;
      leftLabelText.scrollWidth = 160;
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => (
        selector === '.row[data-entity]' ? [row]
          : selector === '.main-line.left-mode' ? [mainLine]
          : selector === '.value-right' ? [valueEl]
          : []
      ),
      querySelector: () => null,
    };

    globalThis.requestAnimationFrame = (cb) => {
      cb();
      return 1;
    };

    try {
      card._runPostLayoutPasses([row]);
    } finally {
      globalThis.requestAnimationFrame = originalRaf;
    }

    expect(leftLabel.dataset.hidden).toBe('false');
    expect(rowStack.dataset.topValue).toBe('true');
    expect(topValue.dataset.active).toBe('true');
  });

  it('keeps value and unit together in the top-right row', () => {
    const card = createCard();
    const html = card._buildRow(
      {
        entity: 'sensor.row',
        name: 'Sensor',
        icon: 'mdi:flash',
        layout: { label: { position: 'left', width: 160 }, height: 38 },
        bar: { color_mode: 'single', fill_style: 'solid', color: '#2563eb', animated: true, solid_fill: false },
        target_marker: { source: { fixed: null, entity: null }, color: '#888', show_label: false },
        peak_marker: { show: false, color: '#888' },
        baseline: { at: { fixed: null, entity: null }, above: { color: null }, below: { color: null } },
      },
      '72',
      'W',
      50,
      '#2563eb',
      null,
      null,
      null,
      null,
      '#888',
      '#888',
      0,
      100
    );

    expect(html).toContain('class="top-right-value"');
    expect(html).toContain('72');
    expect(html).toContain('<span class="unit">W</span>');
  });

  it('keeps full value and unit inline instead of hiding the unit', () => {
    const card = createCard();
    const valueEl = {
      dataset: {
        display: encodeURIComponent('72'),
        unit: encodeURIComponent('W'),
        hideUnit: 'true',
      },
      innerHTML: '',
    };

    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.value-right' ? [valueEl] : [],
      querySelector: () => null,
    };

    card._applyValueVisibility();

    expect(valueEl.dataset.hideUnit).toBe('false');
    expect(valueEl.innerHTML).toContain('72');
    expect(valueEl.innerHTML).toContain('<span class="unit">W</span>');
  });

  it('reserves the full inline value width instead of capping extra width', () => {
    const card = createCard();
    card._measureValueMarkupWidth = () => 90;
    card._getNumericStyleValue = () => 42;
    const valueEl = {
      dataset: {
        display: encodeURIComponent('72'),
        unit: encodeURIComponent('kWh'),
      },
      clientWidth: 0,
      style: {},
    };

    expect(card._getReservedInlineValueWidth(valueEl)).toBe(92);
  });

  it('chooses top-right for constrained left rows rather than hiding the unit', () => {
    const { card, row, rowStack } = makeLeftModeResponsiveFixture({
      rowWidth: 140,
      labelWidth: 20,
      valueWidth: 88,
    });

    card._ensureMinimumBarShare([row]);

    expect(rowStack.dataset.forceTopValue).toBe('true');
  });

  it('applies top-right value layout regardless of icon presence once forceTopValue is active', () => {
    const card = createCard();
    const makeTopValue = () => ({ dataset: {}, innerHTML: '' });
    const makeInlineValue = () => ({
      dataset: {
        display: encodeURIComponent('72'),
        unit: encodeURIComponent('W'),
      },
    });
    const makeRowStack = (topValue) => ({
      dataset: { forceTopValue: 'true' },
      querySelector: (selector) => selector === '.top-right-value' ? topValue : null,
    });
    const denseWithIconTop = makeTopValue();
    const denseNoIconTop = makeTopValue();
    const denseWithIconInline = makeInlineValue();
    const denseNoIconInline = makeInlineValue();
    const denseWithIconStack = makeRowStack(denseWithIconTop);
    const denseNoIconStack = makeRowStack(denseNoIconTop);
    const denseWithIconLine = {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'dense' },
      closest: (selector) => selector === '.row-stack' ? denseWithIconStack : null,
      querySelector: (selector) => (
        selector === '.value-right' ? denseWithIconInline
          : selector === '.icon-wrap' ? {}
          : null
      ),
    };
    const denseNoIconLine = {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'dense' },
      closest: (selector) => selector === '.row-stack' ? denseNoIconStack : null,
      querySelector: (selector) => (
        selector === '.value-right' ? denseNoIconInline
          : null
      ),
    };

    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.main-line.left-mode' ? [denseWithIconLine, denseNoIconLine] : [],
      querySelector: () => null,
    };

    card._applyTopRightValueLayout();

    expect(denseWithIconStack.dataset.topValue).toBe('true');
    expect(denseNoIconStack.dataset.topValue).toBe('true');
    expect(denseWithIconTop.dataset.active).toBe('true');
    expect(denseNoIconTop.dataset.active).toBe('true');
    expect(denseWithIconTop.innerHTML).toContain('<span class="unit">W</span>');
    expect(denseNoIconTop.innerHTML).toContain('<span class="unit">W</span>');
  });

  it('keeps top-right value layout working with adaptive height when forceTopValue is active', () => {
    const card = createCard();
    const topValue = { dataset: {}, innerHTML: '' };
    const inlineValue = {
      dataset: {
        display: encodeURIComponent('72'),
        unit: encodeURIComponent('W'),
      },
      style: {},
    };
    const labelLeft = { style: {} };
    const iconWrap = { style: {} };
    const track = { style: {} };
    const rowStack = {
      dataset: { forceTopValue: 'true' },
      style: {
        setProperty(name, value) {
          this[name] = value;
        },
      },
      querySelector: (selector) => selector === '.top-right-value' ? topValue : null,
    };
    const mainLine = {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'dense', rowDensity: 'dense' },
      style: {},
      closest: (selector) => selector === '.row-stack' ? rowStack : null,
      querySelector: (selector) => (
        selector === '.value-right' ? inlineValue
          : selector === '.label-left' ? labelLeft
          : selector === '.icon-wrap' ? iconWrap
          : selector === '.bar-track' ? track
          : null
      ),
    };
    const row = {
      dataset: { entity: 'sensor.row', baseHeight: '38', heightExplicit: 'false' },
      style: { setProperty(name, value) { this[name] = value; } },
      querySelector: (selector) => (
        selector === '.main-line' ? mainLine
          : selector === '.row-stack' ? rowStack
          : null
      ),
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => {
        if (selector === '.row[data-entity]') return [row];
        if (selector === '.main-line.left-mode') return [mainLine];
        return [];
      },
      querySelector: () => null,
    };

    card._applyAdaptiveRowHeight();
    card._applyTopRightValueLayout();

    expect(row.style['--sbcp-row-height']).toBe('28px');
    expect(rowStack.style['--sbcp-row-height']).toBe('28px');
    expect(mainLine.style.height).toBe('28px');
    expect(rowStack.dataset.topValue).toBe('true');
    expect(topValue.dataset.active).toBe('true');
    expect(topValue.innerHTML).toContain('<span class="unit">W</span>');
  });

  it('uses the same adaptive 24px height on row-stack and track for compressed rows', () => {
    const card = createCard();
    const track = { style: {} };
    const rowStack = {
      style: {
        setProperty(name, value) {
          this[name] = value;
        },
      },
    };
    const mainLine = {
      classList: { contains: (name) => name === 'left-mode' },
      dataset: { leftDensity: 'compressed', rowDensity: 'compressed' },
      style: {},
      querySelector: (selector) => (
        selector === '.bar-track' ? track
          : null
      ),
    };
    const row = {
      dataset: { entity: 'sensor.row', baseHeight: '38', heightExplicit: 'false' },
      style: {
        setProperty(name, value) {
          this[name] = value;
        },
      },
      querySelector: (selector) => (
        selector === '.main-line' ? mainLine
          : selector === '.row-stack' ? rowStack
          : null
      ),
    };
    card.shadowRoot = {
      querySelectorAll: (selector) => selector === '.row[data-entity]' ? [row] : [],
      querySelector: () => null,
    };

    card._applyAdaptiveRowHeight();

    expect(row.style['--sbcp-row-height']).toBe('24px');
    expect(rowStack.style['--sbcp-row-height']).toBe('24px');
    expect(mainLine.style.height).toBe('24px');
    expect(track.style.height).toBe('24px');
  });

  it('calculates baseline intervals at min, center, max, 10%, and 75%', () => {
    const card = createCard();

    expect(card._getNormalizedPercent(70, 0)).toMatchObject({ start: 0, end: 70, positive: true });
    expect(card._getNormalizedPercent(95, 10)).toMatchObject({ start: 10, end: 95, positive: true });
    expect(card._getNormalizedPercent(80, 50)).toMatchObject({ start: 50, end: 80, positive: true });
    expect(card._getNormalizedPercent(35, 75)).toMatchObject({ start: 35, end: 75, positive: false });
    expect(card._getNormalizedPercent(20, 100)).toMatchObject({ start: 20, end: 100, positive: false });
  });

  it('handles value above, below, and equal to baseline', () => {
    const card = createCard();

    expect(card._getNormalizedPercent(80, 50)).toMatchObject({ start: 50, end: 80, positive: true, hidden: false });
    expect(card._getNormalizedPercent(20, 50)).toMatchObject({ start: 20, end: 50, positive: false, hidden: false });
    expect(card._getNormalizedPercent(50, 50)).toMatchObject({ start: 50, end: 50, hidden: true });
  });

  it('distinguishes value endpoints from baseline endpoints', () => {
    const card = createCard();

    expect(card._getEndpointSemantics(card._getNormalizedPercent(80, null))).toMatchObject({
      left: 'scale',
      right: 'value',
    });
    expect(card._getEndpointSemantics(card._getNormalizedPercent(80, 50))).toMatchObject({
      left: 'baseline',
      right: 'value',
    });
    expect(card._getEndpointSemantics(card._getNormalizedPercent(20, 50))).toMatchObject({
      left: 'value',
      right: 'baseline',
    });
  });

  it('builds a single reveal shape with semantic endpoint radii', () => {
    const card = createCard();
    const normalReveal = card._getRevealShapeStyle(card._getNormalizedPercent(75, null), 38);
    const baselinePositiveReveal = card._getRevealShapeStyle(card._getNormalizedPercent(75, 25), 38);
    const baselineNegativeReveal = card._getRevealShapeStyle(card._getNormalizedPercent(25, 75), 38);

    expect(normalReveal).toContain('clip-path:inset(0 25% 0 0% round 6px 6px 6px 6px)');
    expect(baselinePositiveReveal).toContain('clip-path:inset(0 25% 0 25% round 0 6px 6px 0)');
    expect(baselineNegativeReveal).toContain('clip-path:inset(0 25% 0 25% round 6px 0 0 6px)');
  });

  it('integrates above-target color into the full-width paint layer regardless of current value', () => {
    const card = createCard();
    const ecfg = card.normalizeCardConfig({
      color_mode: 'gradient',
      gradient_stops: [
        { pos: 0, color: '#2563eb' },
        { pos: 100, color: '#dc2626' },
      ],
      above_target_color: '#ef4444',
      min: -100,
      max: 100,
      baseline: { at: 0 },
      target: 60,
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    const targetPct = card._toScalePct(60, -100, 100);
    const baselinePct = card._toScalePct(0, -100, 100);
    const paintStyleAbove = card._getFullScalePaintStyle(ecfg, '#dc2626', targetPct, baselinePct);
    const paintStyleBelow = card._getFullScalePaintStyle(ecfg, '#2563eb', targetPct, baselinePct);

    expect(paintStyleAbove).toContain('#ef4444');
    expect(paintStyleAbove).toContain(`transparent ${targetPct}%`);
    expect(paintStyleBelow).toContain('#ef4444');
    expect(paintStyleBelow).toContain(`transparent ${targetPct}%`);
  });

  it('keeps very small reveal intervals as tiny clipped windows on full-width paint', () => {
    const card = createCard();
    const reveal = card._getRevealShapeStyle({ start: 49, end: 50, hidden: false, usesBaseline: true, positive: true }, 38);

    expect(reveal).toContain('clip-path:inset(0 50% 0 49%');
  });

  it('formats numeric displays with decimal precision', () => {
    const card = createCard();

    expect(card._formatNumericDisplay(12.345, 0)).toBe('12');
    expect(card._formatNumericDisplay(12.345, 1)).toMatch(/^12[.,]3$/);
    expect(card._formatNumericDisplay(12.345, 2)).toMatch(/^12[.,]35$/);
    expect(card._formatDisplayWithUnit('12.3', 'W')).toBe('12.3 W');
    expect(card._formatDisplayWithUnit('43', 's')).toBe('43s');
  });

  it('does not crash on non-numeric state formatting', () => {
    const card = createCard();

    expect(card._formatNumericDisplay(Number.NaN, 1)).toBe('NaN');
    expect(card._getNumericValue('unknown')).toBeNull();
    expect(card._getNumericValue('', null)).toBeNull();
  });

  it('computes target percentages in the same global coordinate space', () => {
    const card = createCard();

    expect(card._toScalePct(0, -2000, 5000)).toBeCloseTo(28.5714, 3);
    expect(card._toScalePct(3500, -2000, 5000)).toBeCloseTo(78.5714, 3);
  });

  it('normalizes legacy dynamic min and max to fixed plus entity', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      min: 50,
      min_entity: 'sensor.dynamic_min',
      max: 3000,
      max_entity: 'sensor.dynamic_max',
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.scale.min).toEqual({ fixed: 50, entity: 'sensor.dynamic_min' });
    expect(cfg.scale.max).toEqual({ fixed: 3000, entity: 'sensor.dynamic_max' });
  });

  it('normalizes legacy dynamic target to fixed plus entity', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      target: 2000,
      target_entity: 'sensor.dynamic_target',
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.target_marker.source).toEqual({
      fixed: 2000,
      entity: 'sensor.dynamic_target',
    });
  });

  it('runtime numeric resolution uses entity first and fixed fallback second', () => {
    const card = createCard();
    const resolvable = { fixed: 50, entity: 'sensor.dynamic_value' };

    card._hass.states = {
      'sensor.dynamic_value': { state: '77' },
    };
    expect(card._getNormalizedResolvableNumericValue(resolvable)).toBe(77);

    card._hass.states['sensor.dynamic_value'] = { state: 'unknown' };
    expect(card._getNormalizedResolvableNumericValue(resolvable)).toBe(50);

    card._hass.states['sensor.dynamic_value'] = { state: '' };
    expect(card._getNormalizedResolvableNumericValue(resolvable)).toBe(50);

    delete card._hass.states['sensor.dynamic_value'];
    expect(card._getNormalizedResolvableNumericValue(resolvable)).toBe(50);
  });

  it('legacy and structured configs normalize to the same render-relevant structure', () => {
    const card = createCard();
    const legacy = card.normalizeCardConfig({
      label_position: 'left',
      label_width: 160,
      height: 44,
      min: 0,
      max: 100,
      color_mode: 'severity',
      target: 65,
      target_color: '#ffffff',
      show_target_label: true,
      above_target_color: '#dc2626',
      show_peak: true,
      peak_color: '#888888',
      severity: [
        { from: 0, to: 50, color: '#22c55e' },
        { from: 50, to: 100, color: '#ef4444' },
      ],
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    const structured = card.normalizeCardConfig({
      layout: {
        label: {
          position: 'left',
          width: 160,
        },
        height: 44,
      },
      scale: {
        min: {
          fixed: 0,
        },
        max: {
          fixed: 100,
        },
      },
      bar: {
        color_mode: 'severity',
        segments: [
          { from: 0, to: 50, color: '#22c55e' },
          { from: 50, to: 100, color: '#ef4444' },
        ],
      },
      target: {
        at: {
          fixed: 65,
        },
        color: '#ffffff',
        label: {
          show: true,
        },
        when_exceeded: {
          fill_color: '#dc2626',
        },
      },
      peak: {
        enabled: true,
        color: '#888888',
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    const pickRenderRelevant = (cfg) => ({
      layout: cfg.layout,
      scale: cfg.scale,
      bar: {
        color_mode: cfg.bar.color_mode,
        color: cfg.bar.color,
        gradient_stops: cfg.bar.gradient_stops,
        segments: card._getSegmentsForRendering(cfg, cfg.scale.min.fixed, cfg.scale.max.fixed),
        animated: cfg.bar.animated,
        above_target_color: cfg.bar.above_target_color,
      },
      formatting: cfg.formatting,
      target_marker: cfg.target_marker,
      peak_marker: cfg.peak_marker,
    });

    expect(pickRenderRelevant(structured)).toEqual(pickRenderRelevant(legacy));
  });

  it('infers missing segment end values from the next segment start', () => {
    const card = createCard();

    expect(card.inferSegmentEndValues([
      { from: 0, to: null, color: '#4CAF50' },
      { from: 50, to: null, color: '#FF9800' },
      { from: 80, to: null, color: '#F44336' },
    ])).toEqual([
      { from: 0, to: 50, color: '#4CAF50', label: null },
      { from: 50, to: 80, color: '#FF9800', label: null },
      { from: 80, to: null, color: '#F44336', label: null },
    ]);
  });

  it('uses scale max as the final inferred segment end at render time for gauge-style segments', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      min: -2000,
      max: 5000,
      segments: [
        { from: -2000, color: '#2563eb' },
        { from: 0, color: '#f59e0b' },
        { from: 3500, color: '#ef4444' },
      ],
      entities: [{ entity: 'sensor.row' }],
    });

    expect(card._getSegmentsForRendering(cfg.entities[0], -2000, 5000)).toEqual([
      { from: 0, to: 28.57142857142857, color: '#2563eb', label: null },
      { from: 28.57142857142857, to: 78.57142857142857, color: '#f59e0b', label: null },
      { from: 78.57142857142857, to: 100, color: '#ef4444', label: null },
    ]);
  });

  it('keeps numeric structured bar.segments in scale-space', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      scale: {
        min: { fixed: 0 },
        max: { fixed: 200 },
      },
      bar: {
        segments: [
          { from: 0, color: '#22c55e' },
          { from: 100, color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(card._getSegmentsForRendering(cfg.entities[0], 0, 200)).toEqual([
      { from: 0, to: 50, color: '#22c55e', label: null },
      { from: 50, to: 100, color: '#ef4444', label: null },
    ]);
  });

  it('renders percent-based structured segments in the same space as legacy severity', () => {
    const card = createCard();
    const legacy = card.normalizeCardConfig({
      max: 160,
      severity: [
        { from: 0, to: 50, color: '#22c55e' },
        { from: 50, to: 100, color: '#ef4444' },
      ],
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];
    const structured = card.normalizeCardConfig({
      scale: {
        min: { fixed: 0 },
        max: { fixed: 160 },
      },
      bar: {
        segments: [
          { from: '0%', to: '50%', color: '#22c55e' },
          { from: '50%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    expect(card._getSegmentsForRendering(structured, 0, 160)).toEqual(
      card._getSegmentsForRendering(legacy, 0, 160)
    );
  });

  it('samples the active band color for bands plus solid_fill', () => {
    const card = createCard();
    const ecfg = card.normalizeCardConfig({
      bar: {
        fill_style: 'bands',
        solid_fill: true,
        segments: [
          { from: '0%', to: '50%', color: '#22c55e' },
          { from: '50%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    const lowColor = card._getColor(25, ecfg, 0, 100);
    const highColor = card._getColor(75, ecfg, 0, 100);

    expect(lowColor).toBe('#22c55e');
    expect(highColor).toBe('#ef4444');
    expect(card._getBasePaintGradient(lowColor, ecfg, 0, 100)).toBe('linear-gradient(to right,#22c55e 0%,#22c55e 100%)');
    expect(card._getBasePaintGradient(highColor, ecfg, 0, 100)).toBe('linear-gradient(to right,#ef4444 0%,#ef4444 100%)');
  });

  it('samples the interpolated color for band_gradient plus solid_fill', () => {
    const card = createCard();
    const ecfg = card.normalizeCardConfig({
      bar: {
        fill_style: 'band_gradient',
        solid_fill: true,
        segments: [
          { from: '0%', to: '100%', color: '#22c55e' },
          { from: '100%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    const midColor = card._getColor(50, ecfg, 0, 100);
    expect(midColor).toBe('rgb(137,133,81)');
    expect(card._getBasePaintGradient(midColor, ecfg, 0, 100)).toBe('linear-gradient(to right,rgb(137,133,81) 0%,rgb(137,133,81) 100%)');
  });

  it('samples the interpolated color for gradient plus solid_fill', () => {
    const card = createCard();
    const ecfg = card.normalizeCardConfig({
      bar: {
        fill_style: 'gradient',
        solid_fill: true,
        gradient_stops: [
          { pos: 0, color: '#2563eb' },
          { pos: 100, color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    const midColor = card._getColor(50, ecfg, 0, 100);
    expect(midColor).toBe('rgb(138,84,152)');
    expect(card._getBasePaintGradient(midColor, ecfg, 0, 100)).toBe('linear-gradient(to right,rgb(138,84,152) 0%,rgb(138,84,152) 100%)');
  });

  it('keeps baseline reveal geometry while using sampled solid_fill color for percent segments', () => {
    const card = createCard();
    const min = -100;
    const max = 100;
    const value = -50;
    const pct = card._toScalePct(value, min, max);
    const baselinePct = card._toScalePct(0, min, max);
    const ecfg = card.normalizeCardConfig({
      scale: {
        min: { fixed: min },
        max: { fixed: max },
      },
      baseline: {
        at: { fixed: 0 },
      },
      bar: {
        fill_style: 'bands',
        solid_fill: true,
        segments: [
          { from: '0%', to: '50%', color: '#22c55e' },
          { from: '50%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    const color = card._getColor(pct, ecfg, min, max);
    const fillState = card._getFillRenderState(pct, 38, ecfg, color, null, baselinePct, min, max);

    expect(fillState.paintStyle).toContain('linear-gradient(to right,#22c55e 0%,#22c55e 100%)');
    expect(fillState.revealStyle).toContain('clip-path:inset(0 50% 0 25%');
  });

  it('keeps existing non-solid-fill paint behavior unchanged', () => {
    const card = createCard();
    const solid = card.normalizeCardConfig({
      bar: { fill_style: 'solid', color: '#2563eb' },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];
    const gradient = card.normalizeCardConfig({
      bar: {
        fill_style: 'gradient',
        gradient_stops: [
          { pos: 0, color: '#2563eb' },
          { pos: 100, color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];
    const bands = card.normalizeCardConfig({
      bar: {
        fill_style: 'bands',
        segments: [
          { from: '0%', to: '50%', color: '#22c55e' },
          { from: '50%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];
    const bandGradient = card.normalizeCardConfig({
      bar: {
        fill_style: 'band_gradient',
        segments: [
          { from: '0%', to: '50%', color: '#22c55e' },
          { from: '50%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    expect(card._getBasePaintGradient('#2563eb', solid, 0, 100)).toBe('linear-gradient(to right,#2563eb 0%,#2563eb 100%)');
    expect(card._getBasePaintGradient(card._getColor(50, gradient, 0, 100), gradient, 0, 100)).toContain('rgb(37,99,235) 0%,rgb(239,68,68) 100%');
    expect(card._getBasePaintGradient(card._getColor(25, bands, 0, 100), bands, 0, 100)).toBe('linear-gradient(to right, #22c55e 0%, #22c55e 50%, #ef4444 50%, #ef4444 100%)');
    expect(card._getBasePaintGradient(card._getColor(50, bandGradient, 0, 100), bandGradient, 0, 100)).toContain('rgb(');
  });

  it('renders baseline severity paint identically for legacy severity and structured percent segments', () => {
    const card = createCard();
    const min = -100;
    const max = 100;
    const baselinePct = card._toScalePct(0, min, max);
    const legacy = card.normalizeCardConfig({
      color_mode: 'severity',
      baseline: 0,
      severity: [
        { from: 0, to: 50, color: '#22c55e' },
        { from: 50, to: 100, color: '#ef4444' },
      ],
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];
    const structured = card.normalizeCardConfig({
      scale: {
        min: { fixed: min },
        max: { fixed: max },
      },
      baseline: {
        at: { fixed: 0 },
      },
      bar: {
        color_mode: 'severity',
        segments: [
          { from: '0%', to: '50%', color: '#22c55e' },
          { from: '50%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    expect(card._getSegmentsForRendering(structured, min, max)).toEqual(
      card._getSegmentsForRendering(legacy, min, max)
    );
    expect(card._getFullScalePaintStyle(structured, '#000', null, baselinePct, min, max)).toBe(
      card._getFullScalePaintStyle(legacy, '#000', null, baselinePct, min, max)
    );
  });

  it('renders baseline severity_gradient paint identically for legacy severity and structured percent segments', () => {
    const card = createCard();
    const min = -100;
    const max = 100;
    const baselinePct = card._toScalePct(0, min, max);
    const legacy = card.normalizeCardConfig({
      color_mode: 'severity_gradient',
      baseline: 0,
      severity: [
        { from: 0, to: 25, color: '#22c55e' },
        { from: 25, to: 75, color: '#facc15' },
        { from: 75, to: 100, color: '#ef4444' },
      ],
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];
    const structured = card.normalizeCardConfig({
      scale: {
        min: { fixed: min },
        max: { fixed: max },
      },
      baseline: {
        at: { fixed: 0 },
      },
      bar: {
        color_mode: 'severity_gradient',
        segments: [
          { from: '0%', to: '25%', color: '#22c55e' },
          { from: '25%', to: '75%', color: '#facc15' },
          { from: '75%', to: '100%', color: '#ef4444' },
        ],
      },
      entities: [{ entity: 'sensor.row' }],
    }).entities[0];

    expect(card._getSegmentsForRendering(structured, min, max)).toEqual(
      card._getSegmentsForRendering(legacy, min, max)
    );
    expect(card._getFullScalePaintStyle(structured, '#000', null, baselinePct, min, max)).toBe(
      card._getFullScalePaintStyle(legacy, '#000', null, baselinePct, min, max)
    );
  });

  it('validates the heritage dashboard YAML', () => {
    const heritagePath = new URL('../../examples/dashboards/sensor-bar-card-plus-heritage.yaml', import.meta.url);

    expect(() => {
      execFileSync('ruby', ['-e', 'require "yaml"; YAML.load_file(ARGV[0])', heritagePath.pathname], {
        stdio: 'pipe',
      });
    }).not.toThrow();
  });
});
