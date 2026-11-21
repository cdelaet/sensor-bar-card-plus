const { test, expect } = require('@playwright/test');
const { count, foreign, mount, openSection, openDisclosure, colorPicker, saved } = require('./acceptance/editor-driver.cjs');
const { openTarget } = require('./target-test-utils.cjs');

const accent = 'var(--accent-color, #4a9eff)';
const orange = 'rgb(255, 152, 0)';
const purple = 'color-mix(in srgb, red, blue)';
const missing = 'var(--missing-sbcp-color)';
const destinations = [
  ['bar', 'Bar Appearance', 'red', '#ff0000'],
  ['baseline-above', 'Baseline', accent, null],
  ['baseline-below', 'Baseline', orange, '#ff9800'],
  ['target-above', 'Target', purple, '#800080'],
  ['target-below', 'Target', '#AbC', '#aabbcc'],
];

function makeScope() {
  const paint = color => ({ fill_style: 'gradient', color, opacity: 70,
    segments: [{ from: 0, to: 100, color: orange }],
    gradient_stops: [{ pos: 0, color: 'red' }, { pos: 100, color: accent }] });
  return {
    bar: { paint: paint('red'), needle: { show: true, color: accent } },
    baseline: { enabled: true, at: 20, above: { paint: paint(accent) }, below: { paint: paint(orange) } },
    target: { at: 50, color: 'red', when_above: { at: 65, marker: { color: orange }, paint: paint(purple) },
      when_below: { at: 35, marker: { color: accent }, paint: paint('#AbC') } },
    peak: { enabled: true, color: purple },
    floor: { enabled: true, color: missing },
    markers: [{ at: 70, color: orange }],
  };
}

const cssText = picker => picker.locator('..').locator('input[data-css-color="true"]');
const palettePicker = (paint, kind) => paint.locator(`input[type="color"][data-kind$="${kind}"]`).first();

async function checkColors(controls, accentColor) {
  for (const [picker, raw, hex] of controls) {
    await expect(cssText(picker), picker.toString()).toHaveValue(raw);
    await expect(picker).toHaveValue(hex ?? accentColor);
  }
}

async function checkContainment(editor, width) {
  const layout = await editor.evaluate((element, width) => {
    const visible = node => node.getBoundingClientRect().width > 0;
    const fits = (node, parent) => {
      const bounds = parent.getBoundingClientRect(), rect = node.getBoundingClientRect();
      return rect.left >= bounds.left - 0.5 && rect.right <= bounds.right + 0.5;
    };
    const onLine = (a, b) => Math.abs(a.top + a.height / 2 - b.top - b.height / 2) < 1;
    const pairs = [...element.shadowRoot.querySelectorAll('.color-controls')].filter(visible);
    const failures = [];
    for (const pair of pairs) {
      const [picker, text] = pair.querySelectorAll('input');
      const a = picker.getBoundingClientRect(), b = text.getBoundingClientRect();
      const panel = pair.closest('.paint-editor, .override-group-body, .generic-marker-body, .section');
      if (!visible(picker) || !visible(text) || !fits(picker, pair) || !fits(text, pair)
        || !fits(picker, panel) || !fits(text, panel) || !fits(text, element)) failures.push(picker.id);
      if (pair.clientWidth >= 98 && (!onLine(a, b) || a.right > b.left + 0.5)) failures.push(`${picker.id} order`);
      if (pair.clientWidth < 98 && !pair.classList.contains('palette-color-controls')
        && (b.top < a.bottom || Math.abs(b.width - pair.clientWidth) > 1)) failures.push(`${picker.id} wrap`);
    }
    let paintRows = 0;
    for (const row of element.shadowRoot.querySelectorAll('.paint-color-opacity')) {
      if (!visible(row)) continue;
      paintRows++;
      const [picker, text, opacity] = row.querySelectorAll('input');
      const a = picker.getBoundingClientRect(), b = text.getBoundingClientRect(), c = opacity.getBoundingClientRect();
      if (!fits(opacity, row) || !fits(opacity, element)) failures.push(opacity.id);
      if (width === 600 && (!onLine(a, b) || !onLine(b, c) || b.right > c.left + 0.5)) failures.push(`${opacity.id} order`);
      if (width === 240 && c.top < b.bottom) failures.push(`${opacity.id} wrap`);
    }
    return { pairs: pairs.length, paintRows, failures };
  }, width);
  expect(layout.pairs).toBeGreaterThanOrEqual(20);
  expect(layout.paintRows).toBeGreaterThanOrEqual(5);
  expect(layout.failures, `width ${width}`).toEqual([]);
}

for (const source of ['src', 'dist']) for (const host of ['Card', 'Entity', 'Feature']) {
  test(`${host} color controls show resolved colors from first mount through edits and theme changes (${source})`, async ({ page }) => {
    const entity = host === 'Entity', feature = host === 'Feature';
    const prefix = entity ? 'entity-0-' : '';
    const scope = entity ? 'entity' : 'root';
    const root = makeScope();
    const preset = { color: accent, gradient_stops: [{ pos: 0, color: 'red' }, { pos: 100, color: orange }] };
    const config = feature ? { ...root, type: 'custom:sensor-bar-card-plus-feature' }
      : { ...root, entities: [{ entity: 'sensor.power', ...(entity ? makeScope() : {}) }], preset_library: { paint: { demo: preset } } };
    const editor = await mount(page, feature ? 'feature' : 'standalone', config, { source });
    const paintFor = name => editor.locator(name === 'bar'
      ? (entity ? '#entity-0-paint-editor' : '#card-paint-editor') : `#${prefix}${name}-paint-editor`);
    const controls = destinations.flatMap(([name, , raw, hex]) => {
      const paint = paintFor(name);
      return [
        [paint.locator('input[type="color"][data-paint-property="color"]'), raw, hex],
        [palettePicker(paint, 'segment-color'), orange, '#ff9800'],
        [palettePicker(paint, 'gradient-color'), 'red', '#ff0000'],
        [palettePicker(paint, 'gradient-draft-color'), accent, null],
      ];
    });
    controls.push(
      [editor.locator(entity ? '#entity-0-needle-color' : '#bar-needle-color'), accent, null],
      [editor.locator(`#${prefix}target-color`), 'red', '#ff0000'],
      [editor.locator(`#${prefix}target-above-color`), orange, '#ff9800'],
      [editor.locator(`#${prefix}target-below-color`), accent, null],
      [editor.locator(`#${prefix}peak-color`), purple, '#800080'],
      [editor.locator(`#${prefix}floor-color`), missing, '#888888'],
      [editor.locator(`[data-kind="generic-marker-color"][data-scope-type="${entity ? 'entity' : 'card'}"]`), orange, '#ff9800'],
    );
    if (!feature) {
      controls.push([editor.locator('#preset-paint-color'), accent, null]);
      controls.push([palettePicker(editor.locator('#preset-paint-editor'), 'gradient-color'), 'red', '#ff0000']);
    }
    await checkColors(controls, '#4a9eff');
    const peakToggle = editor.locator(entity ? '#entity-0-peak-enabled' : '#peak-show');
    await expect(peakToggle).toBeChecked();
    await expect(peakToggle).toHaveCSS('accent-color', 'rgb(0, 117, 255)');
    expect(await count(page)).toBe(0);
    expect(await editor.evaluate(el => el._draftConfig ?? el._config)).toEqual(config);

    for (const [name, section] of destinations) {
      await openSection(editor, { scope, section, name: `${name}-paint-color` });
      const paint = paintFor(name);
      const picker = paint.locator('input[type="color"][data-paint-property="color"]');
      await expect(picker).toHaveAccessibleName('Base color');
      await expect(cssText(picker)).toHaveAccessibleName('Base color (CSS value)');
      for (const group of ['segments', 'gradient-stops']) {
        const toggle = paint.locator(`button[data-group$="${group}"]`);
        if (await toggle.count()) await openDisclosure(toggle);
      }
    }
    await openSection(editor, { scope, section: 'Needle' });
    for (const section of ['Peak', 'Floor', 'References']) await openSection(editor, { scope, section });
    await openTarget(editor, host, ['shared', 'appearance']);
    for (const side of ['above', 'below']) await openTarget(editor, host, [side, `${side}-marker`, `${side}-appearance`]);
    if (!feature) {
      await editor.locator('#paint-presets > summary').click();
      await editor.locator('#preset-paint-editor > summary').click();
    }
    for (const width of [240, 360, 600]) {
      await editor.evaluate((el, width) => { el.parentElement.style.width = `${width}px`; }, width);
      await checkContainment(editor, width);
    }

    const base = controls[0][0];
    const input = cssText(base);
    const longDraft = 'not-yet-a-valid-css-color-'.repeat(5);
    await input.fill(longDraft);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(base).toHaveValue('#ff0000');
    const focus = control => ({ active: control === control.getRootNode().activeElement,
      start: control.selectionStart, end: control.selectionEnd, scroll: control.scrollLeft });
    const before = await input.evaluate(control => {
      control.setSelectionRange(12, 14);
      control.scrollLeft = control.scrollWidth;
      window.__colorDraft = control;
      return { active: control === control.getRootNode().activeElement,
        start: control.selectionStart, end: control.selectionEnd, scroll: control.scrollLeft };
    });
    expect(before).toMatchObject({ active: true, start: 12, end: 14 });
    expect(before.scroll).toBeGreaterThan(0);
    await editor.evaluate(async el => {
      el.style.setProperty('--accent-color', '#225588');
      el.hass = { ...el.hass };
      await el.updateComplete;
    });
    expect(await input.evaluate(focus)).toEqual(before);
    expect(await input.evaluate(control => control === window.__colorDraft)).toBe(true);
    await expect(input).toHaveValue(longDraft);
    await checkColors(controls.slice(1), '#225588');
    await expect(peakToggle).toHaveCSS('accent-color', 'rgb(0, 117, 255)');
    expect(await count(page)).toBe(0);

    const replacement = structuredClone(config);
    const replaced = entity ? replacement.entities[0] : replacement;
    replaced.bar.paint.color = orange;
    replaced.target.when_below.marker.color = '#123456';
    await foreign(editor, replacement);
    await expect(input).toHaveValue(orange);
    await expect(input).toHaveAttribute('aria-invalid', 'false');
    await expect(base).toHaveValue('#ff9800');
    await expect(editor.locator(`#${prefix}target-below-color`)).toHaveValue('#123456');
    expect(await count(page)).toBe(0);

    await input.fill('rebeccapurple');
    await expect(base).toHaveValue('#663399');
    await expect(input).toBeFocused();
    await expect.poll(() => count(page)).toBe(1);
    expect((entity ? (await saved(page)).entities[0] : await saved(page)).bar.paint.color).toBe('rebeccapurple');
    await colorPicker(base, '#445566');
    await expect(input).toHaveValue('#445566');
    await expect.poll(() => count(page)).toBe(2);
    expect((entity ? (await saved(page)).entities[0] : await saved(page)).bar.paint.color).toBe('#445566');
  });
}
