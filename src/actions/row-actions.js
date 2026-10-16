export const ROW_ACTION_SLOTS = Object.freeze([
  'tap_action',
  'hold_action',
  'double_tap_action',
]);

const DEFAULT_ACTIONS = Object.freeze({
  tap_action: Object.freeze({ action: 'more-info' }),
  hold_action: Object.freeze({ action: 'none' }),
  double_tap_action: Object.freeze({ action: 'none' }),
});

const ACTION_NAMES = Object.freeze({
  tap_action: 'tap',
  hold_action: 'hold',
  double_tap_action: 'double_tap',
});

const HOLD_DELAY_MS = 500;
const DOUBLE_TAP_DELAY_MS = 250;

export function resolveRowAction(cardConfig, rowConfig, slot) {
  if (!ROW_ACTION_SLOTS.includes(slot)) return { action: 'none' };
  const row = rowConfig && typeof rowConfig === 'object' && !Array.isArray(rowConfig)
    ? rowConfig
    : null;
  if (row && Object.prototype.hasOwnProperty.call(row, slot)) return row[slot];
  if (Object.prototype.hasOwnProperty.call(cardConfig ?? {}, slot)) return cardConfig[slot];
  return DEFAULT_ACTIONS[slot];
}

export function isRowActionEnabled(actionConfig) {
  return actionConfig?.action !== 'none';
}

function isInteractivePath(event, row) {
  const path = typeof event.composedPath === 'function'
    ? event.composedPath()
    : [event.target];
  for (const node of path) {
    if (!node || node === row) break;
    if (node.nodeType !== 1) continue;
    const tag = node.tagName?.toLowerCase();
    const role = node.getAttribute?.('role');
    if (node.matches?.('button,a,input,select,textarea,summary,[contenteditable="true"],[role="button"],[role="link"],[role="slider"],[role="switch"],[role="checkbox"],[role="radio"]')) return true;
    if (tag?.startsWith('ha-') && node.tabIndex >= 0) return true;
    if (role && ['button', 'link', 'slider', 'switch', 'checkbox', 'radio'].includes(role)) return true;
  }
  return event.defaultPrevented === true;
}

/** Attach the small pointer/keyboard gesture adapter used by standalone rows. */
export function attachRowActionHandlers(row, { resolveAction, dispatchAction, label } = {}) {
  if (!row || typeof row.addEventListener !== 'function' || typeof row.setAttribute !== 'function'
    || typeof row.removeAttribute !== 'function' || typeof resolveAction !== 'function'
    || typeof dispatchAction !== 'function') return () => {};

  const actionFor = (slot) => resolveAction(slot);
  const enabled = (slot) => isRowActionEnabled(actionFor(slot));
  const setFocusable = enabled('tap_action');
  if (setFocusable) {
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    if (label) row.setAttribute('aria-label', label);
  } else {
    row.removeAttribute('role');
    row.removeAttribute('tabindex');
    row.removeAttribute('aria-label');
  }

  let activePointer = null;
  let holdTimer = null;
  let pendingTapTimer = null;
  let pendingTap = false;
  let completedPointerClick = false;
  let completedPointerClickTimer = null;
  let ignoreVirtualClickUntil = 0;

  const clearHold = () => {
    if (holdTimer !== null) clearTimeout(holdTimer);
    holdTimer = null;
  };
  const clearPendingTap = () => {
    if (pendingTapTimer !== null) clearTimeout(pendingTapTimer);
    pendingTapTimer = null;
    pendingTap = false;
  };
  const clearCompletedPointerClick = () => {
    if (completedPointerClickTimer !== null) clearTimeout(completedPointerClickTimer);
    completedPointerClickTimer = null;
    completedPointerClick = false;
  };
  const consumePointerClick = () => {
    clearCompletedPointerClick();
    completedPointerClick = true;
    // Native click follows pointerup in the same interaction. Expire the token
    // after that dispatch so it cannot suppress a later assistive activation.
    completedPointerClickTimer = setTimeout(clearCompletedPointerClick, 0);
  };
  const fire = (slot) => {
    const config = actionFor(slot);
    if (!isRowActionEnabled(config)) return;
    dispatchAction({ config, action: ACTION_NAMES[slot] });
  };

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (isInteractivePath(event, row)) return;
    clearCompletedPointerClick();
    activePointer = { id: event.pointerId, held: false, startedAt: event.timeStamp };
    clearHold();
    // Classify the physical gesture independently of whether its hold action
    // is enabled. `fire` suppresses the configured `none` consequence.
    holdTimer = setTimeout(() => {
      if (!activePointer) return;
      activePointer.held = true;
      clearPendingTap();
      fire('hold_action');
    }, HOLD_DELAY_MS);
  };

  const onPointerUp = (event) => {
    if (!activePointer || (activePointer.id !== undefined && event.pointerId !== activePointer.id)) return;
    const pointer = activePointer;
    const holdThresholdReached = event.timeStamp - pointer.startedAt >= HOLD_DELAY_MS;
    if (holdThresholdReached && !pointer.held) {
      pointer.held = true;
      clearPendingTap();
      fire('hold_action');
    }
    activePointer = null;
    clearHold();
    consumePointerClick();
    if (pointer.held || isInteractivePath(event, row)) return;
    if (enabled('double_tap_action')) {
      if (pendingTap) {
        clearPendingTap();
        fire('double_tap_action');
      } else {
        pendingTap = true;
        pendingTapTimer = setTimeout(() => {
          pendingTap = false;
          pendingTapTimer = null;
          fire('tap_action');
        }, DOUBLE_TAP_DELAY_MS);
      }
      return;
    }
    fire('tap_action');
  };

  const onPointerCancel = () => {
    if (activePointer?.held) consumePointerClick();
    activePointer = null;
    clearHold();
  };

  const onKeyDown = (event) => {
    if (!setFocusable || event.repeat || isInteractivePath(event, row)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    clearCompletedPointerClick();
    ignoreVirtualClickUntil = Date.now() + 500;
    fire('tap_action');
  };

  const onClick = (event) => {
    // Assistive technology can synthesize a click without a pointer sequence.
    // Keyboard activation is handled on keydown and its follow-up click is ignored.
    if (completedPointerClick) {
      clearCompletedPointerClick();
      return;
    }
    if (event.detail !== 0 || Date.now() < ignoreVirtualClickUntil || isInteractivePath(event, row)) return;
    fire('tap_action');
  };

  row.addEventListener('pointerdown', onPointerDown);
  row.addEventListener('pointerup', onPointerUp);
  row.addEventListener('pointercancel', onPointerCancel);
  row.addEventListener('lostpointercapture', onPointerCancel);
  row.addEventListener('keydown', onKeyDown);
  row.addEventListener('click', onClick);

  return () => {
    clearHold();
    clearPendingTap();
    clearCompletedPointerClick();
    row.removeEventListener('pointerdown', onPointerDown);
    row.removeEventListener('pointerup', onPointerUp);
    row.removeEventListener('pointercancel', onPointerCancel);
    row.removeEventListener('lostpointercapture', onPointerCancel);
    row.removeEventListener('keydown', onKeyDown);
    row.removeEventListener('click', onClick);
  };
}
