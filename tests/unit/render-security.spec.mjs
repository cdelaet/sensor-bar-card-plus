import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { createCard } from '../support/load-card-class.cjs';
import { renderMarker, renderBar } from '../../src/render/bar-renderer.js';
import { getBandsGradientCss, getOverlayGradient } from '../../src/view-model/bar-render-model.js';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { handleCssColorInput, isValidCssColor } from '../../src/editor/shared/editor-controls.js';
import { GradientStopsSection } from '../../src/editor/sections/gradient-stops.js';
import { isSafeCssColorValue, safeCssColor } from '../../src/utils/css-values.js';

// Structural probes only. These values are never executed; they only prove that
// configuration text cannot close an attribute, add an attribute, add a CSS
// declaration, or open a markup tag.
const ATTRIBUTE_BREAKOUT = 'red" data-injected="true';
const MARKUP_BREAKOUT = 'red"><span data-injected="true"></span>';
const DECLARATION_BREAKOUT = 'red;background-image:url(about:invalid)';
const QUOTED_VAR_FALLBACK = 'var(--x, "data-injected")';
const COMMENT_BREAKOUT = 'red/*background-image:url(about:invalid)*/';

const VALID_COLORS = [
  '#4a9eff',
  '#abc',
  'red',
  'rgb(74 158 255 / 50%)',
  'hsl(210 100% 64%)',
  'var(--accent-color)',
  'var(--accent, #4a9eff)',
  'color-mix(in srgb, var(--accent) 50%, #fff)',
  'light-dark(white, black)',
];

function parse(html) {
  return new JSDOM(`<div id="root">${html}</div>`).window.document;
}

function marker(overrides = {}) {
  return {
    id: 'target', type: 'target', value: 50, position: 50, lane: 'below',
    visible: true, color: '#4a9eff', label: null, labelVisible: false,
    shape: 'diamond', direction: 'inward', showMarker: true,
    ...overrides,
  };
}

describe('CSS value safety', () => {
  it.each(VALID_COLORS)('preserves supported CSS color %s', (value) => {
    expect(isSafeCssColorValue(value)).toBe(true);
    expect(safeCssColor(value, '#000000')).toBe(value);
  });

  it.each([
    ATTRIBUTE_BREAKOUT,
    MARKUP_BREAKOUT,
    DECLARATION_BREAKOUT,
    QUOTED_VAR_FALLBACK,
    COMMENT_BREAKOUT,
    'red"',
    "red'",
    'red\\72 ed',
    'red&blue',
    'red\nblue',
  ])('rejects unsafe color text %j', (value) => {
    expect(isSafeCssColorValue(value)).toBe(false);
    expect(safeCssColor(value, '#888888')).toBe('#888888');
  });

  it('treats non-strings and empty strings as invalid', () => {
    expect(isSafeCssColorValue(null)).toBe(false);
    expect(isSafeCssColorValue(42)).toBe(false);
    expect(safeCssColor('', '#888888')).toBe('#888888');
  });
});

describe('renderer attribute boundaries', () => {
  it('keeps a hostile marker color inside the style attribute', () => {
    const document = parse(renderMarker(marker({ color: MARKUP_BREAKOUT })));
    const element = document.querySelector('.target-marker');

    expect(element).not.toBeNull();
    expect(element.hasAttribute('data-injected')).toBe(false);
    expect(document.querySelector('[data-injected]')).toBeNull();
    expect(element.getAttribute('style')).toContain('--marker-color:#888888');
  });

  it('keeps a hostile marker id escaped', () => {
    const document = parse(renderMarker(marker({ id: 'target" data-injected="true' })));
    const element = document.querySelector('.target-marker');

    expect(element).not.toBeNull();
    expect(element.hasAttribute('data-injected')).toBe(false);
    expect(element.getAttribute('data-marker-id')).toBe('target" data-injected="true');
  });

  it('preserves a theme-variable marker color unchanged', () => {
    const color = 'var(--accent, color-mix(in srgb, #4a9eff 60%, transparent))';
    const document = parse(renderMarker(marker({ color })));
    expect(document.querySelector('.target-marker').getAttribute('style')).toContain(`--marker-color:${color}`);
  });

  it('keeps hostile needle and paint colors out of attribute structure', () => {
    const gradient = getBandsGradientCss([{ from: 0, to: 100, color: MARKUP_BREAKOUT }], '#4a9eff');
    const model = {
      animated: false,
      baseline: { configured: false },
      needle: { configured: true, pct: 50, color: DECLARATION_BREAKOUT, borderColor: MARKUP_BREAKOUT, show: true, edge: 'middle' },
      markers: [marker({ color: ATTRIBUTE_BREAKOUT })],
      fill: {
        needleMode: false,
        revealStyle: 'display:block;',
        paintLayers: [{ id: 'base', zIndex: 1, paintStyle: `display:block;background-image:${gradient};`, revealStyle: 'display:block;' }],
      },
    };

    const document = parse(renderBar(model));
    expect(document.querySelector('[data-injected]')).toBeNull();
    expect(document.querySelector('.needle-marker').hasAttribute('data-injected')).toBe(false);
    expect(document.querySelector('.target-marker').hasAttribute('data-injected')).toBe(false);
    expect(document.querySelector('.bar-paint-layer').hasAttribute('data-injected')).toBe(false);
    expect(document.querySelector('.needle-marker').getAttribute('style')).not.toContain('url(');
  });
});

describe('paint compilation and legacy overlays', () => {
  it('preserves released gradient output for valid Segment colors', () => {
    expect(getBandsGradientCss([
      { from: 0, to: 50, color: '#123456' },
      { from: 50, to: 100, color: '#abcdef' },
    ], '#4a9eff')).toBe('linear-gradient(to right, #123456 0%, #123456 50%, #abcdef 50%, #abcdef 100%)');
  });

  it('replaces hostile Segment colors and never emits structure or declarations', () => {
    const gradient = getBandsGradientCss([{ from: 0, to: 100, color: MARKUP_BREAKOUT }], '#4a9eff');
    expect(gradient).toContain('#4a9eff');
    expect(gradient).not.toContain('data-injected');
    expect(gradient).not.toContain('url(');
    expect(gradient).not.toContain('"');
    expect(gradient).not.toContain('<');
  });

  it('drops an unsafe legacy overlay color instead of emitting it', () => {
    expect(getOverlayGradient(10, 90, DECLARATION_BREAKOUT)).toBeNull();
    expect(getOverlayGradient(10, 90, 'var(--accent)'))
      .toBe('linear-gradient(to right,transparent 0%,transparent 10%,var(--accent) 10%,var(--accent) 90%,transparent 90%,transparent 100%)');
  });
});

describe('normalization and editor validation', () => {
  it('rejects unsafe grouped Paint colors during normalization', () => {
    const config = normalizeCardConfig({
      entities: [{ entity: 'sensor.one' }],
      bar: { paint: { color: DECLARATION_BREAKOUT } },
    });
    expect(config.bar.paint.color).toBe('#4a9eff');
  });

  it('keeps valid CSS color expressions during normalization', () => {
    const color = 'var(--accent, color-mix(in srgb, #4a9eff 50%, #fff))';
    const config = normalizeCardConfig({
      entities: [{ entity: 'sensor.one' }],
      bar: { paint: { color } },
    });
    expect(config.bar.paint.color).toBe(color);
  });

  it('rejects values that CSS.supports alone would accept', () => {
    const alwaysSupported = { supports: () => true };
    expect(isValidCssColor(QUOTED_VAR_FALLBACK, alwaysSupported)).toBe(false);
    expect(isValidCssColor(DECLARATION_BREAKOUT, alwaysSupported)).toBe(false);
    expect(isValidCssColor('var(--x, url(about:invalid))', alwaysSupported)).toBe(false);
  });

  it('keeps legitimate CSS colors visible to the editor', () => {
    const alwaysSupported = { supports: () => true };
    for (const value of VALID_COLORS) expect(isValidCssColor(value, alwaysSupported)).toBe(true);
  });

  it('keeps invalid color text in the editor draft instead of committing it', () => {
    const drafts = new Map();
    const target = {
      id: 'bar-color-text-fallback',
      dataset: { cssColor: 'true', kind: 'bar-color' },
      ownerDocument: { defaultView: { CSS: { supports: () => true } } },
      setCustomValidity() {},
      setAttribute() {},
    };

    expect(handleCssColorInput(target, drafts, DECLARATION_BREAKOUT)).toBe(false);
    expect(drafts.get('bar-color-text-fallback')).toBe(DECLARATION_BREAKOUT);

    expect(handleCssColorInput(target, drafts, 'var(--accent, #4a9eff)')).toBe(true);
    expect(drafts.has('bar-color-text-fallback')).toBe(false);
  });

  it('keeps the editor gradient preview free of injected declarations', () => {
    const section = new GradientStopsSection(null, null, { destination: { id: 'bar' } });
    const style = section._buildEditorGradientPreviewStyle([
      { color: DECLARATION_BREAKOUT, pos: 0 },
      { color: '#ffffff', pos: 100 },
    ]);
    expect(style).toContain('#4a9eff 0%');
    expect(style).not.toContain('background-image');
  });

  it('preserves the released editor gradient preview for valid stops', () => {
    const section = new GradientStopsSection(null, null, { destination: { id: 'bar' } });
    expect(section._buildEditorGradientPreviewStyle([
      { color: '#123456', pos: 0 },
      { color: '#ffffff', pos: 100 },
    ])).toBe('background:linear-gradient(to right,#123456 0%,#ffffff 100%);background-repeat:no-repeat;');
  });
});

describe('card row label width', () => {
  function rowHtml(width) {
    const card = createCard();
    card._hass.states['sensor.one'] = {
      state: '42',
      attributes: { friendly_name: 'One', unit_of_measurement: 'W' },
    };
    const rowCfg = card.normalizeCardConfig({
      entities: [{ entity: 'sensor.one', layout: { label: { position: 'left', width } } }],
    }).entities[0];
    return card._buildRow(rowCfg, '42', 'W', 42, '#4a9eff', null, null, null, null, '#888', '#888', 0, 100);
  }

  it('preserves numeric and numeric-string widths', () => {
    expect(rowHtml(150)).toContain('min(150px');
    expect(rowHtml('150')).toContain('min(150px');
  });

  it('falls back to the default width for non-numeric values', () => {
    expect(rowHtml('not-a-number')).toContain('min(100px');
    expect(rowHtml(Number.NaN)).toContain('min(100px');
  });

  it('clamps negative widths and never emits injected attributes', () => {
    const document = parse(rowHtml(-20));
    const label = document.querySelector('.label-left');
    expect(label).not.toBeNull();
    expect(label.getAttribute('style')).toContain('min(0px');
    expect(label.hasAttribute('data-injected')).toBe(false);
  });

  it('keeps attribute-breaking width text out of the DOM', () => {
    const document = parse(rowHtml('100px" data-injected="true'));
    const label = document.querySelector('.label-left');

    expect(label).not.toBeNull();
    expect(label.hasAttribute('data-injected')).toBe(false);
    expect(document.querySelector('[data-injected]')).toBeNull();
    expect(label.getAttribute('style')).toContain('min(100px');
  });
});
