const { test, expect } = require('@playwright/test');

const expectedStops = {
  bands: [0, 37.5, 37.5, 62.5, 62.5, 100],
  soft_bands: [0, 36.75, 38.25, 61.75, 63.25, 100],
  band_gradient: [0, 50, 100],
};

for (const fillStyle of ['bands', 'soft_bands', 'band_gradient']) {
  test(`entity numeric Segments paint on the overridden Scale: ${fillStyle} (issue #29)`, async ({ page }) => {
    await page.goto('/tests/visual/fixtures/harness.html');
    await page.evaluate(async fillStyle => {
      const row = segmentSpace => ({
        entity: 'sensor.sbcp_playground_negative',
        scale: { min: -20, max: 20 },
        bar: {
          fill_style: fillStyle, needle: true, animated: false,
          ...(segmentSpace ? { segment_space: segmentSpace } : {}),
          segments: [
            { from: -20, to: -5, color: '#ff2600' },
            { from: -5, to: 5, color: '#000000' },
            { from: 5, to: 20, color: '#0433ff' },
          ],
        },
      });
      await window.__sbcpRenderCard({
        width: 640,
        config: { type: 'custom:sensor-bar-card-plus', entities: [row(), row('scale')] },
        states: { 'sensor.sbcp_playground_negative': window.__sbcpCreateState(-19) },
      });
    }, fillStyle);
    const readPaint = () => page.locator('sensor-bar-card-plus').evaluate(card => (
      [...card.shadowRoot.querySelectorAll('.row[data-row-index]')].map(row => {
        const track = row.querySelector('.bar-track');
        const paint = row.querySelector('.bar-paint-layer[data-layer="base"]');
        const needle = row.querySelector('.needle-marker');
        const gradient = getComputedStyle(paint).backgroundImage;
        return {
          gradient,
          stops: [...gradient.matchAll(/([\d.-]+)%/g)].map(match => Number(match[1])),
          needle: parseFloat(getComputedStyle(needle).left) / track.getBoundingClientRect().width * 100,
          painted: getComputedStyle(paint).display !== 'none' && paint.getBoundingClientRect().width > 0,
        };
      })
    ));
    await expect.poll(async () => (await readPaint()).map(row => row.stops))
      .toEqual([expectedStops[fillStyle], expectedStops[fillStyle]]);
    const rows = await readPaint();
    expect(rows[0].gradient).toBe(rows[1].gradient);
    for (const row of rows) {
      expect(row.needle).toBeCloseTo(2.5, 2);
      expect(row.painted).toBe(true);
      expect(row.gradient).toContain('rgb(255, 38, 0)');
      expect(row.gradient).toContain('rgb(0, 0, 0)');
      expect(row.gradient).toContain('rgb(4, 51, 255)');
    }
  });
}
