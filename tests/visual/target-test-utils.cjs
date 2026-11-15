const { expect } = require('@playwright/test');

async function openTarget(editor, scope = 'Card', parts = ['shared', 'appearance', 'labels']) {
  const entity = scope === 'Entity';
  const open = async control => {
    if (await control.getAttribute('aria-expanded') === 'false') await control.click();
    await expect(control).toHaveAttribute('aria-expanded', 'true');
  };
  if (entity) await open(editor.locator('[data-action="toggle-entity-overrides"][data-index="0"]'));
  await open(editor.locator(entity ? '#entity-0-group-target' : '#card-group-marker-target'));
  for (const part of parts) await open(editor.locator(`#card-group-${entity ? 'entity-0-' : ''}target-${part}`));
}
module.exports = { openTarget };
