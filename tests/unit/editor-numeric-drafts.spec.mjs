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

it('distinguishes deliberate native blank resets from incomplete drafts and bad input', () => {
  const drafts = new NumericInputDrafts();
  const input = { id: 'scale-min', type: 'number', value: '', dataset: { field: 'scale-min' } };
  expect(drafts.handle({ type: 'input', target: input })).toBe(true);
  expect(drafts.handle({ type: 'change', target: input }, true)).toBe(true);
  expect(drafts.values.get(input.id)).toBe('');
  expect(drafts.handle({ type: 'change', target: input })).toBe(false);
  input.validity = { badInput: true };
  expect(drafts.handle({ type: 'change', target: input })).toBe(true);
});

it('keeps incomplete Value text local while accepting numeric and percent-suffixed entries', () => {
  const drafts = new NumericInputDrafts();
  const input = { id: 'marker-value', type: 'text', dataset: { kind: 'generic-marker-fixed' } };
  for (const value of ['-', '.', '25x', '-1%', '101%']) {
    input.value = value;
    expect(drafts.handle({ type: 'input', target: input })).toBe(true);
    expect(drafts.values.get(input.id)).toBe(value);
  }
  for (const value of ['25', '25%', '0%', '100%']) {
    input.value = value;
    expect(drafts.handle({ type: 'input', target: input })).toBe(false);
    expect(drafts.values.has(input.id)).toBe(false);
  }
  input.value = '';
  expect(drafts.handle({ type: 'input', target: input })).toBe(true);
  expect(drafts.handle({ type: 'change', target: input })).toBe(false);
});

it('ignores Reference Value change events caused by rendering a focused incomplete draft', () => {
  const drafts = new NumericInputDrafts();
  const input = { id: 'marker-value', type: 'text', value: '', dataset: { kind: 'generic-marker-fixed' } };
  drafts.values.set(input.id, '');
  expect(drafts.handle({ type: 'change', target: input }, true)).toBe(true);
  expect(drafts.values.get(input.id)).toBe('');
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

it('discards drafts for controls removed from the editor', () => {
  const drafts = new NumericInputDrafts();
  drafts.values.set('removed', '-'); drafts.apply({ getElementById: () => null, querySelector: () => null });
  expect(drafts.values.size).toBe(0);
});
