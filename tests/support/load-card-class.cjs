const fs = require('fs');
const path = require('path');
const vm = require('vm');

function parseAttributes(rawAttrs = '') {
  const attrs = {};
  const regex = /([:@.\w-]+)(?:="([^"]*)")?/g;
  let match;
  while ((match = regex.exec(rawAttrs))) {
    attrs[match[1]] = match[2] ?? '';
  }
  return attrs;
}

function createShadowRoot() {
  const listeners = new Map();
  const state = {
    _innerHTML: '',
    _elements: [],
  };

  function createElementNode(tagName, attrs) {
    const dataset = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('data-')) {
        const dataKey = key
          .slice(5)
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        dataset[dataKey] = value;
      }
    }

    return {
      tagName: String(tagName).toUpperCase(),
      attributes: { ...attrs },
      dataset,
      id: attrs.id ?? '',
      type: attrs.type ?? '',
      value: attrs.value ?? '',
      checked: Object.prototype.hasOwnProperty.call(attrs, 'checked'),
      getAttribute(name) {
        return this.attributes[name] ?? null;
      },
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      dispatchEvent(event) {
        event.target = this;
        event.currentTarget = this;
        return shadowRoot.dispatchEvent(event);
      },
    };
  }

  function parseElements(html) {
    const elements = [];
    const tagRegex = /<([a-z0-9-]+)([^>]*)>/gi;
    let match;
    while ((match = tagRegex.exec(html))) {
      const [, tagName, rawAttrs] = match;
      elements.push(createElementNode(tagName, parseAttributes(rawAttrs)));
    }
    return elements;
  }

  const shadowRoot = {
    addEventListener(type, listener) {
      const bucket = listeners.get(type) ?? [];
      bucket.push(listener);
      listeners.set(type, bucket);
    },
    removeEventListener(type, listener) {
      const bucket = listeners.get(type) ?? [];
      listeners.set(type, bucket.filter((entry) => entry !== listener));
    },
    dispatchEvent(event) {
      const bucket = listeners.get(event.type) ?? [];
      bucket.forEach((listener) => listener.call(shadowRoot, event));
      return true;
    },
    querySelector(selector) {
      if (selector.startsWith('#')) {
        return state._elements.find((element) => element.id === selector.slice(1)) ?? null;
      }
      const dataFieldMatch = selector.match(/^\[data-field="([^"]+)"\]$/);
      if (dataFieldMatch) {
        return state._elements.find((element) => element.dataset.field === dataFieldMatch[1]) ?? null;
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'ha-entity-picker[data-kind="entity-picker"]') {
        return state._elements.filter((element) => (
          element.tagName === 'HA-ENTITY-PICKER' && element.dataset.kind === 'entity-picker'
        ));
      }
      const dataKindMatch = selector.match(/^([a-z0-9-]+)\[data-kind="([^"]+)"\]$/i);
      if (dataKindMatch) {
        const [, tagName, kind] = dataKindMatch;
        return state._elements.filter((element) => (
          element.tagName === String(tagName).toUpperCase() && element.dataset.kind === kind
        ));
      }
      const dataActionMatch = selector.match(/^([a-z0-9-]+)\[data-action="([^"]+)"\]$/i);
      if (dataActionMatch) {
        const [, tagName, action] = dataActionMatch;
        return state._elements.filter((element) => (
          element.tagName === String(tagName).toUpperCase() && element.dataset.action === action
        ));
      }
      return [];
    },
  };

  Object.defineProperty(shadowRoot, 'innerHTML', {
    get() {
      return state._innerHTML;
    },
    set(value) {
      state._innerHTML = value;
      state._elements = parseElements(String(value));
    },
  });

  return shadowRoot;
}

function loadCardClass(options = {}) {
  const filePath = path.resolve(__dirname, '../../src/sensor-bar-card-plus.js');
  const source = fs.readFileSync(filePath, 'utf8');

  const registry = new Map();
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (cb) => {
      cb();
      return 1;
    },
    cancelAnimationFrame: () => {},
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
    HTMLElement: class {
      attachShadow() {
        this.shadowRoot = createShadowRoot();
        return this.shadowRoot;
      }
      dispatchEvent() {
        return true;
      }
    },
    customElements: {
      define(name, ctor) {
        registry.set(name, ctor);
      },
      get(name) {
        return registry.get(name);
      },
      whenDefined() {
        return Promise.resolve();
      },
    },
    document: {
      createElement(name) {
        const ElementClass = registry.get(name);
        return ElementClass ? new ElementClass() : { tagName: String(name).toUpperCase() };
      },
    },
    window: {
      customCards: [],
    },
    CustomEvent: class {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
        this.bubbles = !!init.bubbles;
        this.composed = !!init.composed;
      }
    },
  };

  vm.runInNewContext(source, sandbox, { filename: filePath });
  if (options.withEntityPicker) {
    registry.set('ha-entity-picker', class extends sandbox.HTMLElement {});
  }
  return {
    card: sandbox.customElements.get('sensor-bar-card-plus'),
    editor: sandbox.customElements.get('sensor-bar-card-plus-editor'),
  };
}

function loadElementClass(name) {
  const classes = loadCardClass();
  return classes[name];
}

function createCard() {
  const { card: CardClass } = loadCardClass();
  const card = new CardClass();
  card._hass = { states: {} };
  return card;
}

function createEditor(options = {}) {
  const { editor: EditorClass } = loadCardClass(options);
  return new EditorClass();
}

module.exports = {
  loadCardClass,
  loadElementClass,
  createCard,
  createEditor,
};
