import { describe, it, expect } from 'vitest';
import { createEditor } from '../support/load-card-class.cjs';

for (const source of ['src', 'dist']) describe(`standalone palette characterization (${source})`, () => {
  it('keeps omitted ends on open, sorts stored rows, and retains incomplete boundary text locally', () => {
    const editor = createEditor({ source });
    editor.setConfig({ bar: { fill_style: 'bands', segments: [
      { from: 60, color: '#123456', extra: [1, 2] }, { from: 0, to: 60, color: '#abcdef' },
    ] } });
    expect(editor._getSegmentsValue().map(row => row.from)).toEqual([0, 60]);
    expect(editor._draftConfig.bar.segments[0]).not.toHaveProperty('to');
    editor._commitSegmentBoundaryEdit({ type: 'card' }, 0, 'from', '-');
    expect(editor._draftConfig.bar.segments.some(row => row.from === '-')).toBe(false);
    expect(editor._getSegmentBoundaryText({ type: 'card' }, 0, 'from', 0)).toBe('-');
  });
  it('normalizes/sorts gradient commits and keeps drafts on echoed config', () => {
    const editor = createEditor({ source });
    editor.setConfig({ entities: [{ entity: 'sensor.a' }], bar: { fill_style: 'gradient', gradient_stops: [
      { pos: '80%', color: ' red ', extra: { keep: true } }, { pos: 0, color: '#abcdef' },
    ] } });
    const root = { type: 'card' }, row = { type: 'entity', index: 0 };
    expect(editor._getGradientStopsValue().map(stop => stop.pos)).toEqual([0, 80]);
    editor._setGradientStopsDraftField(root, 'pos', '90');
    editor._setSegmentDraftField(row, 'from', '20%');
    editor._render();
    editor.setConfig(editor._draftConfig);
    expect(editor._getGradientStopsDraftState(root).pos).toBe('90');
    expect(editor._getSegmentDraftState(row).from).toBe('20%');
    editor._commitGradientStopPosEdit(root, 0, '10%');
    expect(editor._draftConfig.bar.gradient_stops).toEqual([
      { pos: 10, color: '#abcdef' }, { pos: 80, color: 'red', extra: { keep: true } },
    ]);
  });
});
