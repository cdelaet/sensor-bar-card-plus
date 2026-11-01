import { describe, expect, it } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
import { normalizeCardConfig } from '../../src/config/normalize.js';
import { validateNormalizedConfig } from '../../src/config/validate.js';

for (const source of ['src', 'dist']) {
  for (const editorType of ['editor', 'featureEditor']) {
    describe(`historical editor migration (${source}, ${editorType})`, () => {
      it('migrates only legacy extrema once, without mutating input or losing unrelated settings', async () => {
        const Editor = loadCardClass({ source })[editorType];
        const editor = new Editor();
        const original = { type: 'custom:example', peak: { enabled: true, reset: 'never', color: 'red' },
          floor: { reset: 'weekly', window: '24h', label: { text: 'Keep' } },
          entities: [{ entity: 'sensor.a', peak: { reset: 'daily', extra: 3 }, floor: { reset: '15m' } }, 'sensor.b'],
          other: { reset: 'never' } };
        const copy = structuredClone(original); const events = [];
        editor.dispatchEvent = event => { events.push(event.detail.config); editor.setConfig(event.detail.config); return true; };
        editor.setConfig(original);
        await Promise.resolve(); await Promise.resolve();
        expect(original).toEqual(copy);
        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({ ...copy, peak: { enabled: true, window: 'today', color: 'red' },
          floor: { window: '24h', label: { text: 'Keep' } },
          entities: [{ entity: 'sensor.a', peak: { window: 'today', extra: 3 }, floor: { window: '15m' } }, 'sensor.b'] });
        editor.setConfig(events[0]); editor.setConfig(original);
        await Promise.resolve(); await Promise.resolve();
        expect(events).toHaveLength(1);
        editor.setConfig({ entity: 'sensor.other' });
        editor.setConfig(original);
        await Promise.resolve(); await Promise.resolve();
        expect(events).toHaveLength(2);
      });

      it('keeps invalid legacy resets invalid and leaves unrelated configs unchanged', async () => {
        const Editor = loadCardClass({ source })[editorType]; const editor = new Editor(); const events = [];
        editor.dispatchEvent = event => { events.push(event.detail.config); return true; };
        editor.setConfig({ entity: 'sensor.a', peak: { reset: '24h' }, floor: { reset: 'bad' } });
        await Promise.resolve(); await Promise.resolve();
        expect(events).toHaveLength(1);
        expect(events[0].peak.window).not.toBe('24h');
        const normalized = normalizeCardConfig(events[0]);
        expect(normalized.peak_marker.window_invalid).toBe(true);
        expect(normalized.floor_marker.window_invalid).toBe(true);
        expect(validateNormalizedConfig(normalized).warnings.map(item => item.code)).toContain('peak_marker.invalid_window');
        editor.setConfig({ entity: 'sensor.a', other: { reset: 'never' } });
        await Promise.resolve(); await Promise.resolve();
        expect(events).toHaveLength(1);
      });

      it('shows an invalid empty legacy value rather than selecting Today', async () => {
        const Editor = loadCardClass({ source })[editorType]; const editor = new Editor(); const events = [];
        editor.dispatchEvent = event => { events.push(event.detail.config); return true; };
        editor.setConfig({ entity: 'sensor.a', peak: { reset: null } });
        await Promise.resolve(); await Promise.resolve();
        expect(events[0].peak.window).toBeNull();
        const html = editor._extremaSection.render({ type: 'card' }, 'peak');
        expect(html).toContain('Invalid window: null');
        expect(html).toContain('value="null" selected disabled');
      });

      it('maps legacy calendar and duration reset values to equivalent windows', async () => {
        const Editor = loadCardClass({ source })[editorType]; const editor = new Editor(); const events = [];
        editor.dispatchEvent = event => { events.push(event.detail.config); return true; };
        editor.setConfig({ peak: { reset: 'monthly' }, floor: { reset: 'hourly' },
          entities: [{ entity: 'sensor.a', peak: { reset: '23h' }, floor: { reset: 'yearly' } }] });
        await Promise.resolve(); await Promise.resolve();
        expect(events[0]).toMatchObject({ peak: { window: 'this_month' }, floor: { window: 'hourly' },
          entities: [{ peak: { window: '23h' }, floor: { window: 'this_year' } }] });
      });

      it('canonicalizes window aliases, honors window precedence and migrates only once', async () => {
        const Editor = loadCardClass({ source })[editorType]; const editor = new Editor(); const events = [];
        editor.dispatchEvent = event => { events.push(event.detail.config); editor.setConfig(event.detail.config); return true; };
        const input = { peak: { window: 'last_week', reset: 'yearly', keep: true }, floor: { window: 'yearly' },
          entities: [{ entity: 'sensor.a', peak: { window: 'last_month' }, floor: { reset: 'yearly', window: 'previous_year' } }],
          unrelated: { window: 'last_month' } };
        const original = structuredClone(input);
        editor.setConfig(input); await Promise.resolve(); await Promise.resolve();
        expect(input).toEqual(original);
        expect(events).toHaveLength(1);
        expect(events[0]).toEqual({ peak: { window: 'previous_week', keep: true }, floor: { window: 'this_year' },
          entities: [{ entity: 'sensor.a', peak: { window: 'previous_month' }, floor: { window: 'previous_year' } }],
          unrelated: { window: 'last_month' } });
        editor.setConfig(events[0]); await Promise.resolve(); await Promise.resolve();
        expect(events).toHaveLength(1);
      });

      it('does not migrate or interpret unsupported marker aliases', async () => {
        const Editor = loadCardClass({ source })[editorType]; const editor = new Editor(); const events = [];
        editor.dispatchEvent = event => { events.push(event.detail.config); return true; };
        const config = { entity: 'sensor.a', peak_marker: { enabled: true, show: true, reset: 'daily', color: 'red' },
          floor_marker: { enabled: true, reset: 'hourly' } };
        editor.setConfig(config); await Promise.resolve(); await Promise.resolve();
        expect(events).toHaveLength(0);
        expect(editor._extremaSection._getScopedPeakConfig({ type: 'card' })).toEqual({ mode: 'disabled', color: '' });
        expect(editor._extremaSection._getScopedFloorConfig({ type: 'card' }).mode).toBe('disabled');
        editor._extremaSection.handleField({ field: 'peak-show', value: true });
        expect(events.at(-1).peak).toMatchObject({ enabled: true, window: 'today' });
        expect(events.at(-1).peak_marker).toEqual(config.peak_marker);
        expect(events.at(-1).floor_marker).toEqual(config.floor_marker);
      });

      it('creates canonical defaults and independently edits and re-enables both markers', async () => {
        const Editor = loadCardClass({ source })[editorType]; const editor = new Editor(); const events = [];
        editor.dispatchEvent = event => { events.push(event.detail.config); return true; };
        editor.setConfig({ entity: 'sensor.a', custom: 'keep' });
        const change = (field, value) => editor._extremaSection.handleField({ field, value });
        change('peak-show', true); change('floor-show', true);
        change('peak-window', '24h'); change('floor-window', '7d');
        change('peak-show', false); change('peak-show', true);
        const config = events.at(-1);
        expect(config.peak).toMatchObject({ enabled: true, window: '24h' });
        expect(config.floor).toMatchObject({ enabled: true, window: '7d' });
        expect(config.custom).toBe('keep');
        expect(config.peak).not.toHaveProperty('reset'); expect(config.floor).not.toHaveProperty('reset');
        expect(config).not.toHaveProperty('peak_marker'); expect(config).not.toHaveProperty('floor_marker');
        expect(editor._extremaSection.render({ type: 'card' }, 'peak')).toContain('Time window'.toLowerCase());
      });
    });
  }
}
