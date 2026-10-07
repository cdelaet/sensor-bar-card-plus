import { SensorBarCard } from './card/SensorBarCard.js';
import { SensorBarCardPlusEditor } from './editor/SensorBarCardPlusEditor.js';
import { SensorBarCardPlusFeature, supportsSensorBarFeature } from './feature/SensorBarCardPlusFeature.js';

for (const [name, element] of [
  ['sensor-bar-card-plus', SensorBarCard],
  ['sensor-bar-card-plus-editor', SensorBarCardPlusEditor],
  ['sensor-bar-card-plus-feature', SensorBarCardPlusFeature],
]) {
  if (!customElements.get(name)) customElements.define(name, element);
}

window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'sensor-bar-card-plus')) {
  window.customCards.push({
    type: 'sensor-bar-card-plus',
    name: 'Sensor Bar Card Plus',
    description: 'Animated, colour-coded horizontal bar card for Home Assistant with extended target and layout features.',
  });
}
window.customCardFeatures = window.customCardFeatures || [];
if (!window.customCardFeatures.some(feature => feature.type === 'sensor-bar-card-plus-feature')) {
  window.customCardFeatures.push({
    type: 'sensor-bar-card-plus-feature',
    name: 'Sensor Bar Card Plus',
    isSupported: supportsSensorBarFeature,
  });
}
