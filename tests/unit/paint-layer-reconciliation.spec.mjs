import { describe, expect, it } from 'vitest';
import { patchBar, renderBar } from '../../src/render/bar-renderer.js';
import { createPaintLayerContainer } from '../support/paint-layer-dom.mjs';

const layer = (id, color = 'red') => ({
  id, zIndex: 1, paintStyle: `display:block;inset:0;background:${color};`, revealStyle: 'display:block;',
});
const modelFor = paintLayers => ({ animated: true, baseline: { configured: false },
  needle: { configured: false }, markers: [],
  fill: { paintLayers, revealStyle: 'display:block;height:30px;clip-path:inset(0 10% 0 0 round 6px);' } });
const renderedLayers = model => [...renderBar(model).matchAll(/data-layer="([^"]+)" style="([^"]*)"/g)]
  .map(([, id, style]) => ({ id, style }));

function setup(layers) {
  const container = createPaintLayerContainer(renderedLayers(modelFor(layers)));
  const root = { querySelector: selector => selector === '.bar-fill-reveal' ? container : null };
  const patch = next => {
    container.operations.length = 0;
    const model = modelFor(next);
    patchBar(root, model);
    expect(container.children.map(node => ({ id: node.dataset.layer, style: node.getAttribute('style') })))
      .toEqual(renderedLayers(model));
  };
  return { container, patch };
}

describe('keyed paint-layer reconciliation', () => {
  it('removes a layer and adds it back in place while retaining surviving nodes', () => {
    const layers = [layer('base'), layer('baseline-above'), layer('above-target')];
    const { container, patch } = setup(layers);
    const [base, above, target] = container.children;
    patch([layers[0], layers[2]]);
    expect(container.children).toEqual([base, target]);
    expect(above.parentElement).toBeNull();
    expect(container.operations).toEqual([{ type: 'remove', node: above }]);
    patch(layers);
    expect(container.children[0]).toBe(base);
    expect(container.children[2]).toBe(target);
    expect(container.children[1]).not.toBe(above);
    expect(container.operations.filter(operation => operation.type === 'insert')).toHaveLength(1);
  });

  it('reorders equal-priority layers without replacing them or rewriting their styles', () => {
    const layers = [layer('first'), layer('second'), layer('third')];
    const { container, patch } = setup(layers);
    const [first, second, third] = container.children;
    patch([layers[2], layers[0], layers[1]]);
    expect(container.children).toEqual([third, first, second]);
    expect(container.operations).toEqual([{ type: 'insert', node: third }]);
  });

  it('updates an existing layer in place and leaves its siblings untouched', () => {
    const layers = [layer('first'), layer('second')];
    const { container, patch } = setup(layers);
    const nodes = [...container.children];
    patch([layers[0], layer('second', 'blue')]);
    expect(container.children).toEqual(nodes);
    expect(container.operations).toEqual([{ type: 'style', node: nodes[1] }]);
  });

  it('does not churn layer DOM or styles when repeating an identical patch', () => {
    const layers = [layer('first'), layer('second')];
    const { container, patch } = setup(layers);
    const nodes = [...container.children];
    patch(layers);
    expect(container.operations).toEqual([]);
    patch(layers.map(item => ({ ...item })));
    expect(container.children).toEqual(nodes);
    expect(container.operations).toEqual([]);
  });

  it('supports empty models and new identities without placeholder nodes', () => {
    const { container, patch } = setup([]);
    patch([layer('custom')]);
    expect(container.children.map(node => node.dataset.layer)).toEqual(['custom']);
    patch([]);
    expect(container.children).toEqual([]);
    patch([]);
    expect(container.operations).toEqual([]);
  });
});
