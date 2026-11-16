import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import {
  initializeDisclosure, initializeUniversalMessageArea, renderDisclosure, renderUniversalMessageArea,
  syncUniversalMessageArea,
} from '../../src/render/universal-messages.js';

function makeArea() {
  const document = new JSDOM(`<body>${renderUniversalMessageArea()}</body>`).window.document;
  const area = document.querySelector('.sbcp-messages');
  initializeUniversalMessageArea(area);
  return { area, document };
}

describe('universal message presentation', () => {
  it('stays hidden when empty and shows all severity counts with the diagnostic cause and fallback', () => {
    const { area } = makeArea();
    syncUniversalMessageArea(area, { warnings: [], errors: [] });
    expect(area.hidden).toBe(true);

    const diagnostic = { code: 'paint_preset_missing', severity: 'warning', path: 'entities[0].target.when_above.paint.preset',
      entity: 'sensor.power', reference: 'Alert', fallback: 'inherited' };
    syncUniversalMessageArea(area, {
      warnings: [diagnostic, diagnostic],
      errors: [{ code: 'runtime.failure', path: 'bar.paint', message: 'Rendering failed.' }],
    });

    expect(area.hidden).toBe(false);
    expect(area.querySelectorAll('.sbcp-message')).toHaveLength(2);
    expect(area.querySelector('.sbcp-message-count[data-severity="info"] span:last-child').textContent).toBe('0');
    expect(area.querySelector('.sbcp-message-count[data-severity="warning"] span:last-child').textContent).toBe('1');
    expect(area.querySelector('.sbcp-message-count[data-severity="error"] span:last-child').textContent).toBe('1');
    expect(area.textContent).toContain('sensor.power · Target above Paint · preset');
    expect(area.textContent).toContain('Paint preset “Alert” was not found. Using the inherited paint.');
  });

  it('keeps the native disclosure state through updates and automatically removes recovered messages', () => {
    const { area } = makeArea();
    const warning = { code: 'target.invalid_ordering', path: 'target',
      message: 'Lower Target threshold is greater than upper Target threshold; both Target paints are suppressed.' };
    syncUniversalMessageArea(area, { warnings: [warning], errors: [] });
    const button = area.querySelector('button');
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(area.querySelector('.sbcp-disclosure-panel').hidden).toBe(false);

    syncUniversalMessageArea(area, { warnings: [{ ...warning, below: 25 }], errors: [] });
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(area.querySelector('.sbcp-disclosure-panel').hidden).toBe(false);

    syncUniversalMessageArea(area, { warnings: [], errors: [] });
    expect(area.hidden).toBe(true);
    syncUniversalMessageArea(area, { warnings: [warning], errors: [] });
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('formats the diagnostic fallback without replacing its underlying reason', () => {
    const { area } = makeArea();
    syncUniversalMessageArea(area, { warnings: [{ code: 'paint.invalid_value', path: 'card.bar.paint.opacity',
      message: 'Invalid paint opacity; using 100.' }], errors: [] });
    expect(area.textContent).toContain('Invalid paint opacity; using 100.');
    expect(area.querySelector('.sbcp-message-area').textContent).toBe('Bar Paint · opacity');
  });

  it('reports invalid presets and master conflicts with their real fallback', () => {
    const { area } = makeArea();
    syncUniversalMessageArea(area, { warnings: [
      { code: 'paint_preset_invalid', path: 'target.when_above.paint.preset', reference: 'broken',
        reason: 'invalid_paint_property', fallback: 'inherited' },
      { code: 'multiple_preset_masters', path: 'preset_library', severity: 'warning',
        message: 'Dashboard has 2 master Cards with preset_library; preset resolution is disabled.',
        fallback: 'preset_resolution_disabled' },
      { code: 'paint_preset_missing', path: 'entities.sensor.power.target.when_below.paint.preset',
        entity: 'sensor.power', reference: 'low', fallback: 'inherited' },
    ], errors: [] });
    expect(area.textContent).toContain('Paint preset “broken” is invalid (invalid paint property). Using the inherited paint.');
    expect(area.textContent).toContain('Dashboard has 2 master Cards with preset_library; preset resolution is disabled.');
    expect(area.textContent).toContain('sensor.power · Target below Paint · preset');
  });

  it('provides reusable disclosure behavior with an expanded initial state', () => {
    const document = new JSDOM(`<body>${renderDisclosure({ id: 'legend', title: 'Legend', panel: '<div>Legend content</div>', expanded: true })}</body>`).window.document;
    const disclosure = document.querySelector('.sbcp-disclosure');
    initializeDisclosure(disclosure);
    const button = disclosure.querySelector('button');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(disclosure.querySelector('.sbcp-disclosure-panel').hidden).toBe(false);
    button.click();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(disclosure.querySelector('.sbcp-disclosure-panel').hidden).toBe(true);
  });
});
