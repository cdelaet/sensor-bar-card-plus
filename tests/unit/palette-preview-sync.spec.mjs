import { expect, it, vi } from 'vitest';
import { createDomEditorFixture, dispatchDomEvent } from '../support/dom-editor-fixture.mjs';

for (const source of ['src', 'dist']) for (const palette of ['segments', 'gradient_stops']) {
  it(`refreshes ${palette} in the existing sync pass even when its rows stay mounted (${source})`, async () => {
    const { editor } = await createDomEditorFixture({ source });
    editor.setConfig({ preset_library: { paint: { warm: {
      fill_style: palette === 'segments' ? 'bands' : 'gradient',
      segments: [{ from: '0%', to: '100%', color: '#1133aa' }],
      gradient_stops: [{ pos: 0, color: '#1133aa' }, { pos: 100, color: '#22cc66' }],
    } } } });
    editor.hass = { states: {} };
    const segment = palette === 'segments';
    const section = editor._presetPaintSections[segment ? 'segments' : 'gradientStops'];
    const root = editor.shadowRoot.querySelector('#preset-paint-editor');
    const input = root.querySelector(`input[data-kind="${segment ? 'segment' : 'gradient'}-color"]`);
    const inputs = [...root.querySelectorAll('input')];
    const track = root.querySelector(segment ? '.segment-preview-track' : '.gradient-preview-track:not(.segment-preview-track)');
    const before = track.outerHTML;
    const rows = vi.spyOn(section, '_syncRows');
    const preview = vi.spyOn(section, segment ? '_refreshSegmentUi' : '_refreshGradientDraftUi');
    const render = vi.spyOn(editor, '_render');
    input.focus();
    input.value = '#aabbcc';

    dispatchDomEvent(input, 'input');

    expect(editor._draftConfig.preset_library.paint.warm[palette][0].color).toBe('#aabbcc');
    expect(rows).toHaveBeenCalledTimes(1);
    expect(rows.mock.results[0].value).toBe(false);
    expect(preview).toHaveBeenCalledTimes(1);
    expect(track.outerHTML).not.toBe(before);
    expect([...root.querySelectorAll('input')].every((node, index) => node === inputs[index])).toBe(true);
    expect(editor.shadowRoot.activeElement).toBe(input);
    expect(render).not.toHaveBeenCalled();
  });
}
