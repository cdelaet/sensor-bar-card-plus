// Configuration colors remain CSS strings (named colors, hex, rgb/hsl,
// var() and color-mix()). Reject only characters that could terminate an HTML
// attribute, open a new CSS declaration, hide the rest of a declaration in a
// comment, or trigger a resource load. Keep this independent of CSS.supports:
// normalization must stay deterministic and usable in Node.
const UNSAFE_CSS_COLOR = /[;&{}<>"'\\\u0000-\u001f]/;
const CSS_COMMENT = /\/\*|\*\//;
const CSS_URL = /url\s*\(/i;

export function isSafeCssColorValue(value) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text) return false;
  return !UNSAFE_CSS_COLOR.test(text) && !CSS_COMMENT.test(text) && !CSS_URL.test(text);
}

export function safeCssColor(value, fallback = '') {
  return isSafeCssColorValue(value) ? value.trim() : fallback;
}
