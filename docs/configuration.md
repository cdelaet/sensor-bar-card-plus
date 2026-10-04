# Configuration Reference

This is the exhaustive reference for Sensor Bar Card Plus YAML. For the practical guide and feature concepts, start with the [README](../README.md). This document describes the supported fields, defaults, scope, compatibility forms, and behavior details.

## Contents

- [Scope, inheritance, and replacement](#scope-inheritance-and-replacement)
- [Configuration hierarchy](#configuration-tree)
- [Property overview](#configuration-overview)
- [Card-level options](#top-level-card-options)
- [Entity-level options](#top-level-entity-options)
- [Layout](#layout-options-and-responsive-behavior)
- [Scale and live sources](#scale-and-dynamic-value-sources)
- [Complete example](#complete-example)
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

Card configuration supplies defaults for the supported per-row settings: `layout`, `scale`, `bar`, `baseline`, `target`, `peak`, `floor`, `markers`, and `formatting`. Entity rows can override these groups for their own row. `title` is a card-level control; `name` and `icon` are row-specific values. The `entities` list accepts entity ID strings or entity objects.

An omitted entity-level setting generally inherits the corresponding card-level setting, but inheritance is field-specific. Lists replace rather than merge: this applies to `markers`, `bar.segments`, and `bar.gradient_stops`. Generic markers are inherited from the card by default; an entity-level `markers` list replaces that list, and `markers: []` explicitly clears it. A supplied source object can replace the inherited source as a whole rather than merge its members. If a dynamic source needs a fallback, include both values explicitly, for example `{ entity: sensor.example, fixed: 10 }`. Legacy flat aliases listed in the entity options table are also accepted at entity scope where listed.

## Configuration Tree

Settings are grouped by feature. Card-level settings supply row defaults; fields inside an `entities[]` entry override settings for that row.

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
├── at (number, percentage string, or source object)
│   ├── fixed
│   ├── entity
│   └── percent
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
├── at (number, percentage string, or source object)
│   ├── fixed
│   ├── entity
│   └── percent
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
├── at (number, percentage string, or source object)
│   ├── fixed
│   └── entity
├── show_marker
├── lane
├── shape
├── direction
├── color
└── label
    ├── show
    ├── text
    ├── entity
    ├── show_value
    ├── show_unit
    ├── precision
    └── decimal (compatibility alias)

formatting
├── decimal
└── unit
```

## Configuration Overview

Use this overview to find a field by YAML path. Exact scope and behavior are described in the sections below.

### Layout

| Path | Default | Values | Description |
|---|---:|---|---|
| `layout.height` | `38` | number | Requested rail height in pixels; values below `24` are clamped. When omitted, narrow layouts may use `28` or `24`. Complete rows can be taller. |
| `layout.label.position` | `left` | `left`, `above`, `inside`, `off`, `hero` | Label placement mode. |
| `layout.label.width` | `100` | number | Responsive width/cap for the label in `left` mode; available card width can make the rendered column narrower. |
| `layout.hero.size` | `medium` | `small`, `medium`, `large` | Built-in Hero typography preset. Applies only when `layout.label.position: hero`. |
| `layout.hero.value_size` | preset size | `12–112` | Optional preferred maximum Hero value size in pixels. Overrides `layout.hero.size` while retaining responsive fitting. Applies only to Hero. |

### Scale

| Path | Default | Values | Description |
|---|---:|---|---|
| `scale.min.fixed` | `0` for an unspecified bound | number | Fixed lower bound or explicitly configured fallback. With two dynamic bounds, configure both fixed fallbacks together. |
| `scale.min.entity` | absent | entity ID | Live source for the lower bound. |
| `scale.max.fixed` | `100` for an unspecified bound | number | Fixed upper bound or explicitly configured fallback. With two dynamic bounds, configure both fixed fallbacks together. |
| `scale.max.entity` | absent | entity ID | Live source for the upper bound. |

The Scale must have a minimum below its maximum. Two dynamic bounds are resolved as a pair, rather than mixing one live bound with a fallback. See [Scale and live sources](#scale-and-dynamic-value-sources) for fallback and temporary invalid-pair behavior. Values outside the effective Scale are drawn at the nearest rail endpoint; their displayed numeric value is unchanged.

### Bar and fill

| Path | Default | Values | Description |
|---|---:|---|---|
| `bar.fill_style` | `bands` | `solid`, `gradient`, `bands`, `soft_bands`, `band_gradient` | Appearance of the visible fill. |
| `bar.color` | `#4a9eff` | CSS color | Solid or fallback fill color. A color configured alone selects a solid bar unless an explicit fill style or palette is inherited. |
| `bar.solid_fill` | `false` | boolean | Samples the active color and renders the revealed fill as one solid color. |
| `bar.animated` | `true` | boolean | Enables or disables value-change animations for the revealed fill and related visual elements. |
| `bar.needle` | `false` | boolean or object | Enables needle mode using `true`, or accepts the expanded `{ show, color }` configuration. |
| `bar.needle.show` | `false` | boolean | Explicitly enables or disables needle mode in expanded configuration. |
| `bar.needle.color` | `#ffffff` | CSS color | Needle body and glow color; a light or dark edge is added based on that color. |
| `bar.segments` | default bands | list | Segment definitions for `bands`, `soft_bands`, and `band_gradient`. Each item has `from`, optional `to`, and `color`; boundaries use value or percentage coordinates independently. |
| `bar.segments[].from` / `bar.segments[].to` | — | number or percentage string | Start/end boundary. A number is an active-scale value; a `%` string is a percentage of the visible scale. `to` may be omitted to end at the next segment start or the end of the scale. |
| `bar.segments[].color` | — | CSS color | Color assigned to the segment. |
| `bar.gradient_stops` | `null` | list | Gradient stop definitions for `gradient`. Each item has `pos` and `color`. |
| `bar.gradient_stops[].pos` | required | number or percentage string | Percentage across the visible rail from `0` to `100`: `50` and `50%` both mean the midpoint. Unlike Segment boundaries, bare numbers are not Scale values. |
| `bar.gradient_stops[].color` | — | CSS color | Color at the gradient stop. |

### Baseline

| Path | Default | Values | Description |
|---|---:|---|---|
| `baseline.enabled` | auto | `true`, `false`, omitted | Controls baseline behavior. Omitted means automatic based on configured baseline source. |
| `baseline.at` | absent | number, percentage string, entity ID, or source object | Baseline position as a Scale value, visible-Scale percentage, or source with `fixed`, `entity` and/or `percent`. |
| `baseline.at.fixed` | `null` | number | Fixed baseline value; fallback when the entity does not provide a usable number. |
| `baseline.at.entity` | `null` | entity id | Dynamic baseline entity; its usable numeric state takes precedence over `fixed`. |
| `baseline.at.percent` | absent | number | Percentage across the visible Scale in a source object; alternatively use `baseline.at: 50%`. |
| `baseline.above.color` | ordinary fill | CSS color | Optional color for the Scale region above Baseline. |
| `baseline.below.color` | ordinary fill | CSS color | Optional color for the Scale region below Baseline. |

### Target

| Path | Default | Values | Description |
|---|---:|---|---|
| `target.enabled` | auto | `true`, `false`, omitted | Controls target marker behavior. Omitted means automatic based on configured target source. |
| `target.at` | absent | number, percentage string, entity ID, or source object | Target position as a Scale value, visible-Scale percentage, or source with `fixed`, `entity` and/or `percent`. |
| `target.at.fixed` | `null` | number | Fixed target value; fallback when the entity does not provide a usable number. |
| `target.at.entity` | `null` | entity id | Dynamic target entity; its usable numeric state takes precedence over `fixed`. |
| `target.at.percent` | absent | number | Percentage across the visible Scale in a source object; alternatively use `target.at: 50%`. |
| `target.shape` | `diamond` | `diamond`, `triangle` | Target marker shape. |
| `target.color` | `#888888` | CSS color | Target marker color. |
| `target.direction` | `inward` | `inward`, `outward` | Direction of the triangle Target; the diamond shape is not directional. Entity-level Target direction inherits the card-level value unless overridden. |
| `target.label.show` | `false` | boolean | Enables the composed Target label; its text, value, and unit components are configured independently below. |
| `target.label.text` | absent | string | Optional plain text shown before the value and unit. |
| `target.label.show_value` | `true` | boolean | Includes or omits the formatted Target value independently of text and unit. |
| `target.label.show_unit` | `true` | boolean | Includes or omits the effective row unit independently of text and value. |
| `target.label.precision` | inherited | number | Overrides the numeric component's precision; omitted values inherit `formatting.decimal`. The established `target.label.decimal` spelling remains accepted for existing configurations. |
| `target.when_exceeded.fill_color` | absent | CSS color | Color over the revealed region above Target, including over Baseline-side colors. |

### Peak

| Path | Default | Values | Description |
|---|---:|---|---|
| `peak.enabled` | `false` | boolean | Shows a session peak marker. |
| `peak.color` | `#888888` | CSS color | Peak marker color. |
| `peak.reset` | `never` | reset value | Resets Peak using a relative duration or local calendar boundary. |
| `peak.direction` | `inward` | `inward`, `outward` | Direction of the fixed triangle marker. Entity-level Peak direction inherits the card-level value unless overridden. |
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
| `floor.direction` | `inward` | `inward`, `outward` | Direction of the fixed triangle marker. Entity-level Floor direction inherits the card-level value unless overridden. |
| `floor.label.show` | `false` | boolean | Shows the formatted Floor value label. |
| `floor.label.text` | absent | string | Optional plain text shown before the value and unit. |
| `floor.label.show_value` | `true` | boolean | Includes or omits the formatted Floor value independently of text and unit. |
| `floor.label.show_unit` | `true` | boolean | Includes or omits the effective row unit independently of text and value. |
| `floor.label.precision` | inherited | number | Overrides the numeric component's precision; omitted values inherit `formatting.decimal`. `floor.label.decimal` remains accepted for existing configurations. |

### Generic reference markers

| Path | Default | Values | Description |
|---|---:|---|---|
| `markers[]` | `[]` | marker entries | Card-level markers are inherited; an entity-level list replaces them, and `markers: []` clears them. |
| `markers[].at` | required | number, percentage string, entity ID, or source object | Marker position. Use a `%` string for a percentage of the visible row Scale. |
| `markers[].at.fixed` | absent | number | Marker anchor value on the active scale; fallback for an entity source. |
| `markers[].at.entity` | absent | entity ID | Live marker anchor; a usable entity value takes precedence over `fixed`. |
| `markers[].show_marker` | `true` | boolean | Hides only the marker shape when false. The anchor position, lane, and label remain active. |
| `markers[].lane` | `below` | `above`, `below` | Selects the lane immediately above or below the rail. Inward shapes point into it; labels sit outside. |
| `markers[].shape` | `circle` | `circle`, `diamond`, `triangle`, `chevron`, `arrow`, `pin` | Marker shape. |
| `markers[].direction` | `inward` | `inward`, `outward` | Direction for directional shapes; circle and diamond are unaffected. |
| `markers[].color` | `#888888` | CSS color | Marker shape and label color. |
| `markers[].label` | hidden | object | Optional text/value/unit label settings. |
| `markers[].label.show` | `false` | boolean | Enables the generic marker label. `label.entity` does not implicitly enable it. |
| `markers[].label.text` | absent | string | Optional text component in the label. |
| `markers[].label.entity` | absent | entity ID | Optional independent content source. It supplies label state and its own unit without affecting `at`. |
| `markers[].label.show_value` | `true` | boolean | Includes or omits the formatted value component. |
| `markers[].label.show_unit` | `true` | boolean | Includes or omits the effective source/row unit. |
| `markers[].label.precision` | inherited | number | Numeric label precision; defaults to the row's `formatting.decimal`. |
| `markers[].label.decimal` | inherited | number | Compatibility alias for `label.precision`. |

### Formatting

| Path | Default | Values | Description |
|---|---:|---|---|
| `formatting.decimal` | locale-aware numeric display | number | Sets an explicit number of decimal places, including trailing zeroes. |
| `formatting.unit` | entity unit | string | Display unit text override; does not convert the numeric value. |

Legacy flat options are listed separately in the Legacy Compatibility and Migration section. They remain supported, but new dashboards should prefer the structured paths above.

## Top-Level Card Options

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | `—` | Optional Lovelace card title |
| `entity` | string | `—` | Creates one row without an `entities` list |
| `entities` | list | required unless using `entity` shorthand | Rows to render; items may be entity ID strings or entity objects |
| `layout` | object | see below | Default layout for all rows |
| `scale` | object | `min: 0`, `max: 100` | Default scale for all rows |
| `bar` | object | see below | Default fill, Needle and animation settings |
| `baseline` | number/object | disabled | Default Baseline / fill origin; percentages go under `baseline.at` |
| `target` | number/object | disabled | Default Target marker; percentages go under `target.at` |
| `peak` | object | disabled | Default structured Peak marker config |
| `floor` | object | disabled | Default structured Floor marker config |
| `markers` | list | `[]` | Generic reference markers inherited by entity rows unless replaced |
| `formatting` | object | locale-aware numbers; entity unit | Default decimal precision and displayed unit text |
| `label_position` | string | `left` | Legacy alias for `layout.label.position` |
| `label_width` | number | `100` | Legacy alias for `layout.label.width` |
| `height` | number | `38` | Legacy alias for `layout.height`; minimum rail height is `24` |
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

| Option | Type | Default | Description |
|---|---|---|---|
| `entities[].entity` | string | required | Home Assistant entity ID for the row |
| `entities[].name` | string | HA friendly name, then entity ID | Overrides the displayed name |
| `entities[].icon` | string or `false` | HA icon, then supported device-class/domain fallback | Overrides the icon; `false` removes it. Hero never shows an icon. |
| `entities[].layout` | object | inherits card layout | Per-row layout override |
| `entities[].scale` | object | inherits card Scale | Per-row Scale override |
| `entities[].bar` | object | inherits card bar settings | Per-row fill and Needle override |
| `entities[].target` | object/number | inherits card Target | Per-row Target override; percentages go under `at` |
| `entities[].peak` | object | inherits card Peak | Per-row Peak override |
| `entities[].floor` | object | inherits card Floor | Per-row Floor override |
| `entities[].markers` | list | inherits card marker list | Replaces the inherited list; `[]` clears it |
| `entities[].baseline` | object/number/null | inherits card Baseline | Per-row Baseline override; percentages go under `at`; `null` disables it |
| `entities[].formatting` | object | inherits card formatting, otherwise entity unit and locale-aware numbers | Per-row decimal precision and unit text override |
| `entities[].label_position` | string | inherits card layout | Legacy alias for `layout.label.position` |
| `entities[].label_width` | number | inherits card layout | Legacy alias for `layout.label.width` |
| `entities[].height` | number | inherits card height choice | Legacy alias for `layout.height`; omitted heights can adapt |
| `entities[].min` / `entities[].min_entity` | number / string | inherits card lower bound | Legacy aliases for `scale.min` |
| `entities[].max` / `entities[].max_entity` | number / string | inherits card upper bound | Legacy aliases for `scale.max` |
| `entities[].fill_style` / `entities[].color_mode` | string | inherits card fill style | Legacy fill-style aliases |
| `entities[].color` | string | inherits card color | Legacy alias for `bar.color` |
| `entities[].gradient_stops` | list | inherits card stops | Legacy alias for `bar.gradient_stops`; replaces the list |
| `entities[].segments` / `entities[].severity` | list | inherits card segments | Per-row segment definitions; replaces the list |
| `entities[].animated` | boolean | inherits card animation setting | Legacy alias for `bar.animated` |
| `entities[].target_entity`, `entities[].target_color`, `entities[].show_target_label`, `entities[].above_target_color` | mixed | inherits corresponding card Target settings | Legacy Target overrides |
| `entities[].show_peak`, `entities[].peak_color` | mixed | inherits corresponding card Peak settings | Legacy Peak overrides |
| `entities[].decimal`, `entities[].unit` | mixed | inherits card formatting, otherwise entity display | Legacy formatting overrides |

## Layout Options and Responsive Behavior

Choose the layout with `layout.label.position`. All layouts adapt to the available width and try to preserve the best achievable complete reading (value + unit), while keeping the numeric value ahead of competing name/icon content. They use different spaces, so their fallback behavior differs too. Very narrow cards can still lose units or useful numeric text.

| Position | Arrangement | Useful for |
|---|---|---|
| `left` | Icon/name, rail, then reading; reading can move above | Familiar labeled rows and multi-metric cards |
| `above` | Name/reading header above an icon/rail row | Giving the reading more width without overlaying the rail |
| `inside` | Name/reading pills over the rail, optional icon outside | Compact rows where some covered rail detail is acceptable |
| `off` | Optional icon, rail, then reading; no name | Metrics identified by surrounding dashboard context |
| `hero` | Name and large reading above a full-width rail; no icon | A prominent metric such as solar power or battery state |

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
    name: Power
    icon: mdi:lightning-bolt
```

### Left

Left is the familiar labeled-row layout: icon and name on the left, rail in the middle, and value + unit on the right. It is useful for several identified metrics in one card.

Those items compete for the same row width. The name can truncate, and the complete reading can move into its own row above the rail when space is constrained. The card can also remove the icon while retaining a useful name if that improves the result. Moving the reading above can preserve both name and icon, at the cost of a taller row.

At a stable width, placement converges to the same result regardless of resize history. The reading is not always inline. An unfit unit can disappear; at extreme widths even the numeric text can ellipsize or clip.

### Above

Above puts the name and right-aligned reading in a header above the rail. The icon belongs to the lower rail row. Choose it when you want more reading space while keeping text clear of the fill and markers.

As the header narrows, competing name text truncates or disappears before a unit is dropped when the complete reading can otherwise fit. Header alignment space can also be reclaimed. The lower icon can remain after the header name disappears because it does not consume the same reading space; it may still hide if the lower row needs more rail width.

The reading stays in the header. At extreme widths the unit can disappear and numeric text can ellipsize or clip. The header adds height even with a 24 px rail.

### Inside

Inside puts the name and reading in contrasting pills over the rail, with an icon outside the rail when space permits. It makes compact rows, but text can obscure some fill, Needle or marker detail.

The card reserves space for the reading and fits useful name text into the remainder. It can remove the icon to widen the rail, then truncate or remove the name as needed. If the complete reading still cannot fit, the unit is omitted; padding can compact to keep the number visible longer. At extreme widths the numeric reading itself can be hidden. A shorter name may remain when removing it would not make that number fit.

The reading stays inside the rail. Arbitrary text and marker labels are not guaranteed to avoid overlap, so shorter names/units or a wider card may give a clearer result.

### Off

Off shows no name. The row contains an optional icon, the rail, and a right-hand reading. It is useful when a section title or surrounding dashboard already identifies the metric.

These items share row width. The icon may disappear when reclaiming its space preserves value + unit, or otherwise keeps the numeric reading fitting while retaining a useful rail. If removing it would not improve the reading, it may remain. When a unit cannot fit, its unused extra space returns to the rail.

The reading stays beside the rail; it does not move above. Very narrow cards can eventually ellipsize or clip the numeric text.

### Hero

Hero emphasizes a large right-aligned reading beside a smaller name in a header above a full-width rail. It has no icon. Choose it for a prominent metric that should be readable at a glance.

The header name can truncate or disappear as space tightens. The card tries smaller supported typography for the complete value + unit group before dropping the unit. Typography can shrink substantially; only after complete-reading fitting is exhausted does number-only fitting take over. At extreme widths an unfit number can be hidden. The rail remains in its own region below the header.

#### Hero size

`layout.hero.size` selects `small`, `medium` (default) or `large` typography. For finer control, `layout.hero.value_size` sets a preferred maximum value size in pixels and takes precedence over the preset. Its accepted configuration range is 12–112; values outside that range are clamped. The rendered size still adapts to available space.

```yaml
layout:
  label:
    position: hero
  hero:
    size: large
    value_size: 72
```

Both settings apply only to Hero. The legacy `layout.label.hero_size` alias remains accepted; `layout.hero.size` takes precedence when both are supplied.

### Rail height

`layout.height` requests the rail height, with a normal/default height of **38 px** and an effective minimum of **24 px**. Explicit values below 24 are clamped to 24. An explicit value of 24 or more stays at that requested height as width changes.

When height is omitted, responsive density may reduce the rail to **28 or 24 px**. This depends on available width and content density, not the number of rows. Headers, padding and marker-label space can make the complete row taller than its rail.

```yaml
layout:
  height: 24
  label:
    position: above
```

The existing tests do not verify marker collision or clipping at a 24 px rail. Combined built-in and generic markers, both lanes, labels, and layouts are not covered at that height; tight arrangements may overlap.

### Label Width

When `layout.label.position: left` is used, `layout.label.width` sets a responsive width cap for the name area so bars can line up cleanly. The default cap is `100px`, but you can override it globally or per entity; when the card is narrow, the rendered label area may be smaller.

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
3. otherwise use the entity's Home Assistant icon, then a supported device-class or domain fallback if available

Responsive layouts may hide an otherwise configured icon when space is limited. Hero never displays one.

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

The Scale defines which values appear at the rail's left and right ends. Use fixed bounds for a known range, or entity-backed bounds when helpers or sensors define the current range.

Entity-backed sources are live. Home Assistant state changes recalculate the relevant row; changing a source entity does not require reloading or recreating the card. This applies to `scale.min.entity`, `scale.max.entity`, `baseline.at.entity`, `target.at.entity`, `markers[].at.entity`, and `markers[].label.entity`.

Source units are not converted. Use entities whose numeric values already match the row's Scale/unit; an independent marker-label source can display its own unit.

### Dynamic `scale.min` and `scale.max`

When **both bounds are dynamic**, they are resolved together:

| Live sources | Effective Scale |
|---|---|
| Both usable numbers, minimum below maximum | Use the live pair |
| Either source missing, unavailable or non-numeric | Use a complete, explicitly configured valid fixed fallback pair; otherwise `0..100` |
| Both numeric, but minimum equal to or above maximum | Keep the previous valid effective Scale if available; otherwise use the complete valid fixed fallback pair, then `0..100` |

The card never combines one surviving live bound with an unrelated fallback/default bound in this two-source case. Fixed fallbacks must include **both** bounds and have minimum below maximum. Supplying only one produces a configuration warning: that single fallback cannot supply the complete pair.

```yaml
type: custom:sensor-bar-card-plus
title: Dynamic Scale
scale:
  min:
    entity: sensor.dynamic_min
    fixed: 0
  max:
    entity: sensor.dynamic_max
    fixed: 100
bar:
  fill_style: gradient
entities:
  - entity: sensor.live_value
    name: Live value
```

Here, missing live bounds use `0..100` as an explicitly configured fallback. You can choose a different complete fallback range. The Scale is not expanded automatically to include the current value.

When **only one bound is dynamic**, a usable entity value takes precedence over that bound's configured fixed fallback. An unspecified minimum defaults to 0; an unspecified maximum defaults to 100. If the resulting pair is invalid, the card uses a valid fixed/default pair, otherwise `0..100`.

```yaml
scale:
  min:
    fixed: 0
  max:
    entity: sensor.current_limit
    fixed: 3000
```

Animated transitions smooth changes in the displayed geometry. They do not represent real intermediate sensor readings; the final positions use the current resolved Scale.

### Dynamic Target and fixed fallback

For a moving threshold, use `target.at.entity`, for example a helper controlling a power limit. Its usable numeric value takes precedence over `fixed`; the fixed value is used when the entity is unavailable or non-numeric.

```yaml
type: custom:sensor-bar-card-plus
title: Dynamic Target
target:
  at:
    entity: sensor.power_target
    fixed: 65
  label:
    show: true
entities:
  - entity: sensor.power_usage
    name: Power
```

The same fixed/entity source forms apply to `baseline.at`. A supplied source object replaces that source as a whole: include the fallback in the object if you need it.

### Target values and percentage positions

A number is a value on the active Scale:

```yaml
target:
  at: 50
```

A `%` suffix means a position across the visible Scale:

```yaml
target:
  at: 50%
```

For a Scale from −100 to 100, `at: 50` places Target at value 50 (three-quarters across the rail), while `at: 50%` places it at the midpoint, value 0. A percentage Target label displays the corresponding Scale value.

The structured fixed form `at: { fixed: 50 }` also means value 50. For Target and Baseline, `at: { percent: 50 }` is another percentage form. If a source object includes several supported sources, resolution tries a usable entity value, then a fixed fallback, then the percentage. Use `at: 50%` for a simple percentage position; **do not put `50%` inside `at.fixed`**. Generic markers use percentage strings and do not accept `at.percent`.

With `target.enabled` omitted, a configured and resolved source shows Target automatically. `enabled: false` disables it; `enabled: true` cannot create a position if no source resolves. A configured Target reserves one below-lane slot while enabled, including while its dynamic position is temporarily unavailable.

## Complete example

This card shows power in watts with a live upper limit and fixed fallback. Soft color bands indicate load ranges, Target follows a helper with a fallback, and Peak marks the highest observed value. The second row overrides only its name and displayed decimal precision.

```yaml
type: custom:sensor-bar-card-plus
title: Power Usage
layout:
  label:
    position: above
scale:
  min:
    fixed: 0
  max:
    entity: sensor.power_limit
    fixed: 3000
bar:
  fill_style: soft_bands
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
target:
  at:
    entity: sensor.power_target
    fixed: 2400
  label:
    show: true
    text: Limit
  when_exceeded:
    fill_color: '#dc2626'
peak:
  enabled: true
formatting:
  decimal: 0
entities:
  - entity: sensor.house_power
    name: House
  - entity: sensor.workshop_power
    name: Workshop
    formatting:
      decimal: 1
```

Both power sensors and the limit/Target sources should report compatible watt values. The displayed units come from the power sensors; no unit conversion is performed.

## Fill Styles Reference

| `fill_style` | Description |
|---|---|
| `solid` | One solid fill color; best for simple status or branded accents |
| `gradient` | Smooth color transition across the whole visible rail, using `bar.gradient_stops` |
| `bands` | Distinct Segment colors with hard boundaries |
| `soft_bands` | Mostly distinct bands, with short smooth blends where neighboring bands have enough room |
| `band_gradient` | The Segment color sequence becomes one continuous gradient |

`bands` is the default when no fill style, palette or color-only configuration selects another style, retaining the original card's band-based behavior. A color configured alone selects a solid bar unless an explicit fill style or palette is inherited. With an explicit style/palette, `bar.color` supplies its solid/fallback color. Set `bar.fill_style` explicitly if you want a particular style.

### Fill style details

The colors are laid out across the full Scale. Normal fill reveals the part from the minimum to the current value; Baseline changes that interval to the span between Baseline and value. The color positions stay tied to the Scale as the visible fill grows or shrinks. Needle shows the full colored rail instead. Legacy `color_mode` aliases are listed under [compatibility](#legacy-compatibility-and-migration).

#### `gradient`

`gradient` blends smoothly between colors positioned across the visible rail. Without custom stops it uses the built-in green/orange/red gradient.

`bar.gradient_stops[].pos` is always a percentage from 0 to 100 across that rail. A bare `pos: 50` and `pos: 50%` both mean the midpoint, regardless of Scale values. **This differs from Segment boundaries**, where a bare number is a Scale value. To place colors using Scale values, use Segments with `band_gradient` instead.

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

`bands` gives each configured range its own color, with an abrupt change at the next range.

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

`soft_bands` uses the same ranges as `bands`. Colors stay mostly distinct, with a short smooth blend between neighboring ranges when both are wide enough. Narrow ranges retain a hard boundary rather than being swallowed by the blend.

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

`band_gradient` turns the Segment color sequence into one smooth gradient rather than keeping separate bands. For a list of two or more ranges, the first color starts at the first range's `from`, the last color reaches the last range's `to`, and intermediate colors sit at their range midpoints. Segment boundaries can use Scale values or percentages, as explained below.

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

`bar.solid_fill: true` uses the color at the current value to color the whole visible fill.

Use it with a multicolor style when you want the fill to change color as the value changes, rather than showing several colors at once. Baseline-side colors and Target's exceeded color still apply over that sampled ordinary color.

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

With `bands`, this uses the current band color; with gradient styles it uses the blended color at the value's position. Leave `solid_fill` off to show the normal multicolor fill.

Needle variant:

```yaml
bar:
  fill_style: bands
  solid_fill: true
  needle: true
```

#### Segment boundaries

Each `bar.segments[]` boundary has its own coordinate meaning. A plain number is a value on the active scale; a string with a `%` suffix is a percentage of the visible scale. You can mix the two forms within one segment or across a list. Percentage positions map from the resolved scale minimum to its maximum.

```yaml
type: custom:sensor-bar-card-plus
title: Mixed Segment Coordinates
bar:
  fill_style: bands
  segments:
    - from: 0
      to: 1000
      color: '#22c55e'
    - from: 1000
      to: 75%
      color: '#facc15'
    - from: 75%
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

Here, the first segment ends at value `1000`; the next ends at 75% of the visible Scale (value `2250`). The coordinate choice is independent for each `from` and `to`. A range such as `from: 20%` to `to: 70` is also valid when the chosen Scale makes those endpoints ordered.

Practical range rules:

- Supply `from` and `color` for every Segment. An omitted `to` ends at the next valid Segment's configured `from`, or the visible Scale maximum for the last Segment.
- Use ordered, non-overlapping ranges within the visible Scale. Contiguous ranges can meet at a shared boundary.
- Gaps are not transparent holes: depending on the fill style, fallback color or a color blend can appear there.
- Overlaps have no supported winner/precedence rule. Avoid reversed ranges rather than relying on incidental output.
- Entity-backed boundaries are unsupported, including entity sources with fixed fallbacks. Use numbers or percentage strings.
- Malformed percentages cause the affected Segment to be ignored with a warning. Do not rely on out-of-range percentages or malformed ranges for special paint effects.

#### Backward compatibility: `bar.segment_space` (deprecated)

`bar.segment_space` remains accepted for configurations written against older versions, but it is deprecated and is not the recommended way to write new segments. It controls the interpretation of bare numeric boundaries only:

- `segment_space: percent` keeps bare numbers as percentages of the visible bar.
- `segment_space: scale` keeps bare numbers as values on the active scale.
- An explicit `%` suffix always means a percentage, with either legacy setting.

New YAML should omit `segment_space` and add `%` wherever a percentage boundary is intended. The Visual Editor no longer emits `segment_space`. Legacy `severity` values remain percentage-based.

For example, this older form retains percentage semantics for its bare numbers:

```yaml
bar:
  segment_space: percent
  segments:
    - from: 0
      to: 50
      color: '#22c55e'
    - from: 50
      to: 100
      color: '#ef4444'
```

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
- `bar.needle.color` sets the body and glow color; the card adds a light or dark edge chosen from that color to help distinguish it from the fill, without guaranteeing perfect contrast against every fill
- the bar switches to full-scale paint mode when the needle is shown
- the current value is represented by the needle position
- the needle works with `solid`, `gradient`, `bands`, `soft_bands`, `band_gradient`, and `solid_fill`
- the needle is suppressed while a Baseline successfully resolves
- an unresolved dynamic Baseline without a usable fixed fallback does not suppress the Needle

## Baseline

Use `baseline` when the fill should start from a neutral point instead of always starting at `min`.

The visible fill spans Baseline to the current value, extending left or right as needed. At equality there is no visible fill interval. Colors and markers still use the full Scale; Baseline does not restart a gradient or change what a Scale value means. This is useful for import/export, charge/discharge and other bidirectional values.

An active resolved Baseline also has a thin persistent line at its position, including when value equals Baseline and the fill has zero width. The line uses theme-derived coloring; its visibility depends on the surrounding colors. There is no separate indicator configuration.

With `baseline.enabled` omitted, a resolved configured source activates Baseline automatically. `false` disables it. If neither an entity nor its fallback provides a usable value, normal fill starts at the Scale minimum and the indicator disappears; a configured Needle can then appear.

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

Use `at: { entity: sensor.dynamic_baseline, fixed: 0 }` when you want a fixed fallback. A numeric `baseline.at` is a Scale value; a percentage string such as `50%` is a position across the Scale. Use percentage strings directly under `at`, not inside `fixed`. Legacy numeric shorthand remains accepted; see [compatibility](#legacy-compatibility-and-migration).

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

On the −100 to 100 Scale below, `50%` is the midpoint, value 0. A percentage Baseline follows that relative position if the Scale changes.

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

`baseline.below.color` colors the full Scale region below Baseline; `baseline.above.color` colors the region above it. If a side is not configured, the ordinary fill style remains on that side. Only the part between Baseline and the current value is revealed.

These colors stay tied to their side of the Scale. With `bar.solid_fill: true`, they still appear over the sampled ordinary fill color rather than being replaced by it.

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

Target uses the same Scale and does not move the fill origin. `target.when_exceeded.fill_color` appears over the revealed region above Target, on top of both ordinary fill and Baseline-side colors. It does not replace the entire bar. If a Baseline-to-value interval includes positions above Target, that portion receives the exceeded color, whichever direction the fill extends from Baseline.

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

### Dynamic baseline

An entity-backed Baseline moves live when its Home Assistant state changes. The fill origin and persistent indicator move with it; no reload is needed. A usable `entity` value takes precedence over `fixed`, which is the fallback. If neither resolves, the inactive behavior described above applies. `bar.animated` controls visual transitions as it does for other value changes; there is no separate animated-Baseline option.

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

## Target Marker

Target marks a fixed value, a live entity-backed threshold, or a percentage position on the Scale. See [Target values and percentage positions](#target-values-and-percentage-positions) for the difference between `at: 50` and `at: 50%`, and supported source/fallback forms.

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
- diamond by default, or `target.shape: triangle`; no other Target shapes are supported
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

`target.when_exceeded.fill_color` colors the revealed portion above Target. It appears over ordinary fill and any Baseline-side color there, including with `solid_fill`; it does not recolor the whole bar. See [Target and Baseline interaction](#target-and-baseline-interaction) for a combined example.

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

The Peak marker tracks the highest finite value observed for the current card session. Its shape is a fixed triangle; configure its direction, not its shape. `reset: never` is the default. See [Peak and Floor reset behavior](#peak-and-floor-reset-behavior) for relative duration and local calendar resets.

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

The Floor marker tracks the lowest finite value observed for the current card session. Its shape is a fixed triangle; configure its direction, not its shape. It shares the below marker lane with Target. See [Peak and Floor reset behavior](#peak-and-floor-reset-behavior) for reset options.

## Generic Reference Markers

Use `markers:` for configured reference points rather than tracked highs/lows. A marker's `at` controls its position; optional `label.entity` supplies independent numeric or textual label content. Neither source converts values between units.

### Position sources

`at` accepts a finite Scale value (`75` or `{ fixed: 75 }`), a percentage string such as `35%`, an entity ID, or `{ entity: sensor.limit, fixed: 75 }`. A usable entity value takes precedence over the fixed fallback. Generic percentages must be strings from `0%` through `100%`; `at.percent` is unsupported.

Percentage labels show the corresponding value on the effective Scale. Finite fixed/live values outside the Scale remain valid: the shape clamps to the nearest rail endpoint while its label retains the actual value. If no position resolves, the shape and label hide until recovery; an accepted marker still reserves its lane slot.

### Lanes, shapes and visibility

`lane: above` selects the lane immediately above the rail; `lane: below` selects the lane immediately below it. Inward directional shapes point into the rail; outward shapes point away. Labels occupy space outside the rail. Circle and diamond look the same in either direction.

Generic markers support `circle`, `diamond`, `triangle`, `chevron`, `arrow` and `pin`. Defaults are a visible circle in the below lane, inward direction, color `#888888`, and a hidden label. Target supports diamond/triangle only; Peak and Floor are triangles with configurable direction.

`show_marker: false` hides only the glyph. A configured label can remain at the same anchor, and lane capacity/label space remain reserved. Use this for an information label without a visible shape.

Each lane holds **four markers total**, including participating built-ins: Peak uses one above slot; Floor and configured/enabled Target each use one below slot. Without built-ins, up to four generic markers fit in each lane. There is no separate global generic-marker limit.

Generic markers are considered in list order. A full lane skips excess markers without moving them to the other lane; later markers in the other lane are still considered. Skipped entries remain editable and produce a capacity warning. Malformed entries do not consume capacity. Accepted markers keep their slot while a source is temporarily unresolved or their glyph is hidden.

At card scope, the list is inherited by each row. `entities[].markers` replaces that list rather than merging; `markers: []` clears it for that row.

### Example

This combines built-in and generic references in both lanes:

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

### Labels

`label.show: true` enables a label; `label.entity` alone does not. The label combines optional `text`, a value (`show_value`, default true), and a unit (`show_unit`, default true). If no component has displayable content, no label is shown.

Without a valid `label.entity`, the label uses the resolved marker-position value and row unit. With a valid independent entity, it uses that entity's state and `unit_of_measurement`; the entity never changes marker position. Numeric content uses `label.precision`, otherwise the row's `formatting.decimal`. Ordinary text states such as `Charging` are displayed as text.

If the label entity is missing, empty, `unknown` or `unavailable`, its value and unit are omitted; configured static text may remain. An invalid label entity is ignored with a warning, falling back to the normal position value and row unit. Source changes update live.

Generic, Peak and Floor labels also accept `label.decimal`; Target retains `target.label.decimal`. Prefer `precision` in new configurations. Use `show_unit: false` to omit units; the former generic label `unit` option is unsupported.

Nearby labels may overlap and are not automatically stacked. Where pointer hover is available, hovering a marker or its label raises the associated label above other labels. Shorter labels or more widely spaced reference points can improve readability.

### Independent information labels

A fixed endpoint can anchor a label that follows a separate numeric or textual sensor:

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

The first label could display `Daily energy 12.4 kWh`; the second could display `Charging`. Both still count toward their lane capacity and retain normal label placement and endpoint clamping.

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

By default the card displays the entity's unit of measurement. Use `formatting.unit` to override the displayed unit text when you want a shorter or more readable label. This does not convert the numeric value: choose a sensor whose value is already expressed in the unit you want to display. For example, setting the unit to `kW` on a sensor reporting `1200` watts displays `1200 kW`, not `1.2 kW`. The example below only changes unit text; its source entities are assumed to already report values in their respective displayed units.

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

Non-numeric states, including `unknown`, `unavailable` and custom text, are displayed as text without a leftover numeric unit.

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

## Interaction and error behavior

Clicking a row opens Home Assistant's native more-info dialog for that entity. No extra configuration is required.

If the row's entity cannot be found, the card shows an error in that row; other rows continue to render. An existing entity whose state is `unknown` or `unavailable` is displayed as text, as described under [Formatting](#formatting).

## Peak and Floor reset behavior

Peak and Floor track finite samples in memory for each card row. They are visual extrema, not durable historical statistics. The default reset policy is `never`. Duration windows accept `1m`–`59m` and `1h`–`23h` and begin at the first finite sample in the window; they are elapsed-time windows, not clock-aligned. A reset is applied lazily when the next finite sample arrives at or after expiry.

Calendar reset policies use local time boundaries: `quarterly` means quarter-hour boundaries (`:00`, `:15`, `:30`, and `:45`), followed by `hourly`, `daily`, `weekly` (Monday start), `monthly`, and `yearly`. Invalid reset values fall back to `never` with a configuration warning. Changing an effective reset policy clears that tracker's stored extremum; disabling Peak or Floor clears that tracker independently. Unknown or unavailable primary values do not erase the previous finite extremum.

## Invalid and unsupported configuration

Invalid configuration is reported through non-fatal diagnostics where applicable. A generic marker with an unusable source, lane, or structure is skipped. Recoverable invalid fields, such as shape, direction, visibility, or label options, fall back to supported defaults or inherited values, with a warning where applicable. Valid excess markers remain in configuration but do not render and produce a capacity warning. Invalid reset syntax falls back to `never`. Generic percentage positions use strings such as `35%`; an `at.percent` object field is unsupported. Entity-backed segment boundaries are unsupported and ignored with a configuration warning. See the feature-specific sections for details.

## Legacy Compatibility and Migration

The listed legacy aliases and compatibility forms remain accepted. Unlisted or accidental parser behavior is not part of the public configuration contract.

| Legacy | Structured equivalent |
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
| `target` (number) / `target_entity` | `target.at.fixed` / `target.at.entity` |
| `target_color` | `target.color` |
| `show_target_label` | `target.label.show` |
| `above_target_color` | `target.when_exceeded.fill_color` |
| `show_peak` / `peak_color` | `peak.enabled` / `peak.color` |
| `decimal` / `unit` | `formatting.decimal` / `formatting.unit` |
| `severity` | `bar.segments` using `%` values when migrating legacy bands |
| `fill_style` | `bar.fill_style` |
| `color` | `bar.color` |
| `gradient_stops` | `bar.gradient_stops` |
| `segments` | `bar.segments` |
| `animated` | `bar.animated` |
| `baseline` (number) | `baseline.at.fixed` |
| `layout.label.hero_size` | `layout.hero.size` |
| `bar.segment_space: percent` / `scale` | Deprecated compatibility input: bare segment numbers remain percentages / active-scale values respectively; new YAML should use `%` suffixes for percentage boundaries |

### Migrating From The Original Card

Install this card side by side, then update:

- resource URL from the original file to `/local/sensor-bar-card-plus.js`
- card type from `custom:sensor-bar-card` to `custom:sensor-bar-card-plus`

### Migrating From Legacy Flat YAML

You do not need to migrate existing dashboards immediately. For new configurations, use the grouped options documented above.

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

When migrating legacy `severity`, remember that legacy band numbers are percentages of the active scale. Use explicit `%` boundaries in structured `bar.segments` to retain that placement. Plain numeric segment boundaries now mean values on the active scale.

`bar.fill_style` is the preferred structured syntax for new dashboards. The recognized `bar.color_mode` compatibility alias remains accepted and renders the corresponding fill style.

For a visual comparison, see the [Heritage Dashboard](../examples/dashboards/sensor-bar-card-plus-heritage.yaml).

### Automatic Dashboard Migration

Existing dashboards do not need to be migrated. The recognized legacy aliases listed above remain available. This utility is available if you want to adopt the structured configuration model for an existing Lovelace dashboard.

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
