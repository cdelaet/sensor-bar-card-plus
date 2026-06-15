import { describe, expect, it } from 'vitest';
import { createCard } from '../support/load-card-class.cjs';
import { validateNormalizedConfig } from '../../src/config/validate.js';

function normalize(rawConfig) {
  const card = createCard();
  return card.normalizeCardConfig(rawConfig);
}

describe('validateNormalizedConfig', () => {
  it('returns no warnings or errors for a valid config', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      scale: {
        min: { fixed: 0 },
        max: { fixed: 100 },
      },
      target: {
        at: { fixed: 50 },
      },
      baseline: {
        at: { fixed: 0 },
      },
    }));

    expect(diagnostics).toEqual({ warnings: [], errors: [] });
  });

  it('warns when card-level fixed min is greater than max', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      min: 100,
      max: 0,
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'scale.min_gt_max',
      path: 'card',
      entity: null,
    }));
  });

  it('warns when entity-level fixed min is greater than max', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{
        entity: 'sensor.one',
        min: 100,
        max: 0,
      }],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'scale.min_gt_max',
      path: 'entities[0]',
      entity: 'sensor.one',
    }));
  });

  it('warns when a fixed target is outside the fixed scale range', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      min: 0,
      max: 100,
      target: 120,
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'target.outside_scale',
      path: 'card',
    }));
  });

  it('warns when a fixed baseline is outside the fixed scale range', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      min: 0,
      max: 100,
      baseline: 120,
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'baseline.outside_scale',
      path: 'card',
    }));
  });

  it('warns when a segment starts above its end', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: {
        segments: [
          { from: 80, to: 20, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.from_gt_to',
      path: 'card.bar.segments[0]',
    }));
  });

  it('warns when a fixed segment boundary is outside the fixed scale range', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      min: 0,
      max: 100,
      entities: [{ entity: 'sensor.one' }],
      bar: {
        segments: [
          { from: -10, to: 50, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.outside_scale',
      path: 'card.bar.segments[0]',
    }));
  });

  it('warns when fixed segments overlap', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: {
        segments: [
          { from: 0, to: 60, color: '#00ff00' },
          { from: 50, to: 100, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'segments.overlap',
      path: 'card.bar.segments[1]',
    }));
  });

  it('warns when multiple gradient stops share the same position', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: {
        gradient_stops: [
          { pos: 0, color: '#00ff00' },
          { pos: 50, color: '#ffaa00' },
          { pos: 50, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'duplicate-gradient-stop-position',
      path: 'card.bar.gradient_stops[2]',
      entity: null,
    }));
  });

  it('does not warn on distinct gradient stop positions', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [{ entity: 'sensor.one' }],
      bar: {
        gradient_stops: [
          { pos: 0, color: '#00ff00' },
          { pos: 50, color: '#ffaa00' },
          { pos: 100, color: '#ff0000' },
        ],
      },
    }));

    expect(diagnostics.warnings.some((warning) => (
      warning.code === 'duplicate-gradient-stop-position'
    ))).toBe(false);
  });

  it('does not warn on fixed-range checks when values are entity-backed', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      min_entity: 'sensor.min',
      max_entity: 'sensor.max',
      target_entity: 'sensor.target',
      baseline: 'sensor.baseline',
      entities: [{ entity: 'sensor.one' }],
    }));

    expect(diagnostics.warnings.some((warning) => (
      warning.code === 'scale.min_gt_max'
      || warning.code === 'target.outside_scale'
      || warning.code === 'baseline.outside_scale'
    ))).toBe(false);
  });

  it('warns on duplicate entity ids', () => {
    const diagnostics = validateNormalizedConfig(normalize({
      entities: [
        { entity: 'sensor.one' },
        { entity: 'sensor.one' },
      ],
    }));

    expect(diagnostics.warnings).toContainEqual(expect.objectContaining({
      code: 'entities.duplicate_entity',
      path: 'entities[1]',
      entity: 'sensor.one',
    }));
  });
});
