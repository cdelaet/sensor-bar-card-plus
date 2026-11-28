// Minimal DOM surface for unit tests of the fill container and its layer children.
// Browser tests exercise the same operations against native elements.
export function createPaintLayerContainer(layers = []) {
  const operations = [];
  const container = {
    children: [], style: { cssText: '' }, className: 'bar-fill-reveal', operations,
    get firstElementChild() { return this.children[0] ?? null; },
    ownerDocument: {
      createElement() {
        return {
          dataset: {}, className: '', style: { cssText: '' }, parentElement: null,
          matches() { return this.className === 'bar-paint-layer' && this.dataset.layer !== undefined; },
          get nextElementSibling() {
            const siblings = this.parentElement?.children ?? [];
            return siblings[siblings.indexOf(this) + 1] ?? null;
          },
          getAttribute(name) { return name === 'style' ? this.style.cssText : null; },
          setAttribute(name, value) {
            if (name !== 'style') throw new Error(`Unexpected attribute ${name}`);
            this.style.cssText = value;
            operations.push({ type: 'style', node: this });
          },
          remove() {
            const parent = this.parentElement;
            if (!parent) return;
            parent.children.splice(parent.children.indexOf(this), 1);
            this.parentElement = null;
            operations.push({ type: 'remove', node: this });
          },
        };
      },
    },
    insertBefore(node, reference) {
      if (node.parentElement) {
        const siblings = node.parentElement.children;
        siblings.splice(siblings.indexOf(node), 1);
      }
      const index = reference === null ? this.children.length : this.children.indexOf(reference);
      if (index < 0) throw new Error('Reference node is not a child');
      this.children.splice(index, 0, node);
      node.parentElement = this;
      operations.push({ type: 'insert', node });
    },
  };
  for (const layer of layers) {
    const node = container.ownerDocument.createElement('div');
    node.className = 'bar-paint-layer';
    node.dataset.layer = layer.id;
    node.setAttribute('style', layer.style ?? '');
    container.insertBefore(node, null);
  }
  operations.length = 0;
  return container;
}
