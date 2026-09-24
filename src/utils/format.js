export function formatNumericDisplay(rawVal, decimal = null) {
  if (!Number.isFinite(rawVal)) return String(rawVal);
  if (decimal !== null) {
    return rawVal.toLocaleString(undefined, {
      minimumFractionDigits: decimal,
      maximumFractionDigits: decimal,
    });
  }
  return rawVal.toLocaleString();
}

export function isTightUnit(unit) {
  return ['h', 'm', 's'].includes(String(unit || '').trim());
}

export function formatDisplayWithUnit(display, unit) {
  if (!unit) return String(display);
  const cleanUnit = String(unit);
  return `${display}${isTightUnit(cleanUnit) ? '' : ' '}${cleanUnit}`;
}

export function createNumericPresentation(value, unit, decimal = null) {
  const number = formatNumericDisplay(value, decimal);
  const cleanUnit = unit ? String(unit) : '';
  return {
    value,
    number,
    unit: cleanUnit,
    text: formatDisplayWithUnit(number, cleanUnit),
  };
}

export function createMarkerLabelPresentation(value, unit, precision = null, options = {}) {
  const semanticText = typeof options.text === 'string' ? options.text : '';
  const number = options.showValue === false || !Number.isFinite(value)
    ? ''
    : formatNumericDisplay(value, precision);
  const cleanUnit = options.showUnit === false ? '' : String(unit ?? '').trim();
  const text = [semanticText, number, cleanUnit].filter(Boolean).join(' ');
  return {
    value: Number.isFinite(value) ? value : null,
    semanticText,
    number,
    unit: cleanUnit,
    showValue: options.showValue !== false,
    showUnit: options.showUnit !== false,
    text,
  };
}

export function createTextPresentation(text) {
  const value = String(text);
  return {
    value: null,
    number: value,
    unit: '',
    text: value,
  };
}
