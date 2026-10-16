import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachRowActionHandlers, isRowActionEnabled, resolveRowAction } from '../../src/actions/row-actions.js';

class FakeRow extends EventTarget {
  constructor() {
    super();
    this.nodeType = 1;
    this.tagName = 'DIV';
    this.attributes = new Map();
  }
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  removeAttribute(key) { this.attributes.delete(key); }
  matches() { return false; }
}

function pointer(type, pointerId = 1, timeStamp) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    button: { value: 0 },
  });
  if (timeStamp !== undefined) Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  return event;
}

function virtualClick() {
  const event = new Event('click', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'detail', { value: 0 });
  return event;
}

function fixture(actions = {}) {
  const row = new FakeRow();
  const calls = [];
  const cleanup = attachRowActionHandlers(row, {
    resolveAction: (slot) => actions[slot] ?? { action: slot === 'tap_action' ? 'more-info' : 'none' },
    dispatchAction: (detail) => calls.push(detail),
    label: 'Kitchen temperature',
  });
  return { row, calls, cleanup };
}

function configuredFixture(cardConfig, rowConfig = {}) {
  const row = new FakeRow();
  const calls = [];
  const cleanup = attachRowActionHandlers(row, {
    resolveAction: (slot) => resolveRowAction(cardConfig, rowConfig, slot),
    dispatchAction: (detail) => calls.push(detail),
    label: 'Kitchen temperature',
  });
  return { row, calls, cleanup };
}

afterEach(() => vi.useRealTimers());

describe('standalone row actions', () => {
  it('resolves row, card, and compatibility defaults without materializing config', () => {
    const card = { tap_action: { action: 'toggle', extra: { keep: true } } };
    expect(resolveRowAction(card, {}, 'tap_action')).toBe(card.tap_action);
    expect(resolveRowAction(card, { tap_action: { action: 'none' } }, 'tap_action')).toEqual({ action: 'none' });
    expect(resolveRowAction({}, {}, 'tap_action')).toEqual({ action: 'more-info' });
    expect(resolveRowAction({}, {}, 'hold_action')).toEqual({ action: 'none' });
    expect(isRowActionEnabled({ action: 'future-ha-action', custom: true })).toBe(true);
    expect(isRowActionEnabled({ action: 'none' })).toBe(false);
    expect(card.hold_action).toBeUndefined();
  });

  it('fires an immediate tap if double tap is not enabled', () => {
    vi.useFakeTimers();
    const { row, calls } = fixture();
    row.dispatchEvent(pointer('pointerdown'));
    row.dispatchEvent(pointer('pointerup'));
    expect(calls.map(call => call.action)).toEqual(['tap']);
    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('waits for a configured double tap and emits one double action', () => {
    vi.useFakeTimers();
    const { row, calls } = fixture({ tap_action: { action: 'toggle' }, double_tap_action: { action: 'navigate' } });
    row.dispatchEvent(pointer('pointerdown', 1)); row.dispatchEvent(pointer('pointerup', 1));
    vi.advanceTimersByTime(249);
    expect(calls).toHaveLength(0);
    row.dispatchEvent(pointer('pointerdown', 2)); row.dispatchEvent(pointer('pointerup', 2));
    vi.runOnlyPendingTimers();
    expect(calls.map(call => call.action)).toEqual(['double_tap']);
  });

  it('resolves a configured tap after the double-tap window', () => {
    vi.useFakeTimers();
    const { row, calls } = fixture({ double_tap_action: { action: 'navigate' } });
    row.dispatchEvent(pointer('pointerdown')); row.dispatchEvent(pointer('pointerup'));
    vi.advanceTimersByTime(250);
    expect(calls.map(call => call.action)).toEqual(['tap']);
  });

  it('clears delayed gestures when the row is removed or reconfigured', () => {
    vi.useFakeTimers();
    const { row, calls, cleanup } = fixture({ double_tap_action: { action: 'navigate' } });
    row.dispatchEvent(pointer('pointerdown')); row.dispatchEvent(pointer('pointerup'));
    cleanup();
    vi.advanceTimersByTime(300);
    expect(calls).toHaveLength(0);
  });

  it('fires hold once and cancels the pending tap', () => {
    vi.useFakeTimers();
    const { row, calls } = fixture({ hold_action: { action: 'perform-action' } });
    row.dispatchEvent(pointer('pointerdown'));
    vi.advanceTimersByTime(500);
    row.dispatchEvent(pointer('pointerup'));
    expect(calls.map(call => call.action)).toEqual(['hold']);
  });

  it('classifies a long press at release when the hold timer is delayed', () => {
    vi.useFakeTimers();
    const { row, calls } = fixture({ hold_action: { action: 'perform-action' } });
    row.dispatchEvent(pointer('pointerdown', 1, 1000));
    row.dispatchEvent(pointer('pointerup', 1, 1501));

    expect(calls.map(call => call.action)).toEqual(['hold']);
    vi.runOnlyPendingTimers();
    expect(calls.map(call => call.action)).toEqual(['hold']);
  });

  it.each([
    {
      name: 'explicit none',
      card: { tap_action: { action: 'toggle' }, hold_action: { action: 'none' }, double_tap_action: { action: 'navigate' } },
    },
    {
      name: 'omitted hold action',
      card: { tap_action: { action: 'toggle' }, double_tap_action: { action: 'navigate' } },
    },
  ])('consumes a delayed-timer long press with $name without dispatching tap', ({ card }) => {
    vi.useFakeTimers();
    const { row, calls } = configuredFixture(card);
    row.dispatchEvent(pointer('pointerdown', 1, 2000));
    row.dispatchEvent(pointer('pointerup', 1, 2501));
    vi.advanceTimersByTime(500);
    expect(calls).toHaveLength(0);

    row.dispatchEvent(pointer('pointerdown', 2, 3000));
    row.dispatchEvent(pointer('pointerup', 2, 3010));
    vi.advanceTimersByTime(250);
    expect(calls.map(call => call.action)).toEqual(['tap']);
  });

  it.each(['mouse', 'touch'])('consumes a completed %s hold through release and its compatibility click', (pointerType) => {
    vi.useFakeTimers();
    const { row, calls } = fixture({
      tap_action: { action: 'toggle' },
      hold_action: { action: 'perform-action' },
      double_tap_action: { action: 'navigate' },
    });
    const down = pointer('pointerdown');
    Object.defineProperty(down, 'pointerType', { value: pointerType });
    row.dispatchEvent(down);
    vi.advanceTimersByTime(500);
    row.dispatchEvent(pointer('pointerup'));
    row.dispatchEvent(virtualClick());
    vi.advanceTimersByTime(300);

    expect(calls.map(call => call.action)).toEqual(['hold']);

    // A completed hold leaves no state that can consume the next tap.
    row.dispatchEvent(pointer('pointerdown', 2));
    row.dispatchEvent(pointer('pointerup', 2));
    vi.advanceTimersByTime(250);
    expect(calls.map(call => call.action)).toEqual(['hold', 'tap']);
  });

  it.each([
    {
      name: 'inherited none',
      card: { tap_action: { action: 'more-info' }, hold_action: { action: 'none' } },
      row: {},
    },
    {
      name: 'explicit row none',
      card: { hold_action: { action: 'none' } },
      row: {
        tap_action: { action: 'toggle' },
        hold_action: { action: 'none' },
        double_tap_action: { action: 'more-info' },
      },
    },
    {
      name: 'omitted hold default',
      card: { tap_action: { action: 'more-info' } },
      row: {},
    },
  ])('consumes a long press when hold is $name', ({ card, row: rowConfig }) => {
    vi.useFakeTimers();
    const { row, calls } = configuredFixture(card, rowConfig);
    row.dispatchEvent(pointer('pointerdown'));
    vi.advanceTimersByTime(501);
    row.dispatchEvent(pointer('pointerup'));
    row.dispatchEvent(virtualClick());
    vi.advanceTimersByTime(300);
    expect(calls.map(call => call.action)).toEqual([]);
  });

  it('preserves short tap and double tap when the row hold action is none', () => {
    vi.useFakeTimers();
    const { row, calls } = configuredFixture(
      { hold_action: { action: 'none' } },
      {
        tap_action: { action: 'toggle' },
        hold_action: { action: 'none' },
        double_tap_action: { action: 'more-info' },
      },
    );
    row.dispatchEvent(pointer('pointerdown', 1));
    row.dispatchEvent(pointer('pointerup', 1));
    vi.advanceTimersByTime(250);
    expect(calls.map(call => call.action)).toEqual(['tap']);

    calls.length = 0;
    row.dispatchEvent(pointer('pointerdown', 2));
    row.dispatchEvent(pointer('pointerup', 2));
    vi.advanceTimersByTime(100);
    row.dispatchEvent(pointer('pointerdown', 3));
    row.dispatchEvent(pointer('pointerup', 3));
    vi.advanceTimersByTime(300);
    expect(calls.map(call => call.action)).toEqual(['double_tap']);
  });

  it.each([
    { action: 'call-service', service: 'light.turn_on', service_data: { brightness: 55 }, target: { entity_id: 'light.room' } },
    { action: 'assist', pipeline_id: 'conversation.test', custom_field: true },
  ])('forwards HA action objects unchanged ($action)', (actionConfig) => {
    const { row, calls } = fixture({ tap_action: actionConfig });
    row.dispatchEvent(pointer('pointerdown')); row.dispatchEvent(pointer('pointerup'));
    expect(calls).toEqual([{ config: actionConfig, action: 'tap' }]);
  });

  it('cancels an interrupted pointer gesture', () => {
    vi.useFakeTimers();
    const { row, calls } = fixture();
    row.dispatchEvent(pointer('pointerdown'));
    row.dispatchEvent(pointer('pointercancel'));
    row.dispatchEvent(pointer('pointerup'));
    expect(calls).toHaveLength(0);
  });

  it('maps Enter and Space to tap once and gives enabled rows button focus semantics', () => {
    const { row, calls } = fixture();
    for (const key of ['Enter', ' ']) {
      const event = new Event('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'key', { value: key });
      row.dispatchEvent(event);
    }
    expect(calls.map(call => call.action)).toEqual(['tap', 'tap']);
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('tabindex')).toBe('0');
  });

  it('does not make a row focusable when tap is explicitly none', () => {
    const { row, calls } = fixture({ tap_action: { action: 'none' } });
    const event = new Event('keydown', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'key', { value: 'Enter' });
    row.dispatchEvent(event);
    expect(calls).toHaveLength(0);
    expect(row.getAttribute('tabindex')).toBeNull();
  });
});
