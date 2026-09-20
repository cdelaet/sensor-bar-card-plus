export function formatNumericDisplay(rawVal, decimal = null) {
  if (!Number.isFinite(rawVal)) return String(rawVal);
  if (decimal !== null) {
    return parseFloat(rawVal.toFixed(decimal)).toLocaleString();
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

export function createTextPresentation(text) {
  const value = String(text);
  return {
    value: null,
    number: value,
    unit: '',
    text: value,
  };
}
