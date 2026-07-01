import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createCard, createEditor, loadCardClass } from '../support/load-card-class.cjs';

function sensor(state, attrs = {}) {
  return {
    state: String(state),
    attributes: {
      friendly_name: attrs.friendly_name ?? 'Sensor',
      icon: attrs.icon ?? 'mdi:flash',
      unit_of_measurement: attrs.unit_of_measurement ?? 'W',
      ...attrs,
    },
  };
}

describe('Sensor Bar Card Plus public API smoke', () => {
  it('renders a basic single-entity card config', () => {
    const card = createCard();
    card._hass.states['sensor.one'] = sensor(42);
    const cfg = card.normalizeCardConfig({ entity: 'sensor.one' });

    expect(cfg.entities).toHaveLength(1);
    expect(cfg.entities[0].entity).toBe('sensor.one');
    expect(card._buildRow(cfg.entities[0], '42', 'W', 42, '#4a9eff', null, null, null, null, '#888', '#888', 0, 100)).toContain('class="row"');
  });

  it('normalizes multiple entities', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      entities: ['sensor.one', { entity: 'sensor.two', name: 'Two' }],
    });

    expect(cfg.entities).toHaveLength(2);
    expect(cfg.entities[1].name).toBe('Two');
  });

  it('keeps legacy flat config support', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      entity: 'sensor.one',
      min: 10,
      max: 90,
      target: 55,
      baseline: 20,
      decimal: 0,
      color_mode: 'severity',
    });

    expect(cfg.entities[0].scale.min.fixed).toBe(10);
    expect(cfg.entities[0].scale.max.fixed).toBe(90);
    expect(cfg.entities[0].target_marker.source.fixed).toBe(55);
    expect(cfg.baseline.at.fixed).toBe(20);
    expect(cfg.bar.fill_style).toBe('bands');
  });

  it('keeps structured config support', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      entities: [{ entity: 'sensor.one' }],
      scale: {
        min: { fixed: -10 },
        max: { fixed: 10 },
      },
      target: {
        at: { fixed: 2 },
        label: { show: true },
      },
      baseline: {
        at: { fixed: 0 },
      },
      bar: {
        fill_style: 'gradient',
      },
    });

    expect(cfg.scale.min.fixed).toBe(-10);
    expect(cfg.scale.max.fixed).toBe(10);
    expect(cfg.target_marker.show_label).toBe(true);
    expect(cfg.baseline.at.fixed).toBe(0);
    expect(cfg.bar.fill_style).toBe('gradient');
  });

  it('renders severity bands and gradient fill modes', () => {
    const card = createCard();
    const severityCfg = card.normalizeCardConfig({
      color_mode: 'severity',
      entities: [{ entity: 'sensor.one' }],
    }).entities[0];
    const gradientCfg = card.normalizeCardConfig({
      bar: {
        fill_style: 'gradient',
        gradient_stops: [
          { pos: 0, color: '#111111' },
          { pos: 100, color: '#eeeeee' },
        ],
      },
      entities: [{ entity: 'sensor.one' }],
    }).entities[0];

    expect(card._getColor(20, severityCfg, 0, 100)).toBeTruthy();
    expect(card._buildRow(gradientCfg, '42', 'W', 42, '#4a9eff', null, null, null, null, '#888', '#888', 0, 100)).toContain('linear-gradient');
  });

  it('renders target, baseline, and peak markers', () => {
    const card = createCard();
    const rowCfg = card.normalizeCardConfig({
      show_peak: true,
      target: { at: { fixed: 50 }, label: { show: true } },
      entities: [{ entity: 'sensor.one', icon: 'mdi:eye' }],
    }).entities[0];
    const html = card._buildRow(
      rowCfg,
      '42',
      'W',
      42,
      '#4a9eff',
      64,
      '64 W',
      50,
      '50 W',
      '#999',
      '#fff',
      0,
      100,
    );

    expect(html).toContain('peak-marker');
    expect(html).toContain('target-marker');
    expect(html).toContain('target-value-label');
  });

  it('renders hero label rows without changing canonical layout config support', () => {
    const card = createCard();
    card._hass.states['sensor.hero'] = sensor(72, {
      friendly_name: 'Solar production',
      icon: 'mdi:solar-power',
      unit_of_measurement: 'kW',
    });
    const rowCfg = card.normalizeCardConfig({
      layout: {
        label: {
          position: 'hero',
        },
      },
      entities: [{ entity: 'sensor.hero' }],
    }).entities[0];

    const html = card._buildRow(
      rowCfg,
      '7.2',
      'kW',
      72,
      '#4a9eff',
      null,
      null,
      null,
      null,
      '#888',
      '#888',
      0,
      10,
    );

    expect(rowCfg.layout.label.position).toBe('hero');
    expect(html).toContain('class="hero-line"');
    expect(html).toContain('data-hero-size="medium"');
    expect(html).toContain('class="main-line hero-mode"');
  });

  it('escapes dynamic text interpolated into row HTML', () => {
    const card = createCard();
    card._hass.states['sensor.one'] = sensor(42, {
      friendly_name: '<b>AT&T "Home"</b>',
      unit_of_measurement: 'W&h',
    });
    const rowCfg = card.normalizeCardConfig({
      target: { at: { fixed: 50 }, label: { show: true } },
      entities: [{ entity: 'sensor.one' }],
    }).entities[0];

    const html = card._buildRow(
      rowCfg,
      '5 < 7 & "ok"',
      'W&h',
      42,
      '#4a9eff',
      null,
      null,
      50,
      '50 < 60 & "goal"',
      '#999',
      '#fff',
      0,
      100,
    );

    expect(html).toContain('&lt;b&gt;AT&amp;T &quot;Home&quot;&lt;/b&gt;');
    expect(html).toContain('5 &lt; 7 &amp; &quot;ok&quot;');
    expect(html).toContain('50 &lt; 60 &amp; &quot;goal&quot;');
    expect(html).toContain('W&amp;h');
    expect(html).not.toContain('<b>AT&T "Home"</b>');
    expect(html).not.toContain('5 < 7 & "ok"');
    expect(html).not.toContain('50 < 60 & "goal"');
    expect(html).toContain('AT&amp;T');
    expect(html).not.toContain('AT&amp;amp;T');
  });

  it('escapes dynamic entity ids interpolated into row HTML attributes', () => {
    const card = createCard();
    const rowCfg = card.normalizeCardConfig({
      entities: [{ entity: 'sensor.one' }],
    }).entities[0];
    rowCfg.entity = 'sensor.bad"&<>\'';

    const html = card._buildRow(
      rowCfg,
      '42',
      'W',
      42,
      '#4a9eff',
      null,
      null,
      null,
      null,
      '#888',
      '#888',
      0,
      100,
    );

    expect(html).toContain('data-entity="sensor.bad&quot;&amp;&lt;&gt;&#39;"');
    expect(html).not.toContain('data-entity="sensor.bad"&<>\'"');
  });

  it('resolves dynamic min/max/target/baseline entity references', () => {
    const card = createCard();
    card._hass.states = {
      'sensor.row': sensor(42),
      'sensor.min': sensor(-5),
      'sensor.max': sensor(95),
      'sensor.target': sensor(60),
      'sensor.baseline': sensor(10),
    };
    const cfg = card.normalizeCardConfig({
      entities: [{
        entity: 'sensor.row',
        min_entity: 'sensor.min',
        max_entity: 'sensor.max',
        target_entity: 'sensor.target',
        baseline: 'sensor.baseline',
      }],
    }).entities[0];
    const resolved = card._resolve(cfg);

    expect(card._getNormalizedResolvableNumericValue(resolved.scale.min)).toBe(-5);
    expect(card._getNormalizedResolvableNumericValue(resolved.scale.max)).toBe(95);
    expect(card._getNormalizedResolvableNumericValue(resolved.target_marker.source)).toBe(60);
    expect(card._resolveBaselinePct(resolved, -5, 95)).toBeGreaterThan(0);
  });

  it('applies per-entity overrides over card defaults', () => {
    const card = createCard();
    const cfg = card.normalizeCardConfig({
      formatting: { decimal: 1, unit: 'W' },
      bar: { color: '#111111' },
      entities: [{
        entity: 'sensor.one',
        formatting: { decimal: 2, unit: 'kW' },
        bar: { color: '#222222' },
      }],
    }).entities[0];

    expect(cfg.formatting.decimal).toBe(2);
    expect(cfg.formatting.unit).toBe('kW');
    expect(cfg.bar.color).toBe('#222222');
  });

  it('loads the editor and preserves unrelated config keys on edit', () => {
    const editor = createEditor();
    const events = [];
    editor.dispatchEvent = (event) => {
      events.push(event);
      return true;
    };

    editor.setConfig({
      type: 'custom:sensor-bar-card-plus',
      title: 'Before',
      custom_key: { preserved: true },
      entities: [{ entity: 'sensor.one' }],
    });
    editor._setTitle('After');

    expect(events).toHaveLength(1);
    expect(events[0].detail.config.title).toBe('After');
    expect(events[0].detail.config.custom_key).toEqual({ preserved: true });
  });

  it('builds and registers the distributable bundle', () => {
    execFileSync('node', ['tools/build-dist.cjs'], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });
    const classes = loadCardClass({ source: 'dist' });

    expect(classes.card).toBeTypeOf('function');
    expect(classes.editor).toBeTypeOf('function');
  });
});
