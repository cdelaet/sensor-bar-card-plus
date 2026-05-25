const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadCardClass() {
  const filePath = path.resolve(__dirname, '../../dist/sensor-bar-card-plus.js');
  const source = fs.readFileSync(filePath, 'utf8');

  const registry = new Map();
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
    HTMLElement: class {
      attachShadow() {
        this.shadowRoot = {
          innerHTML: '',
          querySelector: () => null,
          querySelectorAll: () => [],
        };
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
    },
    window: {
      customCards: [],
    },
    CustomEvent: class {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
  };

  vm.runInNewContext(source, sandbox, { filename: filePath });
  return sandbox.customElements.get('sensor-bar-card-plus');
}

function createCard() {
  const CardClass = loadCardClass();
  const card = new CardClass();
  card._hass = { states: {} };
  return card;
}

module.exports = {
  loadCardClass,
  createCard,
};
