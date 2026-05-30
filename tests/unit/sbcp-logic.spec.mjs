import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
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
      },
      entities: [{ entity: 'sensor.row' }],
    });

    expect(cfg.bar.fill_style).toBe('gradient');
    expect(cfg.bar.color_mode).toBe('gradient');
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
