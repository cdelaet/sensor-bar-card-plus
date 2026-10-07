// Compact presentation only. Marker semantics and formatting belong to the row model.
export function getFeatureLabelGeometry(height, occupancy = {}) {
  const above = occupancy.above ? 9 : 0;
  const below = occupancy.below ? 9 : 0;
  const railHeight = Math.max(0, height - above - below);
  return { above, below, railHeight, aboveY: 0, belowY: height - 8, compactGlyphs: railHeight === 18 };
}

export function layoutFeatureMarkerLabels(markers, width, measureText) {
  const layouts = [];
  for (const lane of ['above', 'below']) {
    const entries = markers
      .filter(marker => marker.lane === lane && marker.visible && marker.labelVisible
        && Number.isFinite(marker.position) && marker.label?.text?.trim())
      .map(marker => ({ marker, anchor: Math.max(0, Math.min(100, marker.position)) * width / 100 }))
      .sort((a, b) => a.anchor - b.anchor); // Stable sort preserves model order on ties.
    entries.forEach(({ marker, anchor }, index) => {
      const left = index ? (entries[index - 1].anchor + anchor) / 2 + 2 : 0;
      const right = index + 1 < entries.length ? (anchor + entries[index + 1].anchor) / 2 - 2 : width;
      const available = Math.max(0, right - left);
      const label = marker.label;
      let text = label.text;
      let mode = 'full';
      let size = measureText(text) + 4; // 2px of padding per side.
      if (size > available) {
        text = [label.showValue !== false ? label.number : '', label.showUnit !== false ? label.unit : '']
          .filter(Boolean).join(' ');
        mode = 'value';
        size = text ? measureText(text) + 4 : Infinity;
        // Text-only labels may show a meaningful prefix. Never shorten value/unit components.
        if (!text && !label.number && !label.unit) {
          const characters = Array.from(label.semanticText ?? '');
          while (characters.length >= 3) {
            text = `${characters.join('').trimEnd()}…`;
            size = measureText(text) + 4;
            if (size <= available) { mode = 'text'; break; }
            characters.pop();
          }
        }
      }
      if (!text || size > available || width <= 0) {
        layouts.push({ id: marker.id, lane, mode: 'hidden', text: '', left: 0, width: 0 });
      } else {
        layouts.push({ id: marker.id, lane, mode, text,
          left: Math.max(left, Math.min(anchor - size / 2, right - size)), width: size });
      }
    });
  }
  return layouts;
}
