const { test, expect } = require('@playwright/test');

const config = () => ({
  entities: [{ entity: 'sensor.a' }],
  scale: { min: 10, max: 120 },
  layout: { label: { width: 100 } },
  bar: { animated: false },
  baseline: { enabled: true, at: { fixed: 50 } },
  target: { at: { fixed: 60 }, enabled: true },
  formatting: { unit: 'W', decimal: 2 },
});

async function mountEditor(page, source, saved = config()) {
  await page.goto(`/tests/visual/fixtures/harness.html?source=${source}`);
  await page.evaluate(async savedConfig => {
    await customElements.whenDefined('sensor-bar-card-plus');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    editor.setConfig(savedConfig);
    document.querySelector('#mount').append(editor);
    await editor.updateComplete;
  }, saved);
  return page.locator('sensor-bar-card-plus-editor');
}

async function reopenEditor(page, current, savedOverride) {
  const saved = savedOverride ?? await current.evaluate(editor => structuredClone(editor._draftConfig));
  await page.evaluate(async savedConfig => {
    const current = document.querySelector('sensor-bar-card-plus-editor');
    const editor = await customElements.get('sensor-bar-card-plus').getConfigElement();
    editor.addEventListener('config-changed', event => editor.setConfig(event.detail.config));
    editor.setConfig(savedConfig);
    current.replaceWith(editor);
    await editor.updateComplete;
  }, saved);
  return page.locator('sensor-bar-card-plus-editor');
}

async function openGroup(editor, selector) {
  const button = editor.locator(selector);
  if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
}

const scenarios = [
  { name: 'Scale minimum', card: '#scale-min', entity: '#entity-0-min', value: '14', cardValue: el => el._getScaleFixedValue('min'), cardGroups: [], groups: ['#entity-0-group-scale'], provenance: '#entity-0-scale-inherit' },
  { name: 'Scale maximum', card: '#scale-max', entity: '#entity-0-max', value: '140', cardValue: el => el._getScaleFixedValue('max'), cardGroups: [], groups: ['#entity-0-group-scale'], provenance: '#entity-0-scale-inherit' },
  { name: 'Label width', card: '#layout-label-width', entity: '#entity-0-label-width', value: '135', cardValue: el => el._getScopedLayoutValue({ type: 'card' }, 'width'), cardGroups: [], groups: ['#entity-0-group-layout'], provenance: '#entity-0-layout-inherit' },
  { name: 'Formatting Unit', card: '#formatting-unit', entity: '#entity-0-formatting-unit', value: 'kW', expectedCardValue: 'kW', cardValue: el => el._draftConfig.formatting.unit, cardGroups: [], groups: ['#entity-0-group-formatting'], provenance: '#entity-0-formatting-inherit' },
  { name: 'Formatting Decimals', card: '#formatting-decimal', entity: '#entity-0-formatting-decimal', value: '3', expectedCardValue: 3, cardValue: el => el._draftConfig.formatting.decimal, cardGroups: [], groups: ['#entity-0-group-formatting'], provenance: '#entity-0-formatting-inherit' },
  { name: 'Baseline value', card: '#baseline-value', entity: '#entity-0-baseline-value', value: '55', cardValue: el => el._getBaselineResolvableValue({ type: 'card' }).fixed, cardGroups: ['#card-group-baseline'], groups: ['#entity-0-group-bar', '#entity-0-group-baseline'], provenance: '#entity-0-baseline-inherit' },
  { name: 'Target value', card: '#target-value', entity: '#entity-0-target-value', value: '75', cardValue: el => el._getTargetResolvableValue({ type: 'card' }).fixed, cardGroups: ['#card-group-marker-target', '#card-group-target-shared'], groups: ['#entity-0-group-target', '#card-group-entity-0-target-shared'], provenance: '#entity-0-target-inherit', source: '[data-target-source="source"]' },
];

for (const source of ['src', 'dist']) for (const scenario of scenarios) {
  test(`${source}: Card ${scenario.name} update reaches an inheriting Entity before save and after reopen`, async ({ page }) => {
    let editor = await mountEditor(page, source);
    for (const group of scenario.cardGroups) await openGroup(editor, group);
    const cardControl = editor.locator(scenario.card);
    await cardControl.fill(scenario.value);
    await expect(cardControl).toBeFocused();
    await cardControl.press('Tab');
    await expect(cardControl).toHaveValue(scenario.value);
    await expect.poll(() => editor.evaluate(scenario.cardValue)).toBe(scenario.expectedCardValue ?? Number(scenario.value));

    await editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    for (const group of scenario.groups) await openGroup(editor, group);
    const entityControl = editor.locator(scenario.entity);
    await expect(entityControl).toHaveValue(scenario.value);
    await expect(editor.locator(scenario.provenance)).toBeChecked();
    if (scenario.source) await expect(entityControl.locator('xpath=..').locator(scenario.source)).toHaveText('Inherited');
    expect(await editor.evaluate(el => el._draftConfig.entities[0])).toEqual({ entity: 'sensor.a' });

    editor = await reopenEditor(page, editor);
    await editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    for (const group of scenario.groups) await openGroup(editor, group);
    await expect(editor.locator(scenario.entity)).toHaveValue(scenario.value);
    await expect(editor.locator(scenario.provenance)).toBeChecked();
    expect(await editor.evaluate(el => el._draftConfig.entities[0])).toEqual({ entity: 'sensor.a' });
  });
}

for (const source of ['src', 'dist']) {
  test(`${source}: Card Formatting updates preserve local Entity overrides and clearing restores inheritance`, async ({ page }) => {
    const saved = config();
    saved.entities[0].formatting = { unit: 'Wh', decimal: 0 };
    const editor = await mountEditor(page, source, saved);
    await editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    await openGroup(editor, '#entity-0-group-formatting');

    const cardUnit = editor.locator('#formatting-unit');
    await cardUnit.fill('kW');
    await cardUnit.press('Tab');
    const cardDecimal = editor.locator('#formatting-decimal');
    await cardDecimal.fill('3');
    await cardDecimal.press('Tab');
    await expect(editor.locator('#entity-0-formatting-unit')).toHaveValue('Wh');
    await expect(editor.locator('#entity-0-formatting-decimal')).toHaveValue('0');
    await expect(editor.locator('#entity-0-formatting-inherit')).not.toBeChecked();
    expect(await editor.evaluate(el => el._draftConfig.entities[0])).toEqual({
      entity: 'sensor.a', formatting: { unit: 'Wh', decimal: 0 },
    });

    await editor.locator('#entity-0-formatting-inherit').check();
    await expect(editor.locator('#entity-0-formatting-unit')).toHaveValue('kW');
    await expect(editor.locator('#entity-0-formatting-decimal')).toHaveValue('3');
    await expect(editor.locator('#entity-0-formatting-inherit')).toBeChecked();
    expect(await editor.evaluate(el => el._draftConfig.entities[0])).toEqual({ entity: 'sensor.a' });

    const reopened = await reopenEditor(page, editor);
    await reopened.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    await openGroup(reopened, '#entity-0-group-formatting');
    await expect(reopened.locator('#entity-0-formatting-unit')).toHaveValue('kW');
    await expect(reopened.locator('#entity-0-formatting-decimal')).toHaveValue('3');
    await expect(reopened.locator('#entity-0-formatting-inherit')).toBeChecked();
    expect(await reopened.evaluate(el => el._draftConfig.entities[0])).toEqual({ entity: 'sensor.a' });
  });

  test(`${source}: Card Formatting synchronization preserves a focused Entity decimal draft`, async ({ page }) => {
    const editor = await mountEditor(page, source);
    await editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    await openGroup(editor, '#entity-0-group-formatting');

    const entityDecimal = editor.locator('#entity-0-formatting-decimal');
    await entityDecimal.fill('');
    await expect(entityDecimal).toBeFocused();
    await expect.poll(() => editor.evaluate(el => el._numericDrafts.values.get('entity-0-formatting-decimal'))).toBe('');

    await editor.locator('#formatting-decimal').evaluate(input => {
      input.value = '3';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect.poll(() => editor.evaluate(el => el._draftConfig.formatting.decimal)).toBe(3);
    await expect(entityDecimal).toBeFocused();
    await expect(entityDecimal).toHaveValue('');
    await expect.poll(() => editor.evaluate(el => el._numericDrafts.values.get('entity-0-formatting-decimal'))).toBe('');
    expect(await editor.evaluate(el => el._draftConfig.entities[0])).toEqual({ entity: 'sensor.a' });
  });

  test(`${source}: Card synchronization preserves an unfinished Entity Baseline draft`, async ({ page }) => {
    const editor = await mountEditor(page, source);
    await openGroup(editor, '#card-group-baseline');
    await editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    await openGroup(editor, '#entity-0-group-bar');
    await openGroup(editor, '#entity-0-group-baseline');

    const entityValue = editor.locator('#entity-0-baseline-value');
    await entityValue.fill('pending');
    await entityValue.press('Tab');
    await expect.poll(() => editor.evaluate(el => el._numericDrafts.values.get('entity-0-baseline-value'))).toBe('pending');

    const cardValue = editor.locator('#baseline-value');
    await cardValue.fill('55');
    await cardValue.press('Tab');
    await expect(entityValue).toHaveValue('pending');
    await expect.poll(() => editor.evaluate(el => el._numericDrafts.values.get('entity-0-baseline-value'))).toBe('pending');
    expect(await editor.evaluate(el => el._draftConfig.baseline.at.fixed)).toBe(55);
    expect(await editor.evaluate(el => el._draftConfig.entities[0])).toEqual({ entity: 'sensor.a' });
  });

  test(`${source}: Card Scale updates retain an Entity's local override`, async ({ page }) => {
    const saved = config();
    saved.entities[0].scale = { min: 22 };
    const editor = await mountEditor(page, source, saved);
    const cardMin = editor.locator('#scale-min');
    await cardMin.fill('14');
    await cardMin.press('Tab');
    await editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    await openGroup(editor, '#entity-0-group-scale');
    await expect(editor.locator('#entity-0-min')).toHaveValue('22');
    await expect(editor.locator('#entity-0-scale-inherit')).not.toBeChecked();
    expect(await editor.evaluate(el => el._draftConfig.entities[0])).toEqual({ entity: 'sensor.a', scale: { min: 22 } });
    const reopened = await reopenEditor(page, editor);
    await reopened.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    await openGroup(reopened, '#entity-0-group-scale');
    await expect(reopened.locator('#entity-0-min')).toHaveValue('22');
    await expect(reopened.locator('#entity-0-scale-inherit')).not.toBeChecked();
  });

  test(`${source}: Animated keeps its existing immediate Entity synchronization`, async ({ page }) => {
    const editor = await mountEditor(page, source);
    await editor.locator('#bar-animated').check();
    await editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]').click();
    await openGroup(editor, '#entity-0-group-bar');
    await expect(editor.locator('#entity-0-bar-animated')).toBeChecked();
    await expect(editor.locator('#entity-0-bar-inherit')).toBeChecked();
    expect(await editor.evaluate(el => el._draftConfig.entities[0])).toEqual({ entity: 'sensor.a' });
  });

  test(`${source}: Entity Target disclosures survive rapid Card edits and save/reopen/cancel`, async ({ page }) => {
    let editor = await mountEditor(page, source);
    let cardMaxValue = 120;
    const visitTargetDisclosures = async () => {
      for (const part of ['shared', 'above', 'below']) {
        await openGroup(editor, '#card-group-marker-target');
        const cardButton = editor.locator(`#card-group-target-${part}`);
        if (await cardButton.getAttribute('aria-expanded') !== 'true') await cardButton.click();
        await expect(cardButton).toHaveAttribute('aria-expanded', 'true');
        await expect(cardButton.locator('xpath=following-sibling::div[1]')).toBeVisible();
        await cardButton.click();
        await expect(cardButton).toHaveAttribute('aria-expanded', 'false');

        const entityOverrides = editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]');
        if (await entityOverrides.getAttribute('aria-expanded') !== 'true') await entityOverrides.click();
        await openGroup(editor, '#entity-0-group-target');
        const button = editor.locator(`#card-group-entity-0-target-${part}`);
        if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
        await expect(button).toHaveAttribute('aria-expanded', 'true');
        await expect(button.locator('xpath=following-sibling::div[1]')).toBeVisible();

        const cardMax = editor.locator('#scale-max');
        await cardMax.fill(String(++cardMaxValue));
        await cardMax.press('Tab');
        await expect(button).toHaveAttribute('aria-expanded', 'true');

        await button.click();
        await expect(button).toHaveAttribute('aria-expanded', 'false');
        await expect(button.locator('xpath=following-sibling::div[1]')).toBeHidden();
        const entityTarget = editor.locator('#entity-0-group-target');
        if (await entityTarget.getAttribute('aria-expanded') === 'true') await entityTarget.click();
        if (await entityOverrides.getAttribute('aria-expanded') === 'true') await entityOverrides.click();
      }
    };

    await visitTargetDisclosures();
    editor = await reopenEditor(page, editor);
    await visitTargetDisclosures();
    const saved = await editor.evaluate(el => structuredClone(el._config));
    const unsavedMax = editor.locator('#scale-max');
    await unsavedMax.fill('999');
    await unsavedMax.press('Tab');
    editor = await reopenEditor(page, editor, saved);
    await expect(editor.locator('#scale-max')).toHaveValue(String(cardMaxValue));
    await visitTargetDisclosures();
  });
}
