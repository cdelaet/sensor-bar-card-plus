function getNumberFormatOptions(locale) {
  if (!locale || typeof locale !== 'object') return { locale: undefined, options: {} };

  const language = typeof locale.language === 'string' && locale.language.trim()
    ? locale.language.trim()
    : undefined;
  switch (locale.number_format) {
    case 'comma_decimal':
      return { locale: 'en-US', options: {} };
    case 'decimal_comma':
      return { locale: 'de', options: {} };
    case 'space_comma':
      return { locale: 'fr', options: {} };
    case 'quote_decimal':
      return { locale: 'de-CH', options: {} };
    case 'none':
      return { locale: 'en-US', options: { useGrouping: false } };
    case 'system':
      return { locale: undefined, options: {} };
    case 'language':
    default:
      return { locale: language, options: {} };
  }
}

export function formatNumericDisplay(rawVal, decimal = null, locale = null) {
  if (!Number.isFinite(rawVal)) return String(rawVal);
  const numberFormat = getNumberFormatOptions(locale);
  const options = { maximumFractionDigits: 2, ...numberFormat.options };
  if (Number.isInteger(decimal) && decimal >= 0 && decimal <= 20) {
    return rawVal.toLocaleString(numberFormat.locale, {
      ...options,
      minimumFractionDigits: decimal,
      maximumFractionDigits: decimal,
    });
  }
  return rawVal.toLocaleString(numberFormat.locale, options);
}

export function isTightUnit(unit) {
  return ['h', 'm', 's'].includes(String(unit || '').trim());
}

export function formatDisplayWithUnit(display, unit) {
  if (!unit) return String(display);
  const cleanUnit = String(unit);
  return `${display}${isTightUnit(cleanUnit) ? '' : ' '}${cleanUnit}`;
}

export function createNumericPresentation(value, unit, decimal = null, locale = null) {
  const number = formatNumericDisplay(value, decimal, locale);
  const cleanUnit = unit ? String(unit) : '';
  return {
    value,
    number,
    unit: cleanUnit,
    text: formatDisplayWithUnit(number, cleanUnit),
  };
}

export function createMarkerLabelPresentation(value, unit, precision = null, options = {}, locale = null) {
  const semanticText = typeof options.text === 'string' ? options.text : '';
  const number = options.showValue === false || value === null || value === undefined || value === ''
    ? ''
    : Number.isFinite(value) ? formatNumericDisplay(value, precision, locale) : String(value);
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
