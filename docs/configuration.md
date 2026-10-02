# Configuration Reference

This is the exhaustive reference for Sensor Bar Card Plus YAML. For the practical guide and feature concepts, start with the [README](../README.md). This document describes the supported fields, defaults, scope, compatibility forms, and behavior details.

## Contents

- [Scope, inheritance, and replacement](#scope-inheritance-and-replacement)
- [Configuration hierarchy](#configuration-tree)
- [Property overview](#modern-configuration-overview)
- [Card-level options](#top-level-card-options)
- [Entity-level options](#top-level-entity-options)
- [Layout](#layout-options-and-responsive-behavior)
- [Dynamic scale and target values](#scale-and-dynamic-value-sources)
- [Structured configuration](#structured-configuration)
- [Fill styles](#fill-styles-reference)
- [Needle](#needle)
- [Baseline](#baseline)
- [Target](#target-marker)
- [Peak](#peak-marker)
- [Floor](#floor-marker)
- [Generic reference markers](#generic-reference-markers)
- [Formatting](#formatting)
- [Interaction and error behavior](#interaction-and-error-behavior)
- [Peak and Floor reset behavior](#peak-and-floor-reset-behavior)
- [Invalid and unsupported configuration](#invalid-and-unsupported-configuration)
- [Compatibility and migration](#legacy-compatibility-and-migration)

## Scope, inheritance, and replacement

Card configuration supplies defaults for the supported per-row settings: `layout`, `scale`, `bar`, `baseline`, `target`, `peak`, `floor`, `markers`, and `formatting`. Entity rows can override these groups for their own row. `title` and `entities` are card-level controls, not entity overrides; `name` and `icon` are row-specific values.

Structured objects inherit card fields when an entity leaves those fields unspecified, as described in each feature section. Lists replace rather than merge: this applies to `markers`, `bar.segments`, and `bar.gradient_stops`. Generic markers are inherited from the card by default; an entity-level `markers` list replaces that list, and `markers: []` explicitly clears it. Legacy flat aliases listed in the entity options table are also supported at entity scope; this does not make every card-level option overridable.

## Configuration Tree

The modern configuration model is structured by feature area. Card-level settings define defaults for the supported per-row groups described above; entity-level settings override those groups for their row.

```text
layout
├── height
├── label
│   ├── position
│   └── width
└── hero
    ├── size
    └── value_size

scale
├── min
│   ├── fixed
│   └── entity
└── max
    ├── fixed
    └── entity

bar
├── fill_style
├── segment_space
├── color
├── solid_fill
├── animated
├── needle
│   ├── show
│   └── color
├── segments[]
│   ├── from
│   ├── to
│   └── color
└── gradient_stops[]
    ├── pos
    └── color

target
├── enabled
├── at
│   ├── fixed
│   └── entity
├── color
├── shape
├── direction
├── label
│   ├── show
│   ├── text
│   ├── show_value
│   ├── show_unit
│   ├── precision
│   └── decimal (compatibility alias)
└── when_exceeded
    └── fill_color

baseline
├── enabled
├── at
│   ├── fixed
│   └── entity
├── above
│   └── color
└── below
    └── color

peak
├── enabled
├── color
├── direction
├── reset
└── label
    ├── show
    ├── text
    ├── show_value
    ├── show_unit
    ├── precision
    └── decimal (compatibility alias)

floor
├── enabled
├── color
├── direction
├── reset
└── label
    ├── show
    ├── text
    ├── show_value
    ├── show_unit
    ├── precision
    └── decimal (compatibility alias)

markers[]
├── at
├── lane
├── shape
├── direction
├── color
└── label
    ├── show
    ├── text
    ├── show_value
    ├── show_unit
    ├── precision
    └── decimal (compatibility alias)

formatting
├── decimal
└── unit
```

## Modern Configuration Overview

Use this overview to find a field by YAML path. Exact scope and behavior are described in the sections below.

### Layout

| Path | Default | Values | Description |
|---|---:|---|---|
| `layout.height` | `38` | number | Row/bar height. Explicit values are respected; very small values normalize to a usable minimum. |
| `layout.label.position` | `left` | `left`, `above`, `inside`, `off`, `hero` | Label placement mode. |
| `layout.hero.size` | `medium` | `small`, `medium`, `large` | Built-in Hero typography preset. Applies only when `layout.label.position: hero`. |
| `layout.hero.value_size` | `null` | `12–112` | Optional maximum Hero value size in pixels. Overrides `layout.hero.size` while preserving automatic responsive fitting. Applies only when `layout.label.position: hero`. |
| `layout.label.width` | `100` | number | Shared label column width for `left` label mode. |

### Scale

| Path | Default | Values | Description |
|---|---:|---|---|
| `scale.min.fixed` | `0` | number | Fixed lower bound of the active scale. |
| `scale.min.entity` | `null` | entity id | Dynamic lower bound entity. |
| `scale.max.fixed` | `100` | number | Fixed upper bound of the active scale. |
| `scale.max.entity` | `null` | entity id | Dynamic upper bound entity. |

### Bar and fill

| Path | Default | Values | Description |
|---|---:|---|---|
| `bar.fill_style` | `bands` | `solid`, `gradient`, `bands`, `soft_bands`, `band_gradient` | Fill rendering style. |
| `bar.segment_space` | `percent` | `percent`, `scale` | Determines whether `bar.segments` are interpreted as percentages of the bar or as actual values on the configured scale. |
| `bar.color` | `#4a9eff` | CSS color | Solid or fallback fill color. If it is the only paint setting at the applicable card or entity scope, it selects a solid bar; explicit fill modes and palettes retain their own semantics. |
| `bar.solid_fill` | `false` | boolean | Samples the active color and renders the revealed fill as one solid color. |
| `bar.animated` | `true` | boolean | Enables or disables value-change animations for the revealed fill and related visual elements. |
| `bar.needle` | `false` | boolean or object | Enables needle mode using `true`, or accepts the expanded `{ show, color }` configuration. |
| `bar.needle.show` | `false` | boolean | Explicitly enables or disables needle mode in expanded configuration. |
| `bar.needle.color` | `#ffffff` | CSS color | Sets the needle body and glow color. |
| `bar.segments` | default bands | list | Segment definitions for `bands`, `soft_bands`, and `band_gradient`. Each item supports `from`, `to`, and `color`. |
| `bar.gradient_stops` | `null` | list | Gradient stop definitions for `gradient`. Each item supports `pos` and `color`. |

### Baseline

| Path | Default | Values | Description |
|---|---:|---|---|
| `baseline.enabled` | auto | `true`, `false`, omitted | Controls baseline behavior. Omitted means automatic based on configured baseline source. |
| `baseline.at.fixed` | `null` | number | Fixed baseline value. |
| `baseline.at.entity` | `null` | entity id | Dynamic baseline entity. |
| `baseline.above.color` | `null` | CSS color | Optional semantic color above the baseline. |
| `baseline.below.color` | `null` | CSS color | Optional semantic color below the baseline. |

### Target

| Path | Default | Values | Description |
|---|---:|---|---|
| `target.enabled` | auto | `true`, `false`, omitted | Controls target marker behavior. Omitted means automatic based on configured target source. |
| `target.at.fixed` | `null` | number | Fixed target value. |
| `target.at.entity` | `null` | entity id | Dynamic target entity. |
| `target.shape` | `diamond` | `diamond`, `triangle` | Target marker shape. |
| `target.color` | `#888888` | CSS color | Target marker color. |
| `target.direction` | `inward` | `inward`, `outward` | Direction for directional marker shapes; Circle and Diamond are visually unaffected. Entity-level Target direction inherits the card-level value unless overridden. |
| `target.label.show` | `false` | boolean | Enables the composed Target label; its text, value, and unit components are configured independently below. |
| `target.label.text` | absent | string | Optional plain text shown before the value and unit. |
| `target.label.show_value` | `true` | boolean | Includes or omits the formatted Target value independently of text and unit. |
| `target.label.show_unit` | `true` | boolean | Includes or omits the effective row unit independently of text and value. |
| `target.label.precision` | inherited | number | Overrides the numeric component's precision; omitted values inherit `formatting.decimal`. The established `target.label.decimal` spelling remains accepted for existing configurations. |
| `target.when_exceeded.fill_color` | `null` | CSS color | Semantic fill color for the part of the fill beyond the target. |

### Peak

| Path | Default | Values | Description |
|---|---:|---|---|
| `peak.enabled` | `false` | boolean | Shows a session peak marker. |
| `peak.color` | `#888888` | CSS color | Peak marker color. |
| `peak.reset` | `never` | reset value | Resets Peak using a relative duration or local calendar boundary. |
| `peak.direction` | `inward` | `inward`, `outward` | Direction for directional marker shapes; Circle and Diamond are visually unaffected. Entity-level Peak direction inherits the card-level value unless overridden. |
| `peak.label.show` | `false` | boolean | Shows the formatted Peak value label. |
| `peak.label.text` | absent | string | Optional plain text shown before the value and unit. |
| `peak.label.show_value` | `true` | boolean | Includes or omits the formatted Peak value independently of text and unit. |
| `peak.label.show_unit` | `true` | boolean | Includes or omits the effective row unit independently of text and value. |
| `peak.label.precision` | inherited | number | Overrides the numeric component's precision; omitted values inherit `formatting.decimal`. `peak.label.decimal` remains accepted for existing configurations. |

### Floor

| Path | Default | Values | Description |
|---|---:|---|---|
| `floor.enabled` | `false` | boolean | Shows a session Floor marker for the lowest finite value. |
| `floor.color` | `#888888` | CSS color | Floor marker color. |
| `floor.reset` | `never` | reset value | Resets Floor using a relative duration or local calendar boundary. |
| `floor.direction` | `inward` | `inward`, `outward` | Direction for directional marker shapes; Circle and Diamond are visually unaffected. Entity-level Floor direction inherits the card-level value unless overridden. |
| `floor.label.show` | `false` | boolean | Shows the formatted Floor value label. |
| `floor.label.text` | absent | string | Optional plain text shown before the value and unit. |
| `floor.label.show_value` | `true` | boolean | Includes or omits the formatted Floor value independently of text and unit. |
| `floor.label.show_unit` | `true` | boolean | Includes or omits the effective row unit independently of text and value. |
| `floor.label.precision` | inherited | number | Overrides the numeric component's precision; omitted values inherit `formatting.decimal`. `floor.label.decimal` remains accepted for existing configurations. |

### Generic reference markers

| Path | Default | Values | Description |
|---|---:|---|---|
| `markers[]` | `[]` | list | Generic reference markers. The card-level list is inherited; an entity-level list replaces it, and `markers: []` clears it. Each item supports `at`, `show_marker`, `lane`, `shape`, `direction`, `color`, and `label`; `label.entity` independently supplies dynamic label content. Direction defaults to `inward`; Circle and Diamond are visually unaffected. |
| `markers[].show_marker` | `true` | boolean | Hides only the marker shape when false. The anchor position, lane, and label remain active. |
| `markers[].label.show` | `false` | boolean | Enables the generic marker label. `label.entity` does not implicitly enable it. |
| `markers[].label.entity` | absent | entity ID | Optional independent content source. It supplies label state and its own unit without affecting `at`. |
| `markers[].label.precision` | inherited | number | Numeric label precision; defaults to the row's `formatting.decimal`. |

### Formatting

| Path | Default | Values | Description |
|---|---:|---|---|
| `formatting.decimal` | `null` | number | Decimal places for displayed numeric values. |
| `formatting.unit` | entity unit | string | Display unit override. |

Legacy flat options are listed separately in the Legacy Compatibility and Migration section. They remain supported, but new dashboards should prefer the structured paths above.

## Top-Level Card Options

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | `—` | Optional Lovelace card title |
| `entity` | string | `—` | Single-entity shorthand, normalized into `entities` |
| `entities` | list | required | Rows to render |
| `layout` | object | see below | Default layout for all rows |
| `scale` | object | `min: 0`, `max: 100` | Default scale for all rows |
| `bar` | object | see below | Default fill, marker, and animation settings |
| `baseline` | number/object | disabled | Default baseline / fill origin, including legacy fixed shorthand |
| `target` | number/object | disabled | Default target marker, including legacy fixed shorthand |
| `peak` | object | disabled | Default structured Peak marker config |
| `floor` | object | disabled | Default structured Floor marker config |
| `markers` | list | `[]` | Generic reference markers inherited by entity rows unless replaced |
| `formatting` | object | `decimal: null`, `unit: null` | Default numeric formatting |
| `label_position` | string | `left` | Legacy alias for `layout.label.position` |
| `label_width` | number | `100` | Legacy alias for `layout.label.width` |
| `height` | number | `38` | Legacy alias for `layout.height`; rendered minimum is `24` |
| `min` | number | `0` | Legacy alias for `scale.min.fixed` |
| `min_entity` | string | `null` | Legacy alias for `scale.min.entity` |
| `max` | number | `100` | Legacy alias for `scale.max.fixed` |
| `max_entity` | string | `null` | Legacy alias for `scale.max.entity` |
| `fill_style` | string | `bands` (legacy compatibility default) | Legacy flat alias for `bar.fill_style` |
| `color_mode` | string | `severity` | Legacy compatibility alias for `bar.color_mode` |
| `color` | string | `#4a9eff` | Legacy flat alias for `bar.color` |
| `gradient_stops` | list | `null` | Legacy flat alias for `bar.gradient_stops` |
| `segments` | list | `null` | Legacy flat alias for `bar.segments` |
| `severity` | list | default 3-band scale | Legacy severity array, normalized into `bar.segments` |
| `animated` | boolean | `true` | Legacy flat alias for `bar.animated` |
| `target_entity` | string | `null` | Legacy alias for `target.at.entity` |
| `target_color` | string | `#888888` | Legacy alias for `target.color` |
| `show_target_label` | boolean | `false` | Legacy alias for `target.label.show` |
| `above_target_color` | string | `null` | Legacy alias for `target.when_exceeded.fill_color` |
| `show_peak` | boolean | `false` | Legacy alias for `peak.enabled` |
| `peak_color` | string | `#888888` | Legacy alias for `peak.color` |
| `decimal` | number | `null` | Legacy alias for `formatting.decimal` |
| `unit` | string | `null` | Legacy alias for `formatting.unit` |

## Top-Level Entity Options

Entity-level configuration supports the per-row groups and legacy aliases listed below. These values override inherited card defaults for that row; `entity` identifies the row rather than overriding a card setting.

| Option | Type | Description |
|---|---|---|
| `entity` | string | Home Assistant entity id for the row |
| `name` | string | Row label override |
| `icon` | string | Row icon override |
| `layout` | object | Per-row layout override |
| `scale` | object | Per-row scale override |
| `bar` | object | Per-row fill and needle override |
| `target` | object/number | Per-row target override |
| `peak` | object | Per-row Peak override |
| `floor` | object | Per-row Floor override |
| `markers` | list | Per-row generic marker list; replaces the inherited list |
| `baseline` | object/number/null | Per-row baseline override or explicit disable |
| `formatting` | object | Per-row decimal and unit override |
| `label_position` | string | Legacy alias for `layout.label.position` |
| `label_width` | number | Legacy alias for `layout.label.width` |
| `height` | number | Legacy alias for `layout.height` |
| `min` / `min_entity` | number / string | Legacy aliases for `scale.min` |
| `max` / `max_entity` | number / string | Legacy aliases for `scale.max` |
| `fill_style` / `color_mode` | string | Legacy flat aliases for `bar` mode selection |
| `color` | string | Legacy flat alias for `bar.color` |
| `gradient_stops` | list | Legacy flat alias for `bar.gradient_stops` |
| `segments` / `severity` | list | Per-row segment definitions |
| `animated` | boolean | Legacy flat alias for `bar.animated` |
| `target_entity`, `target_color`, `show_target_label`, `above_target_color` | mixed | Legacy target overrides |
| `show_peak`, `peak_color` | mixed | Legacy peak overrides |
| `decimal`, `unit` | mixed | Legacy formatting overrides |

## Layout Options and Responsive Behavior

Supported values:

- `left`
- `above`
- `inside`
- `off`
- `hero`

```yaml
type: custom:sensor-bar-card-plus
title: Left Labels
layout:
  label:
    position: left
bar:
  fill_style: gradient
target:
  at:
    fixed: 65
scale:
  min:
    fixed: 0
  max:
    fixed: 100
entities:
  - entity: sensor.power_usage
    name: Sensor
    icon: mdi:lightning-bolt
```

- `layout.label.position: left`
- `layout.label.position: above`
- `layout.label.position: inside`
- `layout.label.position: off`
- `layout.label.position: hero`

### Hero Label Position

`layout.label.position: hero` gives each row a premium two-lane header: a small label above the bar, a large right-aligned value and unit, and the full-width bar underneath.

Hero mode is designed for values that should be readable at a glance, such as solar production, grid import/export, battery state, temperature, or any dashboard metric that should feel like a primary gauge. It works especially well as a glanceable core gauge replacement when you want richer SBCP features such as dynamic scales, baselines, targets, semantic fills, per-entity overrides, and multi-entity cards.

This mode is intentionally opinionated:

- the value gets priority
- the label may hide before the value becomes cramped
- the icon stays on the left when space allows
- per-entity `layout.label.position: hero` overrides work the same way as the other label modes

#### Hero Size

Hero labels support three built-in size presets:

- `small`
- `medium` (default)
- `large`

These presets control the base Hero typography. For finer control, see **Custom Hero Value Size** below.

The selected preset defines the base Hero typography. All responsive Hero typography is derived automatically from that base size, so the card continues to adapt cleanly as available space changes.

```yaml
layout:
  label:
    position: hero
  hero:
    size: large
```

If omitted, `layout.hero.size` defaults to `medium`.

> **Compatibility**: layout.label.hero_size remains supported as a legacy alias. New configurations should use `layout.hero.size`. If both are specified, `layout.hero.size` takes precedence.

#### Custom Hero Value Size

For finer control, Hero mode also supports an optional custom maximum Hero value size using `layout.hero.value_size`.

```yaml
layout:
  label:
    position: hero
  hero:
    size: medium
    value_size: 72
```

`value_size` specifies the preferred maximum Hero value size in pixels. The responsive layout engine still automatically reduces the rendered size whenever necessary to fit the available space.

When both `layout.hero.size` and `layout.hero.value_size` are specified, `value_size` takes precedence. The `size` preset remains available as the fallback if `value_size` is later removed.

Supported values are **12** through **112** pixels. Values outside this range are automatically clamped.

`layout.hero.size` and `layout.hero.value_size` only apply when `layout.label.position: hero`. They're ignored for all other label positions.

```yaml
type: custom:sensor-bar-card-plus
title: Energy Flow
layout:
  label:
    position: hero
bar:
  fill_style: gradient
  gradient_stops:
    - pos: 0
      color: '#2563eb'
    - pos: 100
      color: '#22c55e'
scale:
  min:
    fixed: 0
  max:
    fixed: 10
entities:
  - entity: sensor.solar_power
    name: Solar Production
    icon: mdi:solar-power
```

#### Hero Responsive Behavior

Hero label mode uses a dedicated responsive layout strategy that prioritizes the value over supporting elements. When horizontal space becomes limited, Hero rows adapt in the following order:

1. Keep the value at its preferred size.
2. Truncate the label if necessary.
3. Hide the label when truncation is no longer sufficient.
4. Hide the unit if additional space is required.
5. Reduce the value size only when the configured Hero size no longer fits.
6. Hide the value only as an absolute last resort.

This prioritization keeps the most important information visible while preserving a stable, premium Hero appearance across a wide range of dashboard widths.

The responsive behavior described above is specific to Hero label mode. The other label positions (`left`, `above`, `inside`, and `off`) continue to use the card's standard responsive layout.

| Behavior | Hero label mode | Standard label modes |
|---|---|---|
| Main priority | Keep the large value readable | Keep the bar readable and aligned |
| Label behavior | Truncate, then hide when the value needs space | Adapt with the row layout and may step aside in tight spaces |
| Unit behavior | Hide only when the value still needs more space | Stays visible as long as practical and is only hidden as a late fallback |
| Icon behavior | Hides in the narrowest Hero layouts | May hide in tight layouts to preserve useful content |
| Best use | Glanceable gauge-style dashboard values | Dense multi-row dashboards and detailed telemetry |

Explicit `layout.height` is still respected exactly. The default row height may shrink automatically in very dense layouts.

### Label Width

When `layout.label.position: left` is used, all names share a fixed label column so the bars line up cleanly. The default width is `100px`, but you can override it globally or per entity.

```yaml
type: custom:sensor-bar-card-plus
title: Label Width
layout:
  label:
    position: left
bar:
  fill_style: solid
  color: '#4a9eff'
scale:
  max:
    fixed: 3000
entities:
  - entity: sensor.power_usage
    name: Label
    layout:
      label:
        width: 35
  - entity: sensor.power_usage
    name: Label
    layout:
      label:
        width: 75
  - entity: sensor.power_usage
    name: Label
```

### Icons

Each row resolves its icon in this order:

1. `icon: false` hides the icon and removes its reserved space
2. `icon: mdi:something` uses that explicit icon
3. otherwise the card uses the entity's own Home Assistant icon

```yaml
type: custom:sensor-bar-card-plus
title: Icon Control
layout:
  label:
    position: left
scale:
  max:
    fixed: 3000
entities:
  - entity: sensor.power_usage
    name: Auto (entity icon)
  - entity: sensor.power_usage
    name: Explicit icon
    icon: mdi:flash
  - entity: sensor.power_usage
    name: No icon
    icon: false
```

## Scale and dynamic value sources

You can source `scale.min`, `scale.max`, and `target.at` from other entities instead of hardcoding them in the card config.

This is especially useful when the scale and threshold are driven by other helpers, automations, or template sensors.

Why dynamic sources matter: the card can follow real Home Assistant entities for scale and target context instead of baking those values into YAML. That makes the visualization adapt naturally to batteries, grid limits, quotas, thresholds, changing operating modes, and dashboards where the meaning of "full", "safe", or "on target" changes over time.

### Dynamic `scale.min` and `scale.max`

```yaml
type: custom:sensor-bar-card-plus
title: Dynamic min and max
bar:
  fill_style: gradient
scale:
  min:
    entity: sensor.dynamic_min
  max:
    entity: sensor.dynamic_max
entities:
  - entity: sensor.live_value
    name: Fully dynamic scale
```

This makes the full bar scale adaptive. The current value stays the same entity, but the visible scale can expand or contract around it.

### Dynamic `target.at.entity`

For a moving threshold, use `target.at.entity`. This is useful for projected limits, tariff boundaries, ramping goals, or automation-driven targets.

```yaml
type: custom:sensor-bar-card-plus
title: Dynamic target
bar:
  fill_style: gradient
target:
  at:
    entity: sensor.power_target
  label:
    show: true
entities:
  - entity: sensor.power_usage
    name: Sensor
```

### Percentage target

```yaml
type: custom:sensor-bar-card-plus
title: Percentage target
scale:
  min:
    fixed: -100
  max:
    fixed: 100
target:
  at: 50%
entities:
  - entity: sensor.power_usage
    name: Sensor
```

If both a fixed value and an entity are configured, the entity takes precedence. If the entity is unavailable or non-numeric, the fixed value is used as fallback.

## Structured Configuration

```yaml
layout:
  label:
    position: left
    width: 160
  hero:
    # Used when label.position is hero
    size: medium
    # Optional maximum Hero value size
    value_size: 72
  height: 38

scale:
  min:
    fixed: 0
  max:
    entity: sensor.dynamic_max

bar:
  fill_style: soft_bands
  segment_space: percent
  color: '#2563eb'
  solid_fill: false
  animated: true
  gradient_stops:
    - pos: 0
      color: '#2563eb'
    - pos: 100%
      color: '#ef4444'
  segments:
    - from: 0%
      to: 50%
      color: '#22c55e'
    - from: 50%
      to: 100%
      color: '#ef4444'
  needle:
    show: true
    color: '#ffffff'

baseline:
  at:
    fixed: 0
  above:
    color: '#34d399'
  below:
    color: '#ef4444'

target:
  at:
    entity: sensor.power_target
    fixed: 2000
  color: '#dbe4ee'
  label:
    show: true
  when_exceeded:
    fill_color: '#ef4444'

peak:
  enabled: true
  color: '#fde68a'

formatting:
  decimal: 1
  unit: kW
```

Notes:

- `bar.segment_space` supports `percent` and `scale`
- `bar.gradient_stops[].pos` accepts both numeric values like `50` and percentage strings like `50%`

## Fill Styles Reference

| `fill_style` | Description |
|---|---|
| `solid` | One solid fill color; best for simple status or branded accents |
| `gradient` | Continuous gradient from `bar.gradient_stops`. ⚠️ Note: Gradient stops are always defined on a normalized 0-100 scale, where 0 represents the start of the bar and 100 the end. To keep gradients working consistently, they cannot be set by absolute values. If you want to use absolute values, use a `band_gradient` instead. |
| `bands` | Hard segment transitions using `bar.segments` |
| `soft_bands` | Segment-based colors with short blended transitions at eligible boundaries |
| `band_gradient` | Continuous interpolation of segment colors on the active scale |

`bands` remains the implicit default when no fill style is configured. This preserves backwards compatibility with the original Sensor Bar Card and ensures older dashboards continue to render identically. New dashboards may specify `bar.fill_style` explicitly, but this is not required.

### Fill style details

Current `color_mode` compatibility names map directly to these fill styles.

If no fill model or palette is specified, Sensor Bar Card Plus defaults to `bands`. This preserves visual compatibility with the original Sensor Bar Card, ensuring that existing dashboards continue to render as expected. An explicitly supplied `color` or `bar.color` by itself selects a solid bar; the implicit default bands do not override that simple color. When a fill mode or palette is explicitly configured, that paint model remains authoritative and `bar.color` remains its solid/fallback color.

Sensor Bar Card Plus separates semantic fill composition from animated reveal geometry. That is what allows gradients, bands, above-target colors, markers, and animations to stay visually coherent while the bar updates.

#### `gradient`

`gradient` paints a true full-bar gradient across the configured scale.


```yaml
type: custom:sensor-bar-card-plus
title: Gradient Fill
bar:
  fill_style: gradient
  gradient_stops:
    - pos: 0
      color: '#2563eb'
    - pos: 50
      color: '#06b6d4'
    - pos: 100
      color: '#ef4444'
scale:
  min:
    fixed: 0
  max:
    fixed: 100
entities:
  - entity: sensor.power_usage
    name: Sensor
```

Needle variant:


```yaml
bar:
  fill_style: gradient
  needle: true
```

#### `bands`

Compatibility name: `severity`

`bands` paints hard bands from `bar.segments`.


```yaml
type: custom:sensor-bar-card-plus
title: Bands Fill
layout:
  label:
    position: left
    width: 160
bar:
  fill_style: bands
  segments:
    - from: 0%
      to: 30%
      color: '#22c55e'
    - from: 30%
      to: 60%
      color: '#facc15'
    - from: 60%
      to: 85%
      color: '#f97316'
    - from: 85%
      to: 100%
      color: '#ef4444'
scale:
  min:
    fixed: 0
  max:
    fixed: 100
target:
  at:
    fixed: 65
  label:
    show: true
entities:
  - entity: sensor.power_usage
    name: Sensor
```

Needle variant:



```yaml
bar:
  fill_style: bands
  needle: true
```

#### `soft_bands`

`soft_bands` uses the same `bar.segments` configuration as `bands`, but blends each eligible boundary over a short transition zone instead of switching colors abruptly.

It sits between the other segment-based styles:

- `bands`: hard transitions
- `soft_bands`: short blended transitions
- `band_gradient`: continuous gradient derived from segment colors


```yaml
type: custom:sensor-bar-card-plus
title: Soft Bands Fill
bar:
  fill_style: soft_bands
  segments:
    - from: 0%
      to: 30%
      color: '#22c55e'
    - from: 30%
      to: 60%
      color: '#facc15'
    - from: 60%
      to: 85%
      color: '#f97316'
    - from: 85%
      to: 100%
      color: '#ef4444'
scale:
  min:
    fixed: 0
  max:
    fixed: 100
entities:
  - entity: sensor.power_usage
    name: Sensor
```

Needle variant:


```yaml
bar:
  fill_style: soft_bands
  needle: true
```

#### `band_gradient`

Compatibility name: `severity_gradient`

`band_gradient` uses the same segment definitions, but renders a continuous gradient derived from those colors instead of painting hard bands.

Anchor model:

- first band color is exact at the first band `from`
- last band color is exact at the last band `to`
- intermediate band colors are exact at the midpoint of their band

This makes the mode feel intuitive while still respecting the configured severity ranges.


```yaml
type: custom:sensor-bar-card-plus
title: Band Gradient Fill
bar:
  fill_style: band_gradient
  segments:
    - from: 0%
      to: 20%
      color: '#22c55e'
    - from: 20%
      to: 35%
      color: '#84cc16'
    - from: 35%
      to: 50%
      color: '#eab308'
    - from: 50%
      to: 65%
      color: '#f59e0b'
    - from: 65%
      to: 80%
      color: '#f97316'
    - from: 80%
      to: 100%
      color: '#ef4444'
scale:
  min:
    fixed: 0
  max:
    fixed: 100
entities:
  - entity: sensor.power_usage
    name: Sensor
```

Needle variant:



```yaml
bar:
  fill_style: band_gradient
  needle: true
```

#### `solid_fill`

`bar.solid_fill: true` samples the theoretical fill color at the current value, then renders the visible fill as one solid color.

This is most useful with `bands`, `band_gradient`, and `gradient` when you want the active color logic without rendering the full multicolor fill across the revealed area.



```yaml
type: custom:sensor-bar-card-plus
title: Sampled Solid Fill
bar:
  fill_style: bands
  solid_fill: true
  segments:
    - from: 0%
      to: 50%
      color: '#22c55e'
    - from: 50%
      to: 100%
      color: '#ef4444'
scale:
  min:
    fixed: 0
  max:
    fixed: 100
entities:
  - entity: sensor.power_usage
    name: Sensor
```

With `fill_style: bands`, the active band color is used directly. With `band_gradient` or `gradient`, the color is sampled from the interpolated gradient at the current value. If `solid_fill` is omitted, normal multicolor rendering is unchanged.


Needle variant:



```yaml
bar:
  fill_style: bands
  solid_fill: true
  needle: true
```

#### Segment Space: `percent` vs `scale`

`bar.segment_space` controls how `bar.segments` positions are interpreted.
Use `percent` when segment boundaries should describe fixed positions across the visible bar. Use `scale` when segment boundaries should describe real values on the configured `scale.min` to `scale.max` range.

##### Percent-space segments

This is the default and the best choice for simple progress-style bars.

```yaml
type: custom:sensor-bar-card-plus
title: Percent Segments
bar:
  fill_style: bands
  segment_space: percent
  segments:
    - from: 0%
      to: 50%
      color: '#22c55e'
    - from: 50%
      to: 80%
      color: '#facc15'
    - from: 80%
      to: 100%
      color: '#ef4444'
scale:
  min:
    fixed: 0
  max:
    fixed: 3000
entities:
  - entity: sensor.power_usage
    name: Power
```

Here, the yellow band always starts halfway across the bar, regardless of whether the active scale is `0-100`, `0-3000`, or dynamically supplied by entities.

##### Scale-space segments

Use `scale` when segment boundaries are meaningful real values.

```yaml
type: custom:sensor-bar-card-plus
title: Scale Segments
bar:
  fill_style: bands
  segment_space: scale
  segments:
    - from: 0
      to: 1000
      color: '#22c55e'
    - from: 1000
      to: 2000
      color: '#facc15'
    - from: 2000
      to: 3000
      color: '#ef4444'
scale:
  min:
    fixed: 0
  max:
    fixed: 3000
entities:
  - entity: sensor.power_usage
    name: Power
```

Here, the yellow band begins at the real value `1000` on the configured scale. If the scale later changes, the segment positions are recalculated so the colors still represent the same real-world thresholds.

##### When to use which

|Mode|Best for|Segment values mean|
|---|---|---|
|`percent`|progress bars, quotas, generic utilization|positions from 0% to 100% across the bar|
|`scale`|temperatures, power thresholds, CO₂ ranges, real sensor limits|actual values on the configured scale|

For legacy severity migrations, `percent` is usually the correct choice because older severity bands were interpreted as percentages of the visible bar.

#### `solid`

Compatibility name: `single`

`solid` uses one fixed fill color regardless of value.


```yaml
type: custom:sensor-bar-card-plus
title: Solid Fill
bar:
  fill_style: solid
  color: '#14b8a6'
scale:
  min:
    fixed: 0
  max:
    fixed: 100
entities:
  - entity: sensor.power_usage
    name: Sensor
```

## Needle

Simple form:

```yaml
bar:
  needle: true
```

Expanded form:

```yaml
bar:
  needle:
    show: true
    color: '#ffffff'
```

Notes:

- `bar.needle: true` is the preferred simple syntax
- `bar.needle.show` explicitly enables or disables the needle in structured form
- `bar.needle.color` sets the needle body and glow color
- the bar switches to full-scale paint mode when the needle is shown
- the current value is represented by the needle position
- the needle works with `solid`, `gradient`, `bands`, `soft_bands`, `band_gradient`, and `solid_fill`
- the needle is disabled automatically when a baseline is active

## Baseline

Use `baseline` when the fill should start from a neutral point instead of always starting at `min`.

- `baseline` defines the fill origin on the configured `min` to `max` scale
- gradients and severity modes still represent the full global scale
- baseline changes fill geometry, not the meaning of the scale
- `baseline.above` and `baseline.below` are optional semantic overlays when you want each side to read differently
- `baseline.at` can use either an absolute scale value or a percentage string such as `50%`

This is useful for batteries, charge and discharge, import and export, neutral operating points, and any bidirectional flow where movement on either side of a reference value should read clearly at a glance.

### Structured baseline configuration

Recommended baseline syntax uses the structured form:

```yaml
baseline:
  at:
    fixed: 0
```

Dynamic baselines use the same structure:

```yaml
baseline:
  at:
    entity: sensor.dynamic_baseline
```

Advanced baseline behavior is grouped under `baseline:` so related options stay together, the config remains extensible, and the YAML does not drift into flat one-off parameters over time. Legacy shorthand remains supported and is covered in the migration and legacy reference sections.

### Centered zero baseline

```yaml
type: custom:sensor-bar-card-plus
title: Grid Flow
bar:
  fill_style: gradient
scale:
  min:
    fixed: -3000
  max:
    fixed: 3000
baseline:
  at:
    fixed: 0
entities:
  - entity: sensor.grid_power
    name: Grid
```

### Off-center baseline

```yaml
type: custom:sensor-bar-card-plus
title: Off-center baseline
bar:
  fill_style: band_gradient
  segments:
    - from: 0%
      to: 30%
      color: '#22c55e'
    - from: 30%
      to: 70%
      color: '#facc15'
    - from: 70%
      to: 100%
      color: '#ef4444'
scale:
  min:
    fixed: -2000
  max:
    fixed: 5000
baseline:
  at:
    fixed: 500
entities:
  - entity: sensor.net_power
    name: Net Power
```

### Percentage baseline

```yaml
type: custom:sensor-bar-card-plus
title: Midpoint Baseline
bar:
  fill_style: gradient
scale:
  min:
    fixed: -100
  max:
    fixed: 100
baseline:
  at: 50%
entities:
  - entity: sensor.power_flow
    name: Flow
```

### Baseline colors and overrides

The base semantic scale still spans the full bar. Optional above and below colors sit on top of that scale when you want the two directions to carry distinct meaning.

#### Above-baseline color only

```yaml
type: custom:sensor-bar-card-plus
title: Battery Bias
bar:
  fill_style: gradient
scale:
  min:
    fixed: -3200
  max:
    fixed: 3200
baseline:
  at:
    fixed: 0
  above:
    color: '#34d399'
entities:
  - entity: sensor.home_battery_power
    name: Battery
```

#### Above and below baseline colors

```yaml
type: custom:sensor-bar-card-plus
title: Bidirectional Override
bar:
  fill_style: gradient
scale:
  min:
    fixed: -3200
  max:
    fixed: 3200
baseline:
  at:
    fixed: 0
  above:
    color: '#34d399'
  below:
    color: '#ef4444'
entities:
  - entity: sensor.home_battery_power
    name: Battery
```

### Target and baseline interaction

Targets stay on the same global scale, so threshold markers, `target.when_exceeded.fill_color`, and baseline geometry remain easy to read together. Marker position does not move the fill origin.

```yaml
type: custom:sensor-bar-card-plus
title: Target And Baseline Interaction
bar:
  fill_style: band_gradient
  segments:
    - from: 0%
      to: 30%
      color: '#22c55e'
    - from: 30%
      to: 70%
      color: '#facc15'
    - from: 70%
      to: 100%
      color: '#ef4444'
scale:
  min:
    fixed: -100
  max:
    fixed: 100
target:
  label:
    show: true
  when_exceeded:
    fill_color: '#fb7185'
baseline:
  at:
    fixed: 0
entities:
  - entity: sensor.power_flow
    name: Target above baseline
    target:
      at:
        fixed: 28
```

### Animated semantic baseline

Animated baseline rows keep the semantic color scale stable while the visible interval moves. That makes baseline crossing, threshold transitions, and bidirectional motion much easier to read.

### Dynamic baseline

If both an `entity` and a `fixed` value are set under `baseline.at`, the entity takes precedence. If that entity is unavailable or non-numeric, the `fixed` value is used as fallback.

```yaml
type: custom:sensor-bar-card-plus
title: Dynamic baseline
bar:
  fill_style: gradient
scale:
  min:
    fixed: -3000
  max:
    fixed: 3000
baseline:
  at:
    entity: sensor.dynamic_baseline
    fixed: 0
entities:
  - entity: sensor.grid_power
    name: Grid
```

### Compact baseline layouts

Baseline also works well in denser dashboard layouts where you still want bidirectional meaning without giving up readability.

## Target Marker

Simple fixed target:

```yaml
target: 65
```

Structured fixed target:

```yaml
target:
  at:
    fixed: 65
  color: '#dbe4ee'
  label:
    show: true
```

Structured entity target:

```yaml
target:
  at:
    entity: sensor.dynamic_target
    fixed: 65
```

Target shape:

```yaml
target:
  at:
    fixed: 65
  shape: triangle
```

Percentage target:

```yaml
target:
  at: 50%
```

Supported target features:

- fixed target values
- entity-backed target values
- percentage targets on the active scale
- optional marker color
- diamond target marker by default; set `target.shape: triangle` to retain the previous triangle
- optional target value label
- optional `target.when_exceeded.fill_color`

Migration note: The default Target marker is now a diamond, making it easier to distinguish from the new Floor marker. To retain the previous triangle, set `target.shape: triangle`.

### Target labels and exceeded fill

A Target label is hidden by default. Enable it with `target.label.show`; the label can compose optional text, formatted value, and the row unit. Numeric precision inherits `formatting.decimal` unless `target.label.precision` is set. The established `target.label.decimal` alias remains supported.

~~~yaml
target:
  at:
    fixed: 55
  label:
    show: true
    text: Limit
    show_value: true
    show_unit: true
    precision: 1
~~~

`target.when_exceeded.fill_color` gives the revealed fill beyond the Target a semantic color. The configured Target and Baseline remain on the same scale.

~~~yaml
target:
  at:
    entity: sensor.power_target
  when_exceeded:
    fill_color: '#dc2626'
~~~

## Peak Marker

```yaml
peak:
  enabled: true
  color: '#fde68a'
  reset: never
  label:
    show: false
```

The Peak marker tracks the highest finite value observed for the current card session. `reset: never` is the default. See [Peak and Floor reset behavior](#peak-and-floor-reset-behavior) for relative duration and local calendar resets.

## Floor Marker

```yaml
floor:
  enabled: true
  color: '#888888'
  reset: daily
  label:
    show: true
    decimal: 1
```

The Floor marker tracks the lowest finite value observed for the current card session. It uses the shared below marker lane with Target and does not allocate another vertical lane.

## Generic marker source resolution and limits

A generic marker source can be a finite fixed number, a percentage string from 0% through 100%, an entity ID, or an entity with an optional fixed fallback. Percentage positions map to the effective row scale. If both an entity and fixed fallback are configured, a finite entity value takes precedence; the fallback is used when the entity is missing or non-finite. Marker source entity units are not converted to the row unit.

Each lane holds up to four markers. Peak occupies one `above` slot; Floor and Target each occupy one `below` slot when enabled and configured. Generic markers use only the capacity remaining in their configured lane, so there is no separate maximum for generic markers across the card. Generic markers are considered in configuration order: malformed entries do not consume capacity, and an excess marker in a full lane is skipped while later markers in the other lane are still considered. Markers are not moved between lanes. An accepted marker that is temporarily unresolved stays in its configured lane and reserves its slot. `show_marker: false` hides only the marker shape; the marker still consumes a slot. Finite values outside the row scale keep their actual value for labels while their marker shape is clamped to the nearest track endpoint. Nearby labels can overlap; the card does not automatically stack them.

## Generic Reference Markers

Use `markers:` to configure generic references. Up to four markers can appear in each lane, counting Peak in `above` and Floor and Target in `below`; the accepted generic-marker count depends on the remaining lane capacity. Generic markers are configured references, not trackers. Marker position is controlled only by `at`; optional `label.entity` independently supplies the displayed label value and unit. Neither source is converted between units.

```yaml
type: custom:sensor-bar-card-plus
scale:
  min: { fixed: 0 }
  max: { fixed: 100 }
target:
  at: 50%
  label: { show: true, text: Target }
peak:
  enabled: true
floor:
  enabled: true
markers:
  - at: 35%
    lane: above
    shape: diamond
    color: "#4488CC"
    label:
      show: true
      text: Prediction
      show_value: true
      show_unit: true
      precision: 0
  - at:
      entity: sensor.warning_threshold
      fixed: 75
    lane: below
    shape: circle
    color: "#F59E0B"
    label:
      show: true
      text: Trigger
      show_value: false
      show_unit: true
entities:
  - entity: sensor.grid_power
```

`at` accepts a fixed value (`{ fixed: 75 }`), a dynamic entity (`{ entity: sensor.limit }`), an entity with fixed fallback, or a percentage string such as `35%`. Percentages are inclusive from `0%` to `100%` of the effective row scale. Their labels show the resolved scale value. Finite fixed and dynamic values outside the scale remain valid: only their graphical position is clamped, while the label keeps the original value.

Markers default to a visible marker shape, the `below` lane, `circle` shape, color `#888888`, and a hidden label. Set `show_marker: false` to retain the marker's position and label while hiding only its shape. The supported shapes are `circle`, `diamond`, `triangle`, `chevron`, `arrow`, and `pin`; lanes are `above` and `below`. Direction defaults to `inward`; `direction: inward | outward` controls directional shapes, while Circle and Diamond are visually unaffected. Target, Peak, and Floor inherit their card-level direction in entity rows unless overridden. Generic markers are inherited as a card-level list, or replaced as a whole by an entity-level `markers` list.

A shown marker label is composed from `text`, `show_value` (default `true`), and `show_unit` (default `true`), each independently enabled; `label.show: true` enables the label. Components are joined by one space. If all components are absent or suppressed, no label is rendered. Without `label.entity`, the value comes from the resolved `at` position and the unit is the row's effective unit. With `label.entity`, its state supplies the value and its own `unit_of_measurement` supplies the unit; this content entity never changes the marker position. Numeric content uses `label.precision` when set, otherwise the row's effective `formatting.decimal`. Text states are shown as text, and units are never converted. A missing, empty, `unknown`, or `unavailable` label entity omits both its value and unit; any configured `text` remains visible. Marker position and visibility continue to depend only on `at`. For compatibility, generic, Peak, and Floor labels also accept `label.decimal`; Target continues to accept its established `target.label.decimal` spelling. Use `label.show_unit: false` to omit the unit. The former marker-label `unit` option is unsupported; use `show_unit`.

For example, a fixed endpoint can act as an information anchor while the label follows a separate numeric or textual sensor:

```yaml
markers:
  - at:
      fixed: 100
    show_marker: false
    lane: above
    label:
      show: true
      text: Daily energy
      entity: sensor.daily_energy
      precision: 1
  - at: 0%
    show_marker: false
    lane: below
    label:
      show: true
      entity: sensor.battery_status
```

The first marker could display `Daily energy 12.4 kWh`; the second can display a text state such as `Charging`. Label-only anchors still count toward their lane's four-marker capacity and retain normal lane layout and endpoint clamping.

At card scope, `markers:` supplies the list inherited by each entity. An entity may replace the list with its own `markers: [...]`; `markers: []` explicitly clears the inherited list. Lists replace rather than merge. A valid but unresolved marker still reserves its configured lane. Malformed markers do not consume capacity. A generic marker assigned to a full lane remains in configuration but is not rendered and produces a non-fatal warning; later markers in the other lane are still considered. Peak, Floor, and Target count toward their respective lane limits. Nearby marker labels may overlap.

## Formatting

The card handles four related display concerns:

- decimal precision
- unit override
- tight time units like `43s` or `4h`
- textual states such as `unknown`, `unavailable`, and custom text pass-through

### Decimal Precision

Use `formatting.decimal` to display exactly how many fractional digits are shown per row, including trailing zeroes. Values are rounded to that precision; omitting the setting keeps the raw locale-aware numeric display.

For example, `decimal: 2` displays `42` as `42.00` and `100.8` as `100.80`.

```yaml
type: custom:sensor-bar-card-plus
title: Decimal Places
layout:
  label:
    position: left
    width: 160
scale:
  min:
    fixed: 0
  max:
    fixed: 40
entities:
  - entity: sensor.temperature
    name: No decimal (0)
    formatting:
      decimal: 0
  - entity: sensor.temperature
    name: One decimal (1)
    formatting:
      decimal: 1
  - entity: sensor.temperature
    name: Two decimals (2)
    formatting:
      decimal: 2
  - entity: sensor.temperature
    name: Raw (no decimal set)
```

### Unit Override

By default the card displays the entity's unit of measurement. Use `formatting.unit` to override that when you want a shorter, normalized, or more readable display unit.

```yaml
type: custom:sensor-bar-card-plus
entities:
  - entity: sensor.solar_power
    name: Solar
    formatting:
      unit: W
  - entity: sensor.daily_energy
    name: Today
    formatting:
      unit: kWh
```

### Tight Time Units

Time units `h`, `m`, and `s` render tight, for example `43s` and `4h`, instead of showing an extra space.

```yaml
type: custom:sensor-bar-card-plus
title: Tight Time Unit - Seconds
bar:
  fill_style: solid
  color: '#2563eb'
scale:
  min:
    fixed: 0
  max:
    fixed: 60
entities:
  - entity: sensor.response_time
    name: Response time
    formatting:
      unit: s
```

### Text States

Non-numeric current states are handled as first-class display states rather than treated like broken numeric rows.

```yaml
type: custom:sensor-bar-card-plus
title: Unknown And Unavailable
bar:
  fill_style: bands
  segments:
    - from: 0%
      to: 50%
      color: '#22c55e'
    - from: 50%
      to: 100%
      color: '#ef4444'
layout:
  label:
    position: left
entities:
  - entity: sensor.status_unknown
    name: Unknown
  - entity: sensor.status_unavailable
    name: Unavailable
```

## Behavior Notes

- Peak and Floor values are stored in memory and reset when the card or browser is recreated.
- Responsive fallbacks prioritize the bar and keep value and unit readable. In tight spaces, labels and icons may step aside automatically.

## Interaction and error behavior

Clicking a row opens Home Assistant's native more-info dialog for that entity. No extra configuration is required.

If an entity is missing, unavailable to the card, or misconfigured, the card renders an inline row-level error instead of crashing the whole card. Other rows continue to render normally.

Textual states such as unknown or unavailable are displayed as text rather than formatted numeric values, and do not show a leftover unit. Time units h, m, and s render without an extra space, for example 43s and 4h.

## Peak and Floor reset behavior

Peak and Floor track finite samples in memory for each card row. They are visual extrema, not durable historical statistics. The default reset policy is `never`. Duration windows accept `1m`–`59m` and `1h`–`23h` and begin at the first finite sample in the window; they are elapsed-time windows, not clock-aligned. A reset is applied lazily when the next finite sample arrives at or after expiry.

Calendar reset policies use local time boundaries: `quarterly` means quarter-hour boundaries (`:00`, `:15`, `:30`, and `:45`), followed by `hourly`, `daily`, `weekly` (Monday start), `monthly`, and `yearly`. Invalid reset values fall back to `never` with a configuration warning. Changing an effective reset policy clears that tracker's stored extremum; disabling Peak or Floor clears that tracker independently. Unknown or unavailable primary values do not erase the previous finite extremum.

## Invalid and unsupported configuration

Invalid configuration is reported through non-fatal diagnostics where applicable. Unsupported or malformed generic marker entries are skipped; valid excess entries remain in configuration but do not render and produce a capacity warning. Invalid reset syntax falls back to `never`. Percentage generic sources use percentage strings; an `at.percent` object field is unsupported. See the feature-specific sections for normalization and compatibility details.

## Legacy Compatibility and Migration

Legacy syntax remains fully supported for backward compatibility.

| Legacy | Modern Equivalent |
|---|---|
| `color_mode: single` | `bar.fill_style: solid` |
| `color_mode: gradient` | `bar.fill_style: gradient` |
| `color_mode: severity` | `bar.fill_style: bands` |
| `color_mode: severity_gradient` | `bar.fill_style: band_gradient` |
| `label_position` | `layout.label.position` |
| `label_width` | `layout.label.width` |
| `height` | `layout.height` |
| `min` / `min_entity` | `scale.min.fixed` / `scale.min.entity` |
| `max` / `max_entity` | `scale.max.fixed` / `scale.max.entity` |
| `target` / `target_entity` | `target.at.fixed` / `target.at.entity` |
| `target_color` | `target.color` |
| `show_target_label` | `target.label.show` |
| `above_target_color` | `target.when_exceeded.fill_color` |
| `show_peak` / `peak_color` | `peak.enabled` / `peak.color` |
| `decimal` / `unit` | `formatting.decimal` / `formatting.unit` |
| `severity` | `bar.segments` using `%` values when migrating legacy bands |

### Migrating From The Original Card

Install this card side by side, then update:

- resource URL from the original file to `/local/sensor-bar-card-plus.js`
- card type from `custom:sensor-bar-card` to `custom:sensor-bar-card-plus`

### Migrating From Legacy Flat YAML

You do not need to migrate existing dashboards immediately. For new dashboards, the structured model is recommended because related options stay grouped and the configuration scales better as cards become more advanced.

| Legacy flat key | Structured equivalent |
|---|---|
| `label_position` | `layout.label.position` |
| `label_width` | `layout.label.width` |
| `height` | `layout.height` |
| `min` | `scale.min.fixed` |
| `min_entity` | `scale.min.entity` |
| `max` | `scale.max.fixed` |
| `max_entity` | `scale.max.entity` |
| `decimal` | `formatting.decimal` |
| `unit` | `formatting.unit` |
| `target` | `target.at.fixed` or `target.at: 50%` |
| `target_entity` | `target.at.entity` |
| `target_color` | `target.color` |
| `show_target_label` | `target.label.show` |
| `above_target_color` | `target.when_exceeded.fill_color` |
| `show_peak` | `peak.enabled` |
| `peak_color` | `peak.color` |
| `color_mode` | `bar.color_mode` (compatibility) |
| `fill_style` | `bar.fill_style` (preferred structured syntax) |
| `color` | `bar.color` |
| `gradient_stops` | `bar.gradient_stops` |
| `severity` | `bar.segments` with percentage values, for example `from: 50%` |
| `segments` | `bar.segments` |
| `animated` | `bar.animated` |
| `baseline` | `baseline.at.fixed`, `baseline.at.entity`, or `baseline.at: 50%` |
| `layout.label.hero_size` | `layout.hero.size` |

Legacy:

```yaml
type: custom:sensor-bar-card-plus
title: Legacy Example
label_position: left
label_width: 150
min: 0
max: 100
color_mode: severity
target: 65
show_target_label: true
severity:
  - from: 0
    to: 50
    color: '#22c55e'
  - from: 50
    to: 100
    color: '#ef4444'
entities:
  - entity: sensor.power_usage
    name: Power
```

Structured:

```yaml
type: custom:sensor-bar-card-plus
title: Structured Example
layout:
  label:
    position: left
    width: 150
scale:
  min:
    fixed: 0
  max:
    fixed: 100
bar:
  fill_style: bands
  segments:
    - from: 0%
      to: 50%
      color: '#22c55e'
    - from: 50%
      to: 100%
      color: '#ef4444'
target:
  at:
    fixed: 65
  label:
    show: true
entities:
  - entity: sensor.power_usage
    name: Power
```

When migrating legacy `severity`, remember that legacy band numbers are percentages of the active scale. Structured `bar.segments` should therefore usually use `%` values during migration. Plain numeric segment boundaries are actual scale values.

`bar.fill_style` is now the preferred structured syntax for new dashboards. Existing `bar.color_mode` remains fully supported for compatibility and renders identically.

For a full visual comparison, see `examples/dashboards/sensor-bar-card-plus-heritage.yaml`.

### Automatic Dashboard Migration

Existing dashboards do not need to be migrated. Legacy flat YAML remains fully supported. This utility is available if you want to adopt the structured configuration model for an existing Lovelace dashboard.

```bash
python tools/convert-legacy-config.py dashboard.yaml > dashboard-structured.yaml
```

```bash
python tools/convert-legacy-config.py dashboard.yaml dashboard-structured.yaml
```

```bash
cat dashboard.yaml | python tools/convert-legacy-config.py > dashboard-structured.yaml
```

The converter only rewrites Sensor Bar Card Plus cards. All other Lovelace cards, custom cards, `card_mod` configuration, and unrelated YAML are left unchanged.

It traverses dashboards recursively, so nested Sensor Bar Card Plus cards are converted even when they appear inside wrapper cards or more complex dashboard structures.

The conversion is deterministic and follows the same migration rules used by the Heritage Dashboard examples.
