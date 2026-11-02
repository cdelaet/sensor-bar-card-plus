import { describe, expect, it } from 'vitest';
import { readResolvableSourceParts, updateResolvableSourceParts, writeResolvableSourceParts } from '../../src/editor/shared/resolvable-source.js';
import { renderResolvableSourceControls } from '../../src/editor/shared/resolvable-source-controls.js';
import { normalizeStructuredResolvableValue } from '../../src/config/normalize.js';
import { createEditor } from '../support/load-card-class.cjs';
import { patchFeatureTargetSource, patchFeatureBaselineSource } from '../../src/feature/feature-editor-config.js';
import { patchFeatureTargetField } from '../../src/feature/feature-editor-target.js';
import { patchFeatureBaselineField } from '../../src/feature/feature-editor-needle-baseline.js';
import { patchFeatureReferenceMarkerSource, patchFeatureReferenceMarker } from '../../src/feature/feature-editor-reference-markers.js';

const cardRoot = { type: 'card' };
const cardEntity = { type: 'entity', index: 0 };

describe('shared resolvable source operations', () => {
  it('reads scalar, alias, percentage, entity/attribute and unknown source properties', () => {
    expect(readResolvableSourceParts('25%')).toMatchObject({ percent: 25 });
    expect(readResolvableSourceParts(0)).toMatchObject({ fixed: 0 });
    expect(readResolvableSourceParts({ value: 30, entity: { id: 'sensor.room', attribute: 'reading' }, future: { keep: true } }))
      .toEqual({ fixed: 30, entity: 'sensor.room', attribute: 'reading', unknown: { future: { keep: true } } });
  });

  it('switches fixed and percentage Value atomically while preserving Entity and unknown properties', () => {
    const original = { fixed: 25, percent: 40, entity: { id: 'sensor.room', attribute: 'reading' }, future: true };
    const parts = readResolvableSourceParts(original);
    const percent = updateResolvableSourceParts(parts, 'value', '25%');
    expect(percent.valid).toBe(true);
    expect(writeResolvableSourceParts(percent.parts)).toEqual({ entity: { id: 'sensor.room', attribute: 'reading' }, percent: 25, future: true });
    const fixed = updateResolvableSourceParts(percent.parts, 'value', '0');
    expect(writeResolvableSourceParts(fixed.parts)).toEqual({ entity: { id: 'sensor.room', attribute: 'reading' }, fixed: 0, future: true });
    expect(original).toEqual({ fixed: 25, percent: 40, entity: { id: 'sensor.room', attribute: 'reading' }, future: true });
  });

  it('updates and clears Entity/Attribute without dropping fallback or unknown properties', () => {
    const parts = readResolvableSourceParts({ percent: 20, entity: { id: 'sensor.room', attribute: 'reading' }, future: true });
    const changedEntity = updateResolvableSourceParts(parts, 'entity', 'sensor.next');
    expect(writeResolvableSourceParts(changedEntity.parts)).toEqual({ percent: 20, entity: { id: 'sensor.next', attribute: 'reading' }, future: true });
    const changedAttribute = updateResolvableSourceParts(changedEntity.parts, 'attribute', 'temperature');
    expect(writeResolvableSourceParts(changedAttribute.parts)).toEqual({ percent: 20, entity: { id: 'sensor.next', attribute: 'temperature' }, future: true });
    const clearedEntity = updateResolvableSourceParts(changedAttribute.parts, 'entity', '');
    expect(writeResolvableSourceParts(clearedEntity.parts)).toEqual({ percent: 20, future: true });
  });

  it('rejects invalid drafts without altering the saved source parts', () => {
    const parts = readResolvableSourceParts({ fixed: 50, entity: 'sensor.room', future: true });
    const update = updateResolvableSourceParts(parts, 'value', '-');
    expect(update.valid).toBe(false);
    expect(update.parts).toBe(parts);
    expect(writeResolvableSourceParts(parts)).toEqual({ fixed: 50, entity: 'sensor.room', future: true });
  });

  it.each([
    ['unexpected nested Entity property', { entity: { id: 'sensor.invalid', extra: 'keep' }, fixed: 5, future: true }],
    ['top-level sibling Attribute', { entity: 'sensor.invalid', attribute: 'temperature', fixed: 5, future: true }],
  ])('preserves %s as invalid through Value edits and permits explicit Entity replacement', (_name, raw) => {
    expect(normalizeStructuredResolvableValue(raw).entity_invalid).toBe(true);
    const parts = readResolvableSourceParts(raw);
    expect(writeResolvableSourceParts(parts)).toEqual(raw);
    const editedValue = updateResolvableSourceParts(parts, 'value', '25%');
    const preserved = writeResolvableSourceParts(editedValue.parts);
    expect(preserved).toMatchObject({ entity: raw.entity, ...(raw.attribute ? { attribute: raw.attribute } : {}), percent: 25, future: true });
    expect(normalizeStructuredResolvableValue(preserved).entity_invalid).toBe(true);

    const repaired = updateResolvableSourceParts(editedValue.parts, 'entity', 'sensor.replacement');
    const valid = writeResolvableSourceParts(repaired.parts);
    expect(valid).toMatchObject({ entity: 'sensor.replacement', percent: 25, future: true });
    expect(valid).not.toHaveProperty('attribute');
    expect(normalizeStructuredResolvableValue(valid).entity_invalid).toBeUndefined();
  });

  it('reads and retains out-of-range stored percentages while keeping new input validation', () => {
    for (const raw of [{ percent: 101 }, { percent: -1 }, '101%']) {
      const parts = readResolvableSourceParts(raw);
      const expected = raw === '101%' ? 101 : raw.percent;
      expect(parts.percent).toBe(expected);
      const rendered = renderResolvableSourceControls({ source: parts, value: { id: 'value', field: 'value' }, entity: { kind: 'entity', index: 'card' }, attribute: { kind: 'attribute', index: 'card' } });
      expect(rendered).toContain(`value="${expected}%"`);
      const withEntity = updateResolvableSourceParts(parts, 'entity', 'sensor.room');
      expect(writeResolvableSourceParts(withEntity.parts)).toMatchObject({ percent: expected, entity: 'sensor.room' });
      const withAttribute = updateResolvableSourceParts(withEntity.parts, 'attribute', 'temperature');
      expect(writeResolvableSourceParts(withAttribute.parts)).toMatchObject({ percent: expected, entity: { id: 'sensor.room', attribute: 'temperature' } });
    }
    const invalid = updateResolvableSourceParts(readResolvableSourceParts({ percent: 10 }), 'value', '101%');
    expect(invalid.valid).toBe(false);
    expect(writeResolvableSourceParts(invalid.parts)).toEqual({ percent: 10 });
  });
});

describe('shared source preservation through editor adapters', () => {
  const cases = [
    { name: 'Target', rawConfig: raw => ({ target: { at: raw } }), get: config => config.target.at,
      cardValue: (editor, scope) => editor._setTargetResolvablePart(scope, 'value', '25%'),
      cardInvalidValue: (editor, scope) => editor._setTargetResolvablePart(scope, 'value', '101%'),
      cardEntity: (editor, scope) => editor._setTargetResolvablePart(scope, 'entity', 'sensor.replacement'),
      cardPresentation: (editor, scope) => editor._setTargetShape(scope, 'diamond'),
      featureValue: (config, rawValue) => patchFeatureTargetSource(config, 'value', rawValue),
      featureInvalidValue: config => patchFeatureTargetSource(config, 'value', '101%'),
      featureEntity: config => patchFeatureTargetSource(config, 'entity', 'sensor.replacement'),
      featurePresentation: config => patchFeatureTargetField(config, { path: ['shape'], value: 'diamond' }),
      cardAttribute: (editor, scope) => editor._setTargetResolvablePart(scope, 'attribute', 'temperature'),
      featureAttribute: config => patchFeatureTargetSource(config, 'attribute', 'temperature'),
    },
    { name: 'Baseline', rawConfig: raw => ({ baseline: { at: raw } }), get: config => config.baseline.at,
      cardValue: (editor, scope) => editor._setBaselineResolvablePart(scope, 'value', '25%'),
      cardInvalidValue: (editor, scope) => editor._setBaselineResolvablePart(scope, 'value', '101%'),
      cardEntity: (editor, scope) => editor._setBaselineResolvablePart(scope, 'entity', 'sensor.replacement'),
      cardPresentation: (editor, scope) => editor._setBaselineDirectionalColor(scope, 'above', 'red'),
      featureValue: (config, rawValue) => patchFeatureBaselineSource(config, 'value', rawValue),
      featureInvalidValue: config => patchFeatureBaselineSource(config, 'value', '101%'),
      featureEntity: config => patchFeatureBaselineSource(config, 'entity', 'sensor.replacement'),
      featurePresentation: config => patchFeatureBaselineField(config, { path: ['above', 'color'], value: 'red' }),
      cardAttribute: (editor, scope) => editor._setBaselineResolvablePart(scope, 'attribute', 'temperature'),
      featureAttribute: config => patchFeatureBaselineSource(config, 'attribute', 'temperature'),
    },
    { name: 'Reference Marker', rawConfig: raw => ({ markers: [{ at: raw }] }), get: config => config.markers[0].at,
      cardValue: (editor, scope) => editor._setGenericMarkerField(scope, 0, 'generic-marker-fixed', '25%'),
      cardInvalidValue: (editor, scope) => editor._setGenericMarkerField(scope, 0, 'generic-marker-fixed', '101%'),
      cardEntity: (editor, scope) => editor._setGenericMarkerField(scope, 0, 'generic-marker-entity', 'sensor.replacement'),
      cardPresentation: (editor, scope) => editor._setGenericMarkerField(scope, 0, 'generic-marker-shape', 'diamond'),
      featureValue: (config, rawValue) => patchFeatureReferenceMarkerSource(config, 0, 'value', rawValue),
      featureInvalidValue: config => patchFeatureReferenceMarkerSource(config, 0, 'value', '101%'),
      featureEntity: config => patchFeatureReferenceMarkerSource(config, 0, 'entity', 'sensor.replacement'),
      featurePresentation: config => patchFeatureReferenceMarker(config, { type: 'field', index: 0, path: ['shape'], value: 'diamond' }),
      cardAttribute: (editor, scope) => editor._setGenericMarkerField(scope, 0, 'generic-marker-attribute', 'temperature'),
      featureAttribute: config => patchFeatureReferenceMarkerSource(config, 0, 'attribute', 'temperature'),
    },
  ];

  for (const item of cases) {
    for (const [invalidName, raw] of [
      ['nested extra', { entity: { id: 'sensor.invalid', extra: 'keep' }, fixed: 5, future: { retain: true } }],
      ['sibling attribute', { entity: 'sensor.invalid', attribute: 'temperature', fixed: 5, future: { retain: true } }],
    ]) {
      it(`${item.name} Card root and entity preserve ${invalidName} through Value/presentation edits and allow explicit replacement`, () => {
        for (const source of ['src', 'dist']) for (const scope of [cardRoot, cardEntity]) {
          const config = item.rawConfig(raw);
          if (scope.type === 'entity') config.entities = [{ entity: 'sensor.row', ...item.rawConfig(raw) }];
          const editor = createEditor({ source });
          editor.setConfig(config);
          item.cardValue(editor, scope);
          let at = scope.type === 'card' ? item.get(editor._draftConfig) : item.get(editor._draftConfig.entities[0]);
          expect(at).toMatchObject({ entity: raw.entity, ...(raw.attribute ? { attribute: raw.attribute } : {}), percent: 25, future: raw.future });
          expect(at).not.toHaveProperty('fixed');
          expect(normalizeStructuredResolvableValue(at).entity_invalid).toBe(true);
          item.cardPresentation(editor, scope);
          at = scope.type === 'card' ? item.get(editor._draftConfig) : item.get(editor._draftConfig.entities[0]);
          expect(normalizeStructuredResolvableValue(at).entity_invalid).toBe(true);
          expect(at.future).toEqual(raw.future);
          item.cardEntity(editor, scope);
          at = scope.type === 'card' ? item.get(editor._draftConfig) : item.get(editor._draftConfig.entities[0]);
          expect(normalizeStructuredResolvableValue(at).entity_invalid).toBeUndefined();
          expect(at.entity).toEqual('sensor.replacement');
          expect(at.future).toEqual(raw.future);
        }
      });

      it(`${item.name} Feature preserves ${invalidName} through Value/presentation edits and permits explicit repair`, () => {
        const config = item.rawConfig(raw);
        const valueEdited = item.featureValue(config, '25%');
        const sourceAfterValue = item.get(valueEdited);
        expect(normalizeStructuredResolvableValue(sourceAfterValue).entity_invalid).toBe(true);
        const presentationEdited = item.featurePresentation(valueEdited);
        const sourceAfterPresentation = item.get(presentationEdited);
        expect(normalizeStructuredResolvableValue(sourceAfterPresentation).entity_invalid).toBe(true);
        expect(sourceAfterPresentation.future).toEqual(raw.future);
        const repaired = item.featureEntity(presentationEdited);
        expect(normalizeStructuredResolvableValue(item.get(repaired)).entity_invalid).toBeUndefined();
        expect(item.get(repaired).entity).toBe('sensor.replacement');
        expect(item.get(repaired).future).toEqual(raw.future);
      });
    }

    it(`${item.name} rejects a new out-of-range percentage without replacing the saved fallback`, () => {
      const raw = { entity: { id: 'sensor.room', attribute: 'temperature' }, fixed: 5, future: true };
      for (const scope of [cardRoot, cardEntity]) {
        const config = item.rawConfig(raw);
        if (scope.type === 'entity') config.entities = [{ entity: 'sensor.row', ...item.rawConfig(raw) }];
        for (const source of ['src', 'dist']) {
          const editor = createEditor({ source }); editor.setConfig(config);
          const before = scope.type === 'card' ? item.get(editor._draftConfig) : item.get(editor._draftConfig.entities[0]);
          item.cardInvalidValue(editor, scope);
          const after = scope.type === 'card' ? item.get(editor._draftConfig) : item.get(editor._draftConfig.entities[0]);
          expect(after).toEqual(before);
        }
      }
      const featureConfig = item.rawConfig(raw);
      expect(item.featureInvalidValue(featureConfig)).toEqual(featureConfig);
    });

    it(`${item.name} retains 101 and -1 percentage fallbacks through Entity/Attribute edits in Card and Feature`, () => {
      for (const percent of [101, -1]) {
        for (const scope of [cardRoot, cardEntity]) {
          const raw = { entity: 'sensor.room', percent, future: true };
          const config = item.rawConfig(raw);
          if (scope.type === 'entity') config.entities = [{ entity: 'sensor.row', ...item.rawConfig(raw) }];
          const editor = createEditor({ source: 'dist' }); editor.setConfig(config);
          item.cardEntity(editor, scope);
          const hostConfig = scope.type === 'card' ? editor._draftConfig : editor._draftConfig.entities[0];
          expect(item.get(hostConfig).percent).toBe(percent);
          const attributeEdited = item.rawConfig(raw);
          const featureEdited = item.featureEntity(attributeEdited);
          expect(item.get(featureEdited).percent).toBe(percent);
          const featureAttributeEdited = item.featureAttribute(featureEdited);
          expect(item.get(featureAttributeEdited).percent).toBe(percent);
          item.cardAttribute(editor, scope);
          expect(item.get(scope.type === 'card' ? editor._draftConfig : editor._draftConfig.entities[0]).percent).toBe(percent);
        }
      }
      for (const scope of [cardRoot, cardEntity]) {
        const config = item.rawConfig('101%');
        if (scope.type === 'entity') config.entities = [{ entity: 'sensor.row', ...item.rawConfig('101%') }];
        const editor = createEditor({ source: 'dist' }); editor.setConfig(config);
        item.cardEntity(editor, scope);
        const hostConfig = scope.type === 'card' ? editor._draftConfig : editor._draftConfig.entities[0];
        expect(item.get(hostConfig).percent).toBe(101);
        const featureEdited = item.featureEntity(item.rawConfig('101%'));
        expect(item.get(featureEdited).percent).toBe(101);
        const featureAttributeEdited = item.featureAttribute(featureEdited);
        expect(item.get(featureAttributeEdited).percent).toBe(101);
        item.cardAttribute(editor, scope);
        expect(item.get(scope.type === 'card' ? editor._draftConfig : editor._draftConfig.entities[0]).percent).toBe(101);
      }
    });
  }
});

describe('shared resolvable source controls', () => {
  it.each([
    ['Target Card', { field: 'target-value' }, { kind: 'target-entity-source', index: 'card' }, { kind: 'target-attribute', index: 'card' }],
    ['Target entity', { kind: 'entity-target-value', index: 0 }, { kind: 'entity-target-entity-source', index: 0 }, { kind: 'entity-target-attribute', index: 0 }],
    ['Baseline Card Feature', { field: 'baseline-value' }, { kind: 'baseline-entity-source', index: 'card' }, { kind: 'baseline-attribute', index: 'card' }],
    ['Reference Marker', { kind: 'generic-marker-fixed', index: 'card', extraDataset: { 'scope-type': 'card', 'marker-index': 0 } }, { kind: 'generic-marker-entity', index: 'card', extraDataset: { 'scope-type': 'card', 'marker-index': 0 } }, { kind: 'generic-marker-attribute', index: 'card', extraDataset: { 'scope-type': 'card', 'marker-index': 0 } }],
  ])('renders the same three source controls for %s', (_name, value, entity, attribute) => {
    const markup = renderResolvableSourceControls({
      source: { entity: 'sensor.room', attribute: 'reading', percent: 25 }, value, entity, attribute,
    });
    expect(markup).toContain('class="field-row resolvable-source-value"');
    expect(markup).toContain('data-resolvable-source-value="true"');
    expect(markup).toContain('placeholder="25 or 25%"');
    expect(markup).toContain('value="25%"');
    expect(markup).toContain('class="field-row resolvable-source-entity"');
    expect(markup).toContain('class="field-row resolvable-source-attribute"');
    expect(markup).toContain('sensor.room');
    expect(markup).toContain('reading');
  });
});
