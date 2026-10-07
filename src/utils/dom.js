export function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setStyleIfChanged(el, prop, value) {
  if (!el?.style) return false;
  const nextValue = value == null ? '' : String(value);

  if (prop.startsWith('--')) {
    const currentValue = typeof el.style.getPropertyValue === 'function'
      ? el.style.getPropertyValue(prop)
      : (el.style[prop] ?? '');
    if (currentValue === nextValue) return false;
    if (typeof el.style.setProperty === 'function') {
      el.style.setProperty(prop, nextValue);
    } else {
      el.style[prop] = nextValue;
    }
    return true;
  }

  const currentValue = el.style[prop] ?? '';
  if (currentValue === nextValue) return false;
  el.style[prop] = nextValue;
  return true;
}

export function setStyleTextIfChanged(el, value) {
  if (!el?.style) return false;
  const nextValue = value == null ? '' : String(value);
  const currentValue = el.style.cssText ?? '';
  if (currentValue === nextValue) return false;
  el.style.cssText = nextValue;
  return true;
}

export function setDatasetIfChanged(el, key, value) {
  if (!el?.dataset) return false;
  const nextValue = value == null ? '' : String(value);
  const currentValue = el.dataset[key] ?? '';
  if (currentValue === nextValue) return false;
  el.dataset[key] = nextValue;
  return true;
}

export function setClassNameIfChanged(el, value) {
  if (!el) return false;
  const nextValue = value == null ? '' : String(value);
  if ((el.className ?? '') === nextValue) return false;
  el.className = nextValue;
  return true;
}
