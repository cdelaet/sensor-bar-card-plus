const OPEN_DELAY_MS = 150;
const CONTROLLER_KEY = '__sbcpTooltipController';

const tooltipStyles = `
  .sbcp-tooltip {
    position: fixed;
    right: auto;
    bottom: auto;
    margin: 0;
    z-index: 2147483647;
    box-sizing: border-box;
    max-width: min(20rem, calc(100vw - 16px));
    padding: 6px 9px;
    border: 1px solid var(--divider-color, rgba(127,127,127,.45));
    border-radius: 5px;
    background: var(--primary-background-color, #fff);
    color: var(--primary-text-color, #222);
    box-shadow: 0 2px 10px rgba(0,0,0,.24);
    font: 12px/1.4 sans-serif;
    overflow-wrap: anywhere;
    pointer-events: none;
  }
  .sbcp-tooltip[hidden] { display: none; }
  @media (prefers-reduced-motion: reduce) {
    .sbcp-tooltip { transition: none; }
  }
`;

let nextTooltipId = 0;

function triggerFrom(event, root) {
  const trigger = event.target?.closest?.('[data-sbcp-tooltip]');
  return trigger && root.contains(trigger) ? trigger : null;
}

/** One delegated tooltip per Card or Feature shadow root. */
export function attachTooltips(root) {
  if (!root?.ownerDocument?.createElement || !root.addEventListener) return null;
  if (root[CONTROLLER_KEY]) return root[CONTROLLER_KEY];
  const controller = new HistoryTooltipController(root);
  root[CONTROLLER_KEY] = controller;
  return controller;
}

class HistoryTooltipController {
  constructor(root) {
    this.root = root;
    this.document = root.ownerDocument;
    this.window = this.document.defaultView;
    this.style = this.document.createElement('style');
    this.style.textContent = tooltipStyles;
    this.tooltip = this.document.createElement('div');
    this.tooltip.className = 'sbcp-tooltip';
    this.tooltip.id = `sbcp-tooltip-${++nextTooltipId}`;
    this.tooltip.setAttribute('role', 'tooltip');
    this.usesTopLayer = typeof this.tooltip.showPopover === 'function';
    if (this.usesTopLayer) this.tooltip.setAttribute('popover', 'manual');
    this.tooltip.hidden = true;
    root.append(this.style, this.tooltip);
    this.observer = new this.window.MutationObserver(records => {
      if (!this.trigger) return;
      if (!this.trigger.isConnected) { this.hide(); return; }
      if (records.some(record => record.type === 'attributes' && record.target === this.trigger)) {
        const text = this.trigger.getAttribute('data-sbcp-tooltip')?.trim();
        if (!text) { this.hide(); return; }
        this.tooltip.textContent = text;
        this.position();
      }
    });
    this.observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-sbcp-tooltip'] });
    this.timer = null;
    this.trigger = null;
    this.destroyed = false;
    this.onPointerOver = event => {
      if (event.pointerType === 'touch') return;
      const trigger = triggerFrom(event, root);
      if (!trigger || trigger.contains(event.relatedTarget)) return;
      this.schedule(trigger);
    };
    this.onPointerOut = event => {
      if (event.pointerType === 'touch') return;
      const trigger = triggerFrom(event, root);
      if (!trigger || trigger.contains(event.relatedTarget)) return;
      this.hide();
    };
    this.onFocusIn = event => {
      const trigger = triggerFrom(event, root);
      if (trigger) this.schedule(trigger);
    };
    this.onFocusOut = event => {
      if (triggerFrom(event, root)) this.hide();
    };
    this.onPointerDown = event => {
      if (event.pointerType !== 'touch') return;
      const trigger = triggerFrom(event, root);
      if (trigger && this.trigger === trigger && !this.tooltip.hidden) this.hide();
      else if (trigger) this.show(trigger);
      else this.hide();
    };
    this.onViewportChange = () => this.position();
    root.addEventListener('pointerover', this.onPointerOver);
    root.addEventListener('pointerout', this.onPointerOut);
    root.addEventListener('focusin', this.onFocusIn);
    root.addEventListener('focusout', this.onFocusOut);
    root.addEventListener('pointerdown', this.onPointerDown);
    this.window?.addEventListener('resize', this.onViewportChange, { passive: true });
    this.window?.addEventListener('scroll', this.onViewportChange, { passive: true, capture: true });
  }

  schedule(trigger) {
    this.cancelTimer();
    this.timer = this.window.setTimeout(() => this.show(trigger), OPEN_DELAY_MS);
  }

  cancelTimer() {
    if (this.timer !== null) this.window.clearTimeout(this.timer);
    this.timer = null;
  }

  show(trigger) {
    this.cancelTimer();
    const text = trigger?.getAttribute('data-sbcp-tooltip')?.trim();
    if (!text || !trigger.isConnected) return this.hide();
    if (this.trigger && this.trigger !== trigger) this.removeDescription(this.trigger);
    this.trigger = trigger;
    this.tooltip.textContent = text;
    this.tooltip.hidden = false;
    if (this.usesTopLayer && !this.tooltip.matches(':popover-open')) this.tooltip.showPopover();
    this.addDescription(trigger);
    this.position();
  }

  addDescription(trigger) {
    const ids = new Set((trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
    ids.add(this.tooltip.id);
    trigger.setAttribute('aria-describedby', [...ids].join(' '));
  }

  removeDescription(trigger) {
    const ids = (trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== this.tooltip.id);
    if (ids.length) trigger.setAttribute('aria-describedby', ids.join(' '));
    else trigger.removeAttribute('aria-describedby');
  }

  position() {
    if (!this.trigger || this.tooltip.hidden) return;
    const rect = this.trigger.getBoundingClientRect();
    const margin = 8;
    const gap = 7;
    this.tooltip.style.visibility = 'hidden';
    this.tooltip.style.left = '0px';
    this.tooltip.style.top = '0px';
    const tip = this.tooltip.getBoundingClientRect();
    const viewportWidth = this.window?.innerWidth ?? this.document.documentElement.clientWidth;
    const viewportHeight = this.window?.innerHeight ?? this.document.documentElement.clientHeight;
    const left = Math.max(margin, Math.min((rect.left + rect.right - tip.width) / 2, viewportWidth - tip.width - margin));
    const above = rect.top - tip.height - gap;
    const below = rect.bottom + gap;
    let top;
    let placement;
    if (above >= margin) { top = above; placement = 'above'; }
    else if (below + tip.height <= viewportHeight - margin) { top = below; placement = 'below'; }
    else if (above > viewportHeight - below) { top = Math.max(margin, above); placement = 'above'; }
    else { top = Math.min(below, viewportHeight - tip.height - margin); placement = 'below'; }
    this.tooltip.dataset.placement = placement;
    const fixedPosition = this.usesTopLayer
      ? { left, top: Math.max(margin, top) }
      : this.toFixedContainingBlock(left, Math.max(margin, top));
    this.tooltip.style.left = `${fixedPosition.left}px`;
    this.tooltip.style.top = `${fixedPosition.top}px`;
    this.tooltip.style.visibility = 'visible';
  }

  toFixedContainingBlock(left, top) {
    // A transformed preview ancestor becomes the containing block for fixed
    // descendants. Convert viewport coordinates into that block's local space.
    const containingBlock = this.tooltip.offsetParent;
    if (!containingBlock) return { left, top };
    const rect = containingBlock.getBoundingClientRect();
    const scaleX = rect.width && containingBlock.offsetWidth ? rect.width / containingBlock.offsetWidth : 1;
    const scaleY = rect.height && containingBlock.offsetHeight ? rect.height / containingBlock.offsetHeight : 1;
    return {
      left: (left - rect.left) / scaleX - containingBlock.clientLeft + containingBlock.scrollLeft,
      top: (top - rect.top) / scaleY - containingBlock.clientTop + containingBlock.scrollTop,
    };
  }

  hide() {
    this.cancelTimer();
    if (this.trigger) this.removeDescription(this.trigger);
    this.trigger = null;
    if (this.usesTopLayer && this.tooltip.matches(':popover-open')) this.tooltip.hidePopover();
    this.tooltip.hidden = true;
    this.tooltip.textContent = '';
    this.tooltip.style.visibility = '';
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.hide();
    this.root.removeEventListener('pointerover', this.onPointerOver);
    this.root.removeEventListener('pointerout', this.onPointerOut);
    this.root.removeEventListener('focusin', this.onFocusIn);
    this.root.removeEventListener('focusout', this.onFocusOut);
    this.root.removeEventListener('pointerdown', this.onPointerDown);
    this.window?.removeEventListener('resize', this.onViewportChange);
    this.window?.removeEventListener('scroll', this.onViewportChange, true);
    this.observer.disconnect();
    this.tooltip.remove();
    this.style.remove();
    delete this.root[CONTROLLER_KEY];
  }
}
