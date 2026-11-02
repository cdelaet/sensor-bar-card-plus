import { escapeAttribute, formatScaleValueInput, renderEntityAttributeInput, renderEntitySourceInput } from './editor-controls.js';

function extraAttributes(dataset = {}) {
  return Object.entries(dataset)
    .map(([key, value]) => `data-${key}="${escapeAttribute(value)}"`)
    .join(' ');
}

function bindingAttributes(binding = {}) {
  const route = binding.field ? `data-field="${escapeAttribute(binding.field)}"`
    : `data-kind="${escapeAttribute(binding.kind ?? '')}"`;
  const index = binding.index === undefined || binding.index === null ? '' : ` data-index="${escapeAttribute(binding.index)}"`;
  const extra = extraAttributes(binding.extraDataset);
  return `${route}${index}${extra ? ` ${extra}` : ''}`;
}

/** Shared Value / Entity / Attribute controls for all resolvable marker sources. */
export function renderResolvableSourceControls({
  source = {},
  value,
  entity,
  attribute,
  hass,
  labels = {},
  placeholders = {},
  showEntity = true,
  showAttribute = true,
}) {
  const entityValue = source.entity ?? '';
  const attributeValue = source.attribute ?? '';
  const valueId = value.id;
  const valueMarkup = `<div class="field-row resolvable-source-value">
    <label for="${escapeAttribute(valueId)}">${escapeAttribute(labels.value ?? 'Value')}</label>
    <input id="${escapeAttribute(valueId)}" type="text" inputmode="decimal" data-resolvable-source-value="true" ${bindingAttributes(value)} value="${escapeAttribute(formatScaleValueInput(source))}" placeholder="${escapeAttribute(placeholders.value ?? '25 or 25%')}"${value.disabled ? ' disabled' : ''}>
  </div>`;
  const entityMarkup = showEntity ? `<div class="field-row resolvable-source-entity">
    <label>${escapeAttribute(labels.entity ?? 'Entity')}</label>
    ${renderEntitySourceInput(entity.kind, entity.index, entityValue, placeholders.entity ?? 'sensor.example', entity.extraDataset)}
  </div>` : '';
  const attributeMarkup = showEntity && showAttribute && entityValue ? `<div class="field-row resolvable-source-attribute">
    <label>${escapeAttribute(labels.attribute ?? 'Attribute')}</label>
    ${renderEntityAttributeInput(attribute.kind, attribute.index, attributeValue, entityValue, hass, attribute.extraDataset)}
  </div>` : '';
  return `${valueMarkup}${entityMarkup}${attributeMarkup}`;
}
