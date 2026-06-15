import { SensorBarCard } from './card/SensorBarCard.js';
import { SensorBarCardPlusEditor } from './editor/SensorBarCardPlusEditor.js';

customElements.define('sensor-bar-card-plus', SensorBarCard);
customElements.define('sensor-bar-card-plus-editor', SensorBarCardPlusEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'sensor-bar-card-plus',
  name: 'Sensor Bar Card Plus',
  description: 'Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features.',
});
