// Build defines are also supplied by the source-mode development server.
const buildIdentity = typeof __SBCP_BUILD_ID__ === 'string' ? __SBCP_BUILD_ID__ : null;
const editorFile = typeof __SBCP_EDITOR_FILE__ === 'string' ? __SBCP_EDITOR_FILE__ : './sensor-bar-card-plus-editor.js';
const editorDigest = typeof __SBCP_EDITOR_DIGEST__ === 'string' ? __SBCP_EDITOR_DIGEST__ : '';
const editorTags = ['sensor-bar-card-plus-editor', 'sensor-bar-card-plus-feature-editor'];
const runtimeTags = ['sensor-bar-card-plus', 'sensor-bar-card-plus-feature'];
const updateMessage = 'Sensor Bar Card Plus was updated. Refresh Home Assistant to load the matching visual editor.';
const conflictMessage = 'Sensor Bar Card Plus resources conflict. Load only one production or development resource, then refresh Home Assistant.';
const loadMessage = 'Unable to load the Sensor Bar Card Plus visual editor. Check connectivity, then reopen the editor or refresh Home Assistant.';
let runtimes;
let ownedEditors;
let pending;
let attempts = 0;
let lastFailure;

export function setEditorRuntimeOwners(card, feature) {
  runtimes = [card, feature];
}

function validateOwners() {
  if (!runtimes || runtimeTags.some((tag, index) => customElements.get(tag) !== runtimes[index])) {
    throw new Error(conflictMessage);
  }
  if (ownedEditors && editorTags.some((tag, index) => customElements.get(tag) !== ownedEditors[index])) {
    throw new Error(conflictMessage);
  }
}

async function loadEditors() {
  if (!buildIdentity) throw new Error('Use the Sensor Bar Card Plus development server for source visual editors, then refresh Home Assistant.');
  // One request per explicit attempt, at most two module cache identities per page.
  // A failed import is cached by browsers, so the second attempt uses a new URL.
  const url = new URL(editorFile, import.meta.url);
  url.searchParams.set('sbcp_build', editorDigest);
  if (attempts++) url.searchParams.set('sbcp_retry', '1');
  let companion;
  try {
    companion = await import(url.href);
  } catch (_error) {
    throw new Error(loadMessage);
  }
  if (companion.buildIdentity !== buildIdentity) throw new Error(updateMessage);
  validateOwners();
  const constructors = [companion.SensorBarCardPlusEditor, companion.SensorBarCardPlusFeatureEditor];
  if (constructors.some(ctor => typeof ctor !== 'function' || !(ctor.prototype instanceof HTMLElement))
      || constructors[0] === constructors[1]) throw new Error(updateMessage);
  // Preflight the complete pair before defining either tag. Existing tags are
  // trusted only when this loader registered these exact constructors itself.
  if (editorTags.some((tag, index) => {
    const existing = customElements.get(tag);
    return existing && (!ownedEditors || existing !== ownedEditors[index] || existing !== constructors[index]);
  })) throw new Error(conflictMessage);
  for (let index = 0; index < editorTags.length; index++) {
    if (!customElements.get(editorTags[index])) customElements.define(editorTags[index], constructors[index]);
  }
  ownedEditors = constructors;
}

export async function createConfigEditor(tag) {
  validateOwners();
  if (!pending) {
    if (attempts >= 2) throw lastFailure;
    pending = loadEditors().catch(error => {
      lastFailure = error;
      pending = undefined;
      throw error;
    });
  }
  await pending;
  validateOwners();
  return document.createElement(tag);
}
