async function expandFeatureGroups(editor, groups = ['marker-target', 'marker-peak', 'marker-floor', 'generic-markers', 'baseline', 'segments', 'gradient-stops']) {
  for (const group of groups) {
    const button = editor.locator(`#card-group-${group}`);
    if (await button.getAttribute('aria-expanded') === 'false') await button.click();
  }
  // Disclosure clicks scroll long editors; keep native input hover arrows out of captures.
  await editor.page().mouse.move(0, 0);
}
const featureGroup = (editor, group) => editor.locator(`.card-subgroup[data-group="${group}"]`);
module.exports = { expandFeatureGroups, featureGroup };
