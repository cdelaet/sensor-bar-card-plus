import { describe, expect, it } from 'vitest';
import {
  cloneContainer, cloneDeep, deletePathValue, getPathValue, hasPath, serializeConfig, setPathValue,
} from '../../src/editor/shared/editor-config.js';
import { resolvePaintPreset } from '../../src/view-model/paint-preset-resolver.js';

const hostile = () => JSON.parse('{"__proto__":{"polluted":true},"safe":1}');

describe('prototype-safe editor configuration primitives', () => {
  it('clones __proto__ as owned data without changing object or global prototypes', () => {
    const input = hostile();
    const clone = cloneDeep(input);
    const shallow = cloneContainer(input);

    for (const value of [clone, shallow]) {
      expect(Object.hasOwn(value, '__proto__')).toBe(true);
      expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
      expect(value.__proto__).toEqual({ polluted: true });
      expect(value.polluted).toBeUndefined();
    }
    expect(Object.prototype.polluted).toBeUndefined();
  });

  it('serializes special keys as data and round-trips ordinary configuration', () => {
    const serialized = serializeConfig(cloneDeep(hostile()));
    expect(serialized).toBe('{"__proto__":{"polluted":true},"safe":1}');
    const parsed = JSON.parse(serialized);
    expect(Object.hasOwn(parsed, '__proto__')).toBe(true);
    expect(parsed.__proto__).toEqual({ polluted: true });
    expect(parsed.safe).toBe(1);
    expect(serializeConfig({ z: 1, a: { b: 2 } })).toBe('{"a":{"b":2},"z":1}');
  });

  it('writes and reads __proto__ paths without prototype mutation', () => {
    const next = setPathValue({ safe: 1 }, ['__proto__', 'polluted'], true);

    expect(Object.hasOwn(next, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(next)).toBe(Object.prototype);
    expect(next.polluted).toBeUndefined();
    expect(getPathValue(next, ['__proto__', 'polluted'])).toBe(true);
    expect(hasPath(next, ['__proto__', 'polluted'])).toBe(true);
    expect(Object.prototype.polluted).toBeUndefined();

    const deleted = deletePathValue(next, ['__proto__']);
    expect(Object.hasOwn(deleted, '__proto__')).toBe(false);
    expect(Object.getPrototypeOf(deleted)).toBe(Object.prototype);
  });

  it('does not resolve inherited constructor or prototype properties as configuration', () => {
    expect(getPathValue({}, ['constructor'])).toBeUndefined();
    expect(getPathValue({}, ['__proto__'])).toBeUndefined();
    expect(hasPath({}, ['constructor'])).toBe(false);
    expect(hasPath({}, ['__proto__'])).toBe(false);
  });

  it('resolves a preset named __proto__ as an owned preset', () => {
    const presets = JSON.parse('{"__proto__":{"fill_style":"solid","color":"#123456"}}');
    const result = resolvePaintPreset({
      paint: { preset: '__proto__' },
      registry: { status: 'ready', presets },
    });

    expect(result.source).toBe('preset');
    expect(result.paint).toMatchObject({ fill_style: 'solid', color: '#123456' });
    expect(Object.prototype.polluted).toBeUndefined();
  });
});
