import { describe, expect, it } from 'vitest';
import { loadCardClass } from '../support/load-card-class.cjs';
import { normalizeGenericMarkerList } from '../../src/config/normalize.js';

const cardScope = { type: 'card' };
const entityScope = { type: 'entity', index: 0 };
const type = 'custom:sensor-bar-card-plus-feature';

async function createHost(host, config) {
  const classes = loadCardClass({ source: 'src' });
  const editor = new (host === 'card' ? classes.editor : classes.featureEditor)();
  editor.setConfig(host === 'card' ? config : { type, ...config });
  if (host === 'feature') await editor.updateComplete;
  return { editor, section: editor._referenceMarkersSection };
}

const currentConfig = (host, editor) => host === 'card' ? editor._draftConfig : editor._config;

describe('Reference Marker value editor', () => {
  it('runtime accepts structured percentage positions and Entity/Attribute fallbacks', () => {
    const { markers } = normalizeGenericMarkerList([
      { at: { percent: 100 } },
      { at: { entity: { id: 'sensor.reference', attribute: 'position' }, percent: 35 } },
    ]);
    expect(markers.map(marker => ({ valid: marker.valid, source: marker.source }))).toEqual([
      { valid: true, source: expect.objectContaining({ percent: 100 }) },
      { valid: true, source: expect.objectContaining({ entity: 'sensor.reference', attribute: 'position', percent: 35 }) },
    ]);
  });

  it('shows a direct value field without a Source selector for a fixed marker', () => {
    const { editor: Editor } = loadCardClass({ source: 'src' });
    const editor = new Editor();
    editor.setConfig({ markers: [{ at: { fixed: 25 } }] });

    const markup = editor._referenceMarkersSection.render(cardScope);
    expect(markup).toContain('>Value</label>');
    expect(markup).toContain('data-kind="generic-marker-fixed"');
    expect(markup).not.toContain('generic-marker-source-mode');
    expect(markup).toContain('data-kind="generic-marker-entity"');
  });

  it('keeps entity and attribute sources editable without changing their meaning', () => {
    const { editor: Editor } = loadCardClass({ source: 'src' });
    const editor = new Editor();
    editor.setConfig({ markers: [{ at: { entity: { id: 'sensor.reference', attribute: 'reading' } } }] });

    const markup = editor._referenceMarkersSection.render(cardScope);
    expect(markup).not.toContain('generic-marker-source-mode');
    expect(markup).toContain('value="sensor.reference"');
    expect(markup).toContain('value="reading"');
    expect(editor._getGenericMarkerSource(editor._draftConfig.markers[0])).toMatchObject({
      mode: 'entity', entity: 'sensor.reference', attribute: 'reading', fixed: '',
    });
    editor._referenceMarkersSection._setGenericMarkerField(cardScope, 0, 'generic-marker-attribute', 'level');
    expect(editor._draftConfig.markers[0].at.entity).toEqual({ id: 'sensor.reference', attribute: 'level' });
  });

  it('reads and writes scale percentages through the Value suffix', () => {
    const { editor: Editor } = loadCardClass({ source: 'src' });
    const editor = new Editor();
    editor.setConfig({ markers: [{ at: '25%' }] });

    const markup = editor._referenceMarkersSection.render(cardScope);
    expect(markup).toContain('value="25%"');
    expect(markup).toContain('placeholder="25 or 25%"');
    expect(markup).not.toContain('generic-marker-source-mode');
    editor._referenceMarkersSection._setGenericMarkerField(cardScope, 0, 'generic-marker-fixed', '35%');
    expect(editor._draftConfig.markers[0].at).toBe('35%');
    editor._referenceMarkersSection._setGenericMarkerField(cardScope, 0, 'generic-marker-fixed', '101%');
    expect(editor._draftConfig.markers[0].at).toBe('35%');
    editor._referenceMarkersSection._setGenericMarkerField(cardScope, 0, 'generic-marker-fixed', '40');
    expect(editor._draftConfig.markers[0].at).toBe(40);
  });

  it('infers the current entity row when editing an entity-scoped marker', () => {
    const { editor: Editor } = loadCardClass({ source: 'src' });
    const editor = new Editor();
    editor.setConfig({ entities: ['sensor.row'], markers: [{ at: { fixed: 25 } }] });
    editor._setGenericMarkerField(entityScope, 0, 'generic-marker-fixed', '30');

    expect(editor._draftConfig.entities[0].markers[0].at).toEqual({ fixed: 30 });
    expect(editor._draftConfig.markers[0].at).toEqual({ fixed: 25 });
    const markup = editor._referenceMarkersSection.render(entityScope);
    expect(markup).toContain('data-scope-type="entity"');
    expect(markup).not.toContain('generic-marker-source-mode');
  });

  it('uses the same direct value and optional entity controls in the Feature editor', async () => {
    const { featureEditor: Editor } = loadCardClass({ source: 'src' });
    const editor = new Editor();
    editor.setConfig({ type: 'custom:sensor-bar-card-plus-feature', markers: [{ at: 25 }] });
    await editor.updateComplete;

    const markup = editor._referenceMarkersSection.render(cardScope);
    expect(markup).toContain('>Value</label>');
    expect(markup).toContain('data-kind="generic-marker-fixed"');
    expect(markup).toContain('data-kind="generic-marker-entity"');
    expect(markup).not.toContain('generic-marker-source-mode');

    editor._referenceMarkersSection._setGenericMarkerField(cardScope, 0, 'generic-marker-fixed', '30');
    expect(editor._config.markers[0].at).toBe(30);
  });

  for (const host of ['card', 'feature']) {
    it(`${host} preserves fixed and zero fallbacks while adding, changing, and removing Entity/Attribute`, async () => {
      const { editor, section } = await createHost(host, {
        entities: ['sensor.row'],
        markers: [{ at: { entity: { id: 'sensor.reference', attribute: 'reading' }, fixed: 25 } }],
      });
      let marker = currentConfig(host, editor).markers[0];
      expect(section.render(cardScope)).toContain('value="25"');
      expect(section.render(cardScope)).toContain('value="reading"');

      section._setGenericMarkerField(cardScope, 0, 'generic-marker-entity', 'sensor.changed');
      section._setGenericMarkerField(cardScope, 0, 'generic-marker-attribute', 'temperature');
      marker = currentConfig(host, editor).markers[0];
      expect(marker.at).toEqual({ entity: { id: 'sensor.changed', attribute: 'temperature' }, fixed: 25 });

      section._setGenericMarkerField(cardScope, 0, 'generic-marker-fixed', '0');
      section._setGenericMarkerField(cardScope, 0, 'generic-marker-entity', 'sensor.next');
      expect(currentConfig(host, editor).markers[0].at).toEqual({ entity: { id: 'sensor.next', attribute: 'temperature' }, fixed: 0 });

      section._setGenericMarkerField(cardScope, 0, 'generic-marker-entity', '');
      expect(currentConfig(host, editor).markers[0].at).toEqual({ fixed: 0 });
    });

    it(`${host} displays and canonicalizes scalar and value-alias fallbacks when adding Entity`, async () => {
      const { editor, section } = await createHost(host, { markers: [{ at: 25 }] });
      expect(section.render(cardScope)).toContain('value="25"');
      section._setGenericMarkerField(cardScope, 0, 'generic-marker-entity', 'sensor.reference');
      expect(currentConfig(host, editor).markers[0].at).toEqual({ fixed: 25, entity: 'sensor.reference' });

      editor.setConfig(host === 'card'
        ? { markers: [{ at: { entity: 'sensor.old', value: 12 } }] }
        : { type, markers: [{ at: { entity: 'sensor.old', value: 12 } }] });
      const aliasMarkup = section.render(cardScope);
      expect(aliasMarkup).toContain('value="12"');
      section._setGenericMarkerField(cardScope, 0, 'generic-marker-entity', 'sensor.new');
      expect(currentConfig(host, editor).markers[0].at).toEqual({ entity: 'sensor.new', fixed: 12 });
    });

    it(`${host} keeps Entity/Attribute while switching the fallback between fixed and percentage`, async () => {
      const { editor, section } = await createHost(host, {
        markers: [{ at: { entity: { id: 'sensor.reference', attribute: 'reading' }, percent: 25 } }],
      });
      expect(section.render(cardScope)).toContain('value="25%"');

      section._setGenericMarkerField(cardScope, 0, 'generic-marker-entity', 'sensor.changed');
      section._setGenericMarkerField(cardScope, 0, 'generic-marker-attribute', 'temperature');
      expect(currentConfig(host, editor).markers[0].at).toEqual({ entity: { id: 'sensor.changed', attribute: 'temperature' }, percent: 25 });

      section._setGenericMarkerField(cardScope, 0, 'generic-marker-fixed', '30');
      expect(currentConfig(host, editor).markers[0].at).toEqual({ entity: { id: 'sensor.changed', attribute: 'temperature' }, fixed: 30 });
      section._setGenericMarkerField(cardScope, 0, 'generic-marker-fixed', '40%');
      expect(currentConfig(host, editor).markers[0].at).toEqual({ entity: { id: 'sensor.changed', attribute: 'temperature' }, percent: 40 });
      expect(section.render(cardScope)).toContain('value="40%"');
    });
  }

  for (const [host, scope] of [['card', cardScope], ['card', entityScope], ['feature', cardScope]]) {
    const location = scope.type === 'entity' ? 'entity override' : 'global';
    it(`${host} ${location} canonicalizes percentage-only sources and round-trips`, async () => {
      const config = {
        markers: [{ at: { percent: 100 }, future: { keep: true } }],
        ...(scope.type === 'entity' ? {
          entities: [{ entity: 'sensor.row', markers: [{ at: { percent: 100 }, future: { keep: true } }] }],
        } : {}),
      };
      const { editor, section } = await createHost(host, config);
      const readMarker = () => {
        const current = currentConfig(host, editor);
        return scope.type === 'entity' ? current.entities[0].markers[0] : current.markers[0];
      };

      expect(section.render(scope)).toContain('value="100%"');
      expect(readMarker().at).toEqual({ percent: 100 }); // Opening remains non-mutating.
      section._setGenericMarkerField(scope, 0, 'generic-marker-fixed', '35%');
      expect(readMarker()).toEqual({ at: '35%', future: { keep: true } });

      const echoed = structuredClone(currentConfig(host, editor));
      editor.setConfig(host === 'card' ? echoed : { type, ...echoed });
      if (host === 'feature') await editor.updateComplete;
      expect(section.render(scope)).toContain('value="35%"');
      expect(readMarker()).toEqual({ at: '35%', future: { keep: true } });
      if (scope.type === 'entity') expect(currentConfig(host, editor).markers[0].at).toEqual({ percent: 100 });
    });

    it(`${host} ${location} retains structured percentage fallback only while Entity is present`, async () => {
      const config = {
        markers: [{ at: { entity: { id: 'sensor.reference', attribute: 'reading' }, percent: 25 }, future: true }],
        ...(scope.type === 'entity' ? {
          entities: [{ entity: 'sensor.row', markers: [{ at: { entity: { id: 'sensor.reference', attribute: 'reading' }, percent: 25 }, future: true }] }],
        } : {}),
      };
      const { editor, section } = await createHost(host, config);
      const readMarker = () => {
        const current = currentConfig(host, editor);
        return scope.type === 'entity' ? current.entities[0].markers[0] : current.markers[0];
      };

      expect(section.render(scope)).toContain('value="25%"');
      section._setGenericMarkerField(scope, 0, 'generic-marker-fixed', '40%');
      expect(readMarker().at).toEqual({ entity: { id: 'sensor.reference', attribute: 'reading' }, percent: 40 });
      section._setGenericMarkerField(scope, 0, 'generic-marker-entity', '');
      expect(readMarker()).toEqual({ at: '40%', future: true });
      expect(section.render(scope)).toContain('value="40%"');
    });
  }
});
