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
    editor._setSegmentBoundaryText({ type: 'card' }, 0, 'from', '-');
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
      { pos: 10, color: '#abcdef' }, { pos: 80, color: ' red ', extra: { keep: true } },
    ]);
  });

  it('reconciles only changed palettes on external config replacement', () => {
    const editor = createEditor({ source });
    const config = { name: 'before', bar: { fill_style: 'bands', segments: [
      { from: 0, to: 50, color: '#123456' }, { from: 50, to: 100, color: '#abcdef' },
    ], gradient_stops: [{ pos: 0, color: '#111111' }, { pos: 100, color: '#eeeeee' }] } };
    editor.setConfig(config);
    const root = { type: 'card' };
    const segments = editor._segmentsSection;
    const gradient = editor._gradientStopsSection;
    const oldSegmentGeneration = segments._getPaletteSession(root).generation;
    const oldGradientGeneration = gradient._getPaletteSession(root).generation;
    segments._setSegmentBoundaryText(root, 0, 'from', 'draft');
    gradient._setGradientStopPosText(root, 1, 'draft');

    editor.setConfig({ ...structuredClone(config), name: 'after', bar: {
      ...structuredClone(config.bar), segments: [
        { from: 0, to: 30, color: '#123456' }, { from: 30, to: 100, color: '#abcdef' },
      ],
    } });

    expect(segments._getPaletteSession(root).generation).not.toBe(oldSegmentGeneration);
    expect(gradient._getPaletteSession(root).generation).toBe(oldGradientGeneration);
    expect(segments._getSegmentBoundaryText(root, 0, 'from', 0)).toBe('0');
    expect(gradient._getGradientStopPosText(root, 1, 100)).toBe('draft');
  });

  it('reconciles only the replaced entity palette without emitting config', () => {
    const editor = createEditor({ source });
    const config = { bar: { fill_style: 'bands' }, entities: [
      { entity: 'sensor.a', bar: { segments: [{ from: 0, to: 50, color: '#123456' }] } },
      { entity: 'sensor.b', bar: { segments: [{ from: 0, to: 100, color: '#abcdef' }] } },
    ] };
    editor.setConfig(config);
    const segments = editor._segmentsSection;
    const scopes = [{ type: 'card' }, { type: 'entity', index: 0 }, { type: 'entity', index: 1 }];
    const generations = scopes.map(scope => segments._getPaletteSession(scope).generation);
    scopes.forEach((scope, index) => segments._setSegmentBoundaryText(scope, 0, 'from', `draft-${index}`));
    let emissions = 0;
    const emit = editor._emitConfigChanged.bind(editor);
    editor._emitConfigChanged = (...args) => { emissions += 1; return emit(...args); };

    editor.setConfig({ ...structuredClone(config), entities: [
      { entity: 'sensor.a', bar: { segments: [{ from: 0, to: 30, color: '#123456' }, { from: 30, to: 100, color: '#abcdef' }] } },
      structuredClone(config.entities[1]),
    ] });

    const nextGenerations = scopes.map(scope => segments._getPaletteSession(scope).generation);
    expect(nextGenerations[0]).toBe(generations[0]);
    expect(nextGenerations[1]).not.toBe(generations[1]);
    expect(nextGenerations[2]).toBe(generations[2]);
    expect(segments._getSegmentBoundaryText(scopes[0], 0, 'from', 0)).toBe('draft-0');
    expect(segments._getSegmentBoundaryText(scopes[1], 0, 'from', 0)).toBe('0');
    expect(segments._getSegmentBoundaryText(scopes[2], 0, 'from', 0)).toBe('draft-2');
    expect(emissions).toBe(0);
  });
});
