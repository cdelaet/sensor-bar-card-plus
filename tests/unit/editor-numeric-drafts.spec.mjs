import { it, expect } from 'vitest';
import { NumericInputDrafts } from '../../src/editor/shared/editor-numeric-drafts.js';

it('keeps incomplete native entry local and reconciles the next complete value', () => {
  const drafts = new NumericInputDrafts();
  const input = { id: 'scale-min', type: 'number', dataset: { field: 'scale-min' } };
  for (const value of ['', '-', '.', '-.', '1e', 'NaN', 'Infinity']) {
    input.value = value;
    expect(drafts.handle({ type: 'input', target: input })).toBe(true);
    expect(drafts.values.get(input.id)).toBe(value);
  }
  input.value = '-7.5'; expect(drafts.handle({ type: 'input', target: input })).toBe(false);
  expect(drafts.values.size).toBe(0);
});

it('distinguishes deliberate blank resets from incomplete source percentages and native bad input', () => {
  const drafts = new NumericInputDrafts();
  const input = { id: 'marker-fixed', type: 'number', value: '', dataset: { kind: 'generic-marker-fixed' } };
  expect(drafts.handle({ type: 'input', target: input })).toBe(true);
  expect(drafts.handle({ type: 'change', target: input }, true)).toBe(true);
  expect(drafts.values.get(input.id)).toBe('');
  expect(drafts.handle({ type: 'change', target: input })).toBe(false);
  input.validity = { badInput: true };
  expect(drafts.handle({ type: 'change', target: input })).toBe(true);
  input.validity.badInput = false; input.dataset.kind = 'generic-marker-percent';
  expect(drafts.handle({ type: 'change', target: input })).toBe(true);
  // Reference percentages retain their established finite-number range rules.
  for (const value of ['-1', '101']) { input.value = value; expect(drafts.handle({ type: 'input', target: input })).toBe(false); }
  input.value = '75'; expect(drafts.handle({ type: 'input', target: input })).toBe(false);
});

it('uses existing precision/height validation and leaves section-owned drafts alone', () => {
  const drafts = new NumericInputDrafts();
  const input = { id: 'precision', type: 'number', dataset: { field: 'target-label-precision' } };
  for (const value of ['', '-1', '1.5']) { input.value = value; expect(drafts.handle({ type: 'input', target: input })).toBe(true); }
  input.value = '0'; expect(drafts.handle({ type: 'input', target: input })).toBe(false);
  input.dataset.field = 'layout-height'; input.value = '20'; expect(drafts.handle({ type: 'input', target: input })).toBe(true);
  input.value = '24'; expect(drafts.handle({ type: 'input', target: input })).toBe(false);
  for (const field of ['target-percent', 'baseline-percent', 'gradient-pos', 'entity-gradient-draft-pos']) {
    input.dataset = { field }; input.value = ''; expect(drafts.handle({ type: 'input', target: input })).toBe(false);
  }
});

it('restores owned drafts through DOM replacement, preserves native buffers and resets foreign state', () => {
  const drafts = new NumericInputDrafts();
  let focused;
  const old = { id: 'scale-min', type: 'number', dataset: { field: 'scale-min' }, value: '' };
  const root = { activeElement: old, getElementById: () => old };
  drafts.handle({ type: 'input', target: old }); const focusId = drafts.captureFocus(root);
  old.value = 'native bad-input buffer'; drafts.apply(root); expect(old.value).toBe('native bad-input buffer');
  const next = { value: '50', focus: options => { focused = options; } };
  root.activeElement = null; root.getElementById = () => next; drafts.apply(root, focusId);
  expect(next.value).toBe(''); expect(focused).toEqual({ preventScroll: true });
  drafts.reset(); next.value = '90'; drafts.apply(root); expect(next.value).toBe('90');
  old.isConnected = false; expect(drafts.handle({ type: 'change', target: old })).toBe(true);
});

it('discards source drafts on explicit conversion and removed controls', () => {
  const drafts = new NumericInputDrafts();
  drafts.values.set('card-card-generic-marker-1-percent', '');
  drafts.handle({ target: { id: 'card-card-generic-marker-1-source-mode', dataset: { kind: 'generic-marker-source-mode' } } });
  expect(drafts.values.size).toBe(0);
  drafts.values.set('removed', '-'); drafts.apply({ getElementById: () => null, querySelector: () => null });
  expect(drafts.values.size).toBe(0);
});
