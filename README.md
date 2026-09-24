
![Sensor Bar Card Plus](images/branding/logo-300.png)

# Sensor Bar Card Plus

[![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/cdelaet/sensor-bar-card-plus)](https://github.com/cdelaet/sensor-bar-card-plus/releases)
[![Validate](https://github.com/cdelaet/sensor-bar-card-plus/actions/workflows/validate.yml/badge.svg)](https://github.com/cdelaet/sensor-bar-card-plus/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/cdelaet/sensor-bar-card-plus/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/cdelaet/sensor-bar-card-plus?style=social)](https://github.com/cdelaet/sensor-bar-card-plus)

Sensor Bar Card Plus is a next-generation visualization card for Home Assistant, designed for dashboards where the visual context is just as dynamic as the data itself.

It supports classic reveal-fill bars, baseline-driven bidirectional flows, and full-scale needle gauges. Instead of relying on hardcoded scales and thresholds, the card can derive ranges, targets, baselines, and reference values directly from Home Assistant entities.

Ideal for energy monitoring, batteries, power flows, temperatures, quotas, environmental sensors, gauges, and other numeric data, Sensor Bar Card Plus combines dynamic scales, semantic fills, segment-based coloring, target and peak markers, needle indicators, and responsive layouts into a single highly configurable card.

Now you have no excuse not to build that pretty dashboard. Go forth and look cool. -Chris

![Sensor Bar Card Plus showcase](images/hero-400.gif)


[![Buy me a coffee on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/chrisdelaet)

## Highlights

- 📍 Needle gauge mode for full-scale, gauge-style bars with a moving value indicator
- ⭐ Hero layout with configurable `small`, `medium`, and `large` typography for glanceable dashboards
- 🌈 Soft bands for segment-aware fills with short blended transitions
- 🎯 Semantic threshold fills for visually separating regions beyond dynamic targets and references (such as an above-target color)
- 📈 Dynamic scales, targets, and references driven by Home Assistant entities
- 🧩 Structured configuration model with full backwards compatibility
- ⚖️ Baseline fill origin for bidirectional flows such as charge/discharge and import/export
- 🎨 Flexible segment-based coloring with scale-space and percent-space thresholds
- ✏️ Target and peak markers with optional target value labels
- 📍 Flexible label placement for compact and information-dense dashboards
- 🏷️ Responsive label and marker layout for tighter dashboard spaces
- 🧠 Deterministic responsive layout engine for narrow dashboards and dense cards
- 🔧 Per-entity overrides for nearly every card option
- 🎞️ Shared animated reveal pipeline for coherent gradients, segments, and semantic fills
- 🖱️ Native Home Assistant more-info dialog on click

## Installation

### HACS (Recommended)

Sensor Bar Card Plus is available directly through HACS.

1. Open **HACS** in Home Assistant.
2. Search for **Sensor Bar Card Plus**.
3. Select **Download**.
4. Refresh your browser.

![Installing Sensor Bar Card Plus from HACS](images/hacs-installation.png)

### Manual

If you prefer not to use HACS, manual installation is also supported.

1. Download `sensor-bar-card-plus.js` from the latest release.
2. Copy it to `/config/www/`.
3. Add the following resource under **Settings → Dashboards → Resources**:

```text
URL: /local/sensor-bar-card-plus.js
Type: JavaScript Module
```

4. Refresh your browser.


## Quick Start

```yaml
type: custom:sensor-bar-card-plus
title: Caravan Power
entities:
- entity: sensor.caravan_power
  name: Caravan
  icon: mdi:caravan
scale:
  max:
    fixed: 3000
```

![Basic example](images/bar-basic.png)

```yaml
type: custom:sensor-bar-card-plus
title: Caravan Power
entities:
- entity: sensor.caravan_power
  name: Caravan
  icon: mdi:caravan
bar:
  needle: true
  fill_style: gradient
scale:
  max:
    fixed: 3000
```

![Basic needle example](images/needle-basic.png)


You can also add the card through the Home Assistant card picker and configure it visually with the built-in Visual Editor.

> Legacy flat YAML remains supported. See Legacy Compatibility near the end of this README if you want to migrate older dashboards.

## Visual Editor

Sensor Bar Card Plus now includes an advanced Visual Editor for Home Assistant Lovelace. The editor is designed to generate normal SBCP YAML while keeping advanced manual configuration fully viable.

What the Visual Editor supports:

- structured YAML output for edited fields
- card-level defaults with per-entity overrides
- dynamic `scale`, `target`, and `baseline` values driven by Home Assistant entities
- Hero label layout, Hero size presets and an optional custom Hero value size directly from the editor
- controls for target, baseline, peak, and needle behavior
- segment and gradient stop editing with live previews
- entity management actions for move, duplicate, and remove
- inheritance behavior where entity settings follow card settings until you change them
- visible default bands and default gradients that stay out of emitted YAML until customized

![Visual editor](images/visual-editor.png)

The editor can configure the same structured layout options used in YAML, including Hero label mode and the Hero size presets. That means a new dashboard can start from the Home Assistant card picker, switch to Hero layout, choose a Hero size (and optionally a custom Hero value size), and still produce clean YAML behind the scenes.

Example structured config:

```yaml
type: custom:sensor-bar-card-plus
title: Power
scale:
  min:
    fixed: 0
  max:
    fixed: 5000
target:
  at:
    fixed: 2500
peak:
  enabled: true
bar:
  fill_style: band_gradient
entities:
  - entity: sensor.grid_power
    name: Grid
  - entity: sensor.solar_power
    name: Solar
```

The Visual Editor is feature-rich and extensively tested, but this is its first major release. If you find editor edge cases, please open a GitHub issue with reproduction steps.


## Rendering Modes

Sensor Bar Card Plus currently supports two primary rendering models:

- reveal fill mode
- needle mode

Both modes share the same semantic fill pipeline, fill styles, dynamic scales, markers, and responsive layout system.

### Reveal Fill Mode

Reveal fill mode is the classic bar behavior. The visible fill grows and shrinks with the current value.

This mode works especially well for:

- progress-style visualizations
- quotas and limits
- batteries
- charge/discharge flows
- import/export power
- bidirectional energy movement

![Reveal fill showcase](images/bar-dense-telemetry.png)

```yaml
type: custom:sensor-bar-card-plus
title: Reveal Fill
bar:
  fill_style: gradient
scale:
  min:
    fixed: 0
  max:
    fixed: 100
entities:
  - entity: sensor.power_usage
    name: Sensor
```

### Reveal Fill With Baseline

Baseline mode extends reveal fill mode by changing the fill origin from `scale.min` to a neutral reference point. The scale itself does not change.

This is useful for visualizing:

- batteries charging/discharging
- import/export flows
- heating/cooling balance
- bidirectional sensors
- centered operating ranges

![Reveal fill with baseline showcase](images/baseline-dense-telemetry.png)


```yaml
type: custom:sensor-bar-card-plus
title: Baseline Flow
bar:
  fill_style: band_gradient
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

### Needle Mode

Needle mode keeps the full theoretical scale visible at all times while a moving needle indicates the current value.

This mode works especially well for:

- gauges
- dashboards with semantic full-scale context
- dynamic scales
- monitoring dashboards
- situations where the full scale meaning matters continuously

![Needle showcase](images/needle-dense-telemetry.png)


```yaml
type: custom:sensor-bar-card-plus
title: Needle Gauge
bar:
  fill_style: soft_bands
  needle: true
scale:
  min:
    fixed: 0
  max:
    fixed: 100
entities:
  - entity: sensor.power_usage
    name: Sensor
```

Expanded needle configuration:

```yaml
bar:
  needle:
    show: true
    color: '#ffffff'
```

![Needle yellow with black needle](images/needle-yellow-fill-black-needle.png)

Notes:

- `bar.needle: true` is the preferred simple syntax for new dashboards
- needle mode and baseline mode are mutually exclusive because baseline visualizes directional fill geometry while needle mode visualizes absolute position on a persistent full-scale track
- target and peak markers render on top of the needle
- inside labels and values render on top of markers and needle
- fill styles, semantic overlays, markers, targets, peaks, gradients, and responsive behavior work consistently across both rendering models




## Fill Styles

Current `color_mode` compatibility names map directly to these fill styles.

If no fill style is specified, Sensor Bar Card Plus defaults to `bands`. This preserves visual compatibility with the original Sensor Bar Card, ensuring that existing dashboards continue to render as expected. New dashboards are encouraged to specify `bar.fill_style` explicitly, but doing so is optional.

Sensor Bar Card Plus separates semantic fill composition from animated reveal geometry. That is what allows gradients, bands, above-target colors, markers, and animations to stay visually coherent while the bar updates.

### `gradient`

`gradient` paints a true full-bar gradient across the configured scale.

![Gradient fill style](images/example-gradient-small.gif)

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

![Gradient fill with needle](images/needle-gradient.png)

```yaml
bar:
  fill_style: gradient
  needle: true
```

### `bands`

Compatibility name: `severity`

`bands` paints hard bands from `bar.segments`.

![Bands fill style](images/example-bands-small.gif)

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

![Bands fill with needle](images/needle-bands.png)


```yaml
bar:
  fill_style: bands
  needle: true
```

### `soft_bands`

`soft_bands` uses the same `bar.segments` configuration as `bands`, but blends each eligible boundary over a short transition zone instead of switching colors abruptly.

It sits between the other segment-based styles:

- `bands`: hard transitions
- `soft_bands`: short blended transitions
- `band_gradient`: continuous gradient derived from segment colors

![Soft Bands Fill](images/example-soft-bands-rainbow.png)

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

![Soft Bands fill with needle](images/needle-soft-bands-rainbow.png)

```yaml
bar:
  fill_style: soft_bands
  needle: true
```

### `band_gradient` 

Compatibility name: `severity_gradient` 

`band_gradient` uses the same segment definitions, but renders a continuous gradient derived from those colors instead of painting hard bands.

Anchor model:

- first band color is exact at the first band `from`
- last band color is exact at the last band `to`
- intermediate band colors are exact at the midpoint of their band

This makes the mode feel intuitive while still respecting the configured severity ranges.

![Band Gradient Fill](images/example-band-gradient-small.gif)

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

![Band Gradient Fill with needle](images/needle-band-gradient.png)


```yaml
bar:
  fill_style: band_gradient
  needle: true
```

### `solid_fill`

`bar.solid_fill: true` samples the theoretical fill color at the current value, then renders the visible fill as one solid color.

This is most useful with `bands`, `band_gradient`, and `gradient` when you want the active color logic without rendering the full multicolor fill across the revealed area.

![Soft Bands Solid Fill](images/example-soft-bands-and-solid-rainbow.png)


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

The screenshots dashboard includes `Bands Rainbow + solid_fill` and `Band Gradient Rainbow + solid_fill` cards for direct visual comparisons.

Needle variant:

![Soft Bands Solid Fill with needle](images/needle-bands-solid.png)


```yaml
bar:
  fill_style: bands
  solid_fill: true
  needle: true
```

### Segment Space: `percent` vs `scale`

`bar.segment_space` controls how `bar.segments` positions are interpreted.
Use `percent` when segment boundaries should describe fixed positions across the visible bar. Use `scale` when segment boundaries should describe real values on the configured `scale.min` to `scale.max` range.

#### Percent-space segments

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

#### Scale-space segments

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

#### When to use which

|Mode|Best for|Segment values mean|
|---|---|---|
|`percent`|progress bars, quotas, generic utilization|positions from 0% to 100% across the bar|
|`scale`|temperatures, power thresholds, CO₂ ranges, real sensor limits|actual values on the configured scale|

For legacy severity migrations, `percent` is usually the correct choice because older severity bands were interpreted as percentages of the visible bar.

### `solid`

Compatibility name: `single` 

`solid` uses one fixed fill color regardless of value.

![Solid fill](images/example-solid.png)

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

## Label Positions

Supported values:

- `left`
- `above`
- `inside`
- `off`
- `hero`

![Label modes](images/example-label-positions.png)

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

The screenshot uses this same single sensor in five separate cards, changing only:

- `layout.label.position: left`
- `layout.label.position: above`
- `layout.label.position: inside`
- `layout.label.position: off`
- `layout.label.position: hero`

## Hero Label Position

`layout.label.position: hero` gives each row a premium two-lane header: a small label above the bar, a large right-aligned value and unit, and the full-width bar underneath.

Hero mode is designed for values that should be readable at a glance, such as solar production, grid import/export, battery state, temperature, or any dashboard metric that should feel like a primary gauge. It works especially well as a glanceable core gauge replacement when you want richer SBCP features such as dynamic scales, baselines, targets, semantic fills, per-entity overrides, and multi-entity cards.

This mode is intentionally opinionated:

- the value gets priority
- the label may hide before the value becomes cramped
- the icon stays on the left when space allows
- per-entity `layout.label.position: hero` overrides work the same way as the other label modes

### Hero Size

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

### Custom Hero Value Size

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


![Hero size comparison](images/hero-label-sizes.png)

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

### Hero Responsive Behavior

Hero label mode uses a dedicated responsive layout strategy that prioritizes the value over supporting elements. When horizontal space becomes limited, Hero rows adapt in the following order:

1. Keep the value at its preferred size.
2. Truncate the label if necessary.
3. Hide the label when truncation is no longer sufficient.
4. Hide the unit if additional space is required.
5. Reduce the value size only when the configured Hero size no longer fits.
6. Hide the value only as an absolute last resort.

This prioritization keeps the most important information visible while preserving a stable, premium Hero appearance across a wide range of dashboard widths.

![Hero responsive behavior](images/hero-label-responsive.png)

The responsive behavior described above is specific to Hero label mode. The other label positions (`left`, `above`, `inside`, and `off`) continue to use the card's standard responsive layout.

| Behavior | Hero label mode | Standard label modes |
|---|---|---|
| Main priority | Keep the large value readable | Keep the bar readable and aligned |
| Label behavior | Truncate, then hide when the value needs space | Adapt with the row layout and may step aside in tight spaces |
| Unit behavior | Hide only when the value still needs more space | Stays visible as long as practical and is only hidden as a late fallback |
| Icon behavior | Hides in the narrowest Hero layouts | May hide in tight layouts to preserve useful content |
| Best use | Glanceable gauge-style dashboard values | Dense multi-row dashboards and detailed telemetry |

![Above/left/inside responsive behavior](images/above-left-inside-responsive.png)

Explicit `layout.height` is still respected exactly. The default row height may shrink automatically in very dense layouts.

The screenshots dashboard includes dedicated `Responsive Behavior` and `Value + Unit` cards for capture-ready examples.

## Label Width

When `layout.label.position: left` is used, all names share a fixed label column so the bars line up cleanly. The default width is `100px`, but you can override it globally or per entity.

![Label width](images/example-label-width.png)

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

## Icons

Each row resolves its icon in this order:

1. `icon: false` hides the icon and removes its reserved space
2. `icon: mdi:something` uses that explicit icon
3. otherwise the card uses the entity's own Home Assistant icon

![Icon control](images/example-icons.png)

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

## Target, Peak, And Dynamic References

The card supports:

- fixed `target.at.fixed`
- dynamic `target.at.entity`
- percentage-based `target.at: 50%`
- optional `target.label.show`
- optional `target.when_exceeded.fill_color`
- optional `peak.enabled`
- optional `floor.enabled`
- optional Peak and Floor labels
- reset policies for Peak and Floor

The target and floor markers sit in the bottom marker lane. The peak marker sits in the top lane. Target and Floor use independent positions in the shared bottom lane; Stage 3 does not attempt collision avoidance when their markers or labels overlap.

![Dynamic target and above-target color](images/example-above-target-color-small.gif)

### Above-target color 

Use `target.when_exceeded.fill_color` when you want the filled section beyond the target to stand out as a different semantic state. Sensor Bar Card Plus composes that semantic fill with the normal bar paint, then clips the result with the shared animated reveal front so the marker, target label, and color split stay visually coherent while the target changes.

```yaml
type: custom:sensor-bar-card-plus
title: Above Target Color
bar:
  fill_style: gradient
target:
  at:
    entity: sensor.power_target
  color: '#9ca3af'
  label:
    show: true
  when_exceeded:
    fill_color: '#dc2626'
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

Needle variant:

![Above-target color with needle at 100%](images/needle-above-target-color-100.png)


```yaml
bar:
  fill_style: gradient
  needle: true
target:
  when_exceeded:
    fill_color: '#dc2626'
```

### Target value label

Set `target.label.show: true` to render a target label below the marker. The label is clamped so it stays inside the track area near the edges and follows dynamic target changes smoothly. By default its numeric component inherits `formatting.decimal`; use `target.label.precision` to override precision. Existing `target.label.decimal` configurations remain supported. Target labels also support the shared text/value/unit composition options documented below.

![Target value label](images/target-value-label.png)

```yaml
formatting:
  decimal: 2
target:
  at:
    fixed: 55
  label:
    show: true
    decimal: 1
```

With this configuration, a current value of `42` displays as `42.00` while the target label displays as `55.0`.

### Peak marker example

![Peak marker](images/example-peak.png)

```yaml
type: custom:sensor-bar-card-plus
title: Peak Marker
layout:
  label:
    position: left
peak:
  enabled: true
scale:
  min:
    fixed: 0
  max:
    fixed: 3000
entities:
  - entity: sensor.caravan_power
    name: Caravan
    icon: mdi:caravan
```

### Floor marker and extrema labels

Floor tracks the lowest finite value observed for the current card session. Peak and Floor labels are hidden by default and use the row's effective unit and decimal precision unless explicitly overridden.

```yaml
formatting:
  decimal: 1
peak:
  enabled: true
  color: '#fde68a'
  label:
    show: true
floor:
  enabled: true
  color: '#888888'
  label:
    show: true
    decimal: 0
entities:
  - entity: sensor.caravan_power
```

### Peak and Floor reset policies

Peak and Floor state is in-memory visualization state. It is lost when the card or browser is recreated and is not a durable historical statistic.

Calendar resets use local clock boundaries:

```yaml
peak:
  enabled: true
  reset: quarterly   # :00, :15, :30, and :45
floor:
  enabled: true
  reset: daily       # local midnight
```

Supported calendar values are `quarterly`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`, and `never`.

Duration resets are relative to the first finite sample in the current tracker window. They are not clock-aligned:

```yaml
peak:
  enabled: true
  reset: 26m
```

If the tracker starts at 10:07, the next window starts when a finite sample arrives at or after 10:33. `reset: 15m` therefore differs from `reset: quarterly`: the former is elapsed time from initialization, while the latter follows local `:00`, `:15`, `:30`, and `:45` boundaries.

Valid duration values are `1m` through `59m` and `1h` through `23h`. Invalid values fall back safely to `never` with a configuration warning.

### Target marker example

![Target marker](images/example-target-colors-above.png)

```yaml
type: custom:sensor-bar-card-plus
title: Target Marker
layout:
  label:
    position: left
scale:
  min:
    fixed: 0
  max:
    fixed: 3000
target:
  at:
    fixed: 2000
  color: '#9ca3af'
entities:
  - entity: sensor.caravan_power
    name: Caravan
    icon: mdi:caravan
```

### Marker coexistence

![Peak and target markers](images/example-peak-and-target.png)

Peak and target markers can occupy the same position without becoming ambiguous because they live on opposite bar edges. That makes them suitable for shared-threshold visualizations and future multi-reference extensions.

## Baseline Fill Origin 

Use `baseline` when the fill should start from a neutral point instead of always starting at `min`.

- `baseline` defines the fill origin on the configured `min` to `max` scale
- gradients and severity modes still represent the full global scale
- baseline changes fill geometry, not the meaning of the scale
- `baseline.above` and `baseline.below` are optional semantic overlays when you want each side to read differently
- `baseline.at` can use either an absolute scale value or a percentage string such as `50%`

This is useful for batteries, charge and discharge, import and export, neutral operating points, and any bidirectional flow where movement on either side of a reference value should read clearly at a glance.

![Baseline fill origin](images/example-baseline-fill-origin.png)

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

![Baseline off-center](images/example-baseline-off-center.png)

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

![Baseline percentage](images/example-baseline-off-center-percent.png)


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

![Baseline colors and overrides](images/example-baseline-colors-and-overrides.png)

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

Targets stay on the same global scale, so threshold markers, `target.when_exceeded.fill_color`, and baseline geometry remain easy to read together.

![Baseline target interaction](images/example-baseline-above-target-colors.png)

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

![Animated semantic baseline](images/baseline-animated-semantic.gif)

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

![Compact baseline showcase](images/example-baseline-compact.png)

## Dynamic Min / Max / Target

You can source `scale.min`, `scale.max`, and `target.at` from other entities instead of hardcoding them in the card config.

This is especially useful when the scale and threshold are driven by other helpers, automations, or template sensors.

Why dynamic sources matter: the card can follow real Home Assistant entities for scale and target context instead of baking those values into YAML. That makes the visualization adapt naturally to batteries, grid limits, quotas, thresholds, changing operating modes, and dashboards where the meaning of "full", "safe", or "on target" changes over time.

![Dynamic min and max entities](images/example-dynamic-min-max.png)

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

![Dynamic target entity](images/example-dynamic-target.png)

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

## Formatting, Text States, And Units

The card handles four related display concerns:

- decimal precision
- unit override
- tight time units like `43s` or `4h`
- textual states such as `unknown`, `unavailable`, and custom text pass-through

### Decimal Precision

Use `formatting.decimal` to display exactly how many fractional digits are shown per row, including trailing zeroes. Values are rounded to that precision; omitting the setting keeps the raw locale-aware numeric display.

For example, `decimal: 2` displays `42` as `42.00` and `100.8` as `100.80`.

![Decimal places](images/example-decimals.png)

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

![Time formatting](images/example-time-units.png)

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

![Text states](images/example-text-values.png)

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

## Clicking A Bar

Clicking any row opens Home Assistant's native more-info dialog for that entity, including history and attributes.

No extra configuration is required.

## Error Handling

If an entity is missing, unavailable to the card, or misconfigured, the card renders an inline row-level error instead of crashing the whole card.

Other rows continue to render normally.

## Bar Height Variations

Use `layout.height` globally or per entity to make rows more compact or more prominent.

![Bar height variations](images/example-heights.png)

```yaml
type: custom:sensor-bar-card-plus
title: Bar Heights
layout:
  label:
    position: left
  height: 38
scale:
  max:
    fixed: 3000
entities:
  - entity: sensor.power_usage
    name: 24px Compact
    icon: mdi:minus
    layout:
      height: 24
  - entity: sensor.power_usage
    name: Default (38px)
    icon: mdi:minus
  - entity: sensor.power_usage
    name: 52px Tall
    icon: mdi:minus
    layout:
      height: 52
  - entity: sensor.power_usage
    name: 70px Taller
    icon: mdi:minus
    layout:
      height: 70
```

## Per-Entity Overrides

Every card-level option can be overridden per entity.

![Per-entity overrides](images/example-per-entity-overrides.png)

```yaml
type: custom:sensor-bar-card-plus
title: Mixed Overrides
layout:
  label:
    position: left
bar:
  fill_style: gradient
scale:
  min:
    fixed: 0
  max:
    fixed: 3000
entities:
  - entity: sensor.caravan_power
    name: Caravan
    icon: mdi:caravan

  - entity: sensor.fridge_power
    name: Fridge
    icon: mdi:fridge
    bar:
      fill_style: solid
      color: '#2563eb'
    scale:
      max:
        fixed: 2000
    peak:
      enabled: true

  - entity: sensor.lighting_power
    name: Lighting
    icon: mdi:lightbulb
    layout:
      label:
        position: above
    scale:
      max:
        fixed: 1000
    bar:
      fill_style: bands
      segments:
        - from: 0%
          to: 40%
          color: '#22c55e'
        - from: 40%
          to: 75%
          color: '#f59e0b'
        - from: 75%
          to: 100%
          color: '#ef4444'
```

# Configuration Reference

This appendix is the quick-reference guide for the currently supported Sensor Bar Card Plus configuration model. Structured syntax is preferred for new dashboards. Legacy flat syntax remains supported for backward compatibility.

## Configuration Tree

The modern configuration model is structured by feature area. Card-level settings define defaults, and entity-level settings can override most of them per row.

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
├── label
│   ├── show
│   └── decimal
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
├── reset
└── label
    ├── show
    └── decimal

floor
├── enabled
├── color
├── reset
└── label
    ├── show
    └── decimal

formatting
├── decimal
└── unit
```

## Modern Configuration Overview

| Path | Default | Values | Description |
|---|---:|---|---|
| `layout.height` | `38` | number | Row/bar height. Explicit values are respected; very small values normalize to a usable minimum. |
| `layout.label.position` | `left` | `left`, `above`, `inside`, `off`, `hero` | Label placement mode. |
| `layout.hero.size` | `medium` | `small`, `medium`, `large` | Built-in Hero typography preset. Applies only when `layout.label.position: hero`. |
| `layout.hero.value_size` | `null` | `12–112` | Optional maximum Hero value size in pixels. Overrides `layout.hero.size` while preserving automatic responsive fitting. Applies only when `layout.label.position: hero`. |
| `layout.label.width` | `100` | number | Shared label column width for `left` label mode. |
| `scale.min.fixed` | `0` | number | Fixed lower bound of the active scale. |
| `scale.min.entity` | `null` | entity id | Dynamic lower bound entity. |
| `scale.max.fixed` | `100` | number | Fixed upper bound of the active scale. |
| `scale.max.entity` | `null` | entity id | Dynamic upper bound entity. |
| `bar.fill_style` | `bands` | `solid`, `gradient`, `bands`, `soft_bands`, `band_gradient` | Fill rendering style. |
| `bar.segment_space` | `percent` | `percent`, `scale` | Determines whether `bar.segments` are interpreted as percentages of the bar or as actual values on the configured scale. |
| `bar.color` | `#4a9eff` | CSS color | Solid or fallback fill color. |
| `bar.solid_fill` | `false` | boolean | Samples the active color and renders the revealed fill as one solid color. |
| `bar.animated` | `true` | boolean | Enables or disables value-change animations for the revealed fill and related visual elements. |
| `bar.needle` | `false` | boolean or object | Enables needle mode using `true`, or accepts the expanded `{ show, color }` configuration. |
| `bar.needle.show` | `false` | boolean | Explicitly enables or disables needle mode in expanded configuration. |
| `bar.needle.color` | `#ffffff` | CSS color | Sets the needle body and glow color. |
| `bar.segments` | default bands | list | Segment definitions for `bands`, `soft_bands`, and `band_gradient`. Each item supports `from`, `to`, and `color`. |
| `bar.gradient_stops` | `null` | list | Gradient stop definitions for `gradient`. Each item supports `pos` and `color`. |
| `target.enabled` | auto | `true`, `false`, omitted | Controls target marker behavior. Omitted means automatic based on configured target source. |
| `target.at.fixed` | `null` | number | Fixed target value. |
| `target.at.entity` | `null` | entity id | Dynamic target entity. |
| `target.shape` | `diamond` | `diamond`, `triangle` | Target marker shape. |
| `target.color` | `#888888` | CSS color | Target marker color. |
| `target.label.show` | `false` | boolean | Shows a numeric target value label. |
| `target.label.text` | absent | string | Optional plain text shown before the value and unit. |
| `target.label.show_value` | `true` | boolean | Includes or omits the formatted Target value independently of text and unit. |
| `target.label.show_unit` | `true` | boolean | Includes or omits the effective row unit independently of text and value. |
| `target.label.precision` | inherited | number | Overrides the numeric component's precision; omitted values inherit `formatting.decimal`. The established `target.label.decimal` spelling remains accepted for existing configurations. |
| `target.when_exceeded.fill_color` | `null` | CSS color | Semantic fill color for the part of the fill beyond the target. |
| `baseline.enabled` | auto | `true`, `false`, omitted | Controls baseline behavior. Omitted means automatic based on configured baseline source. |
| `baseline.at.fixed` | `null` | number | Fixed baseline value. |
| `baseline.at.entity` | `null` | entity id | Dynamic baseline entity. |
| `baseline.above.color` | `null` | CSS color | Optional semantic color above the baseline. |
| `baseline.below.color` | `null` | CSS color | Optional semantic color below the baseline. |
| `peak.enabled` | `false` | boolean | Shows a session peak marker. |
| `peak.color` | `#888888` | CSS color | Peak marker color. |
| `peak.reset` | `never` | reset value | Resets Peak using a relative duration or local calendar boundary. |
| `peak.label.show` | `false` | boolean | Shows the formatted Peak value label. |
| `peak.label.text` | absent | string | Optional plain text shown before the value and unit. |
| `peak.label.show_value` | `true` | boolean | Includes or omits the formatted Peak value independently of text and unit. |
| `peak.label.show_unit` | `true` | boolean | Includes or omits the effective row unit independently of text and value. |
| `peak.label.precision` | inherited | number | Overrides the numeric component's precision; omitted values inherit `formatting.decimal`. `peak.label.decimal` remains accepted for existing configurations. |
| `floor.enabled` | `false` | boolean | Shows a session Floor marker for the lowest finite value. |
| `floor.color` | `#888888` | CSS color | Floor marker color. |
| `floor.reset` | `never` | reset value | Resets Floor using a relative duration or local calendar boundary. |
| `floor.label.show` | `false` | boolean | Shows the formatted Floor value label. |
| `floor.label.text` | absent | string | Optional plain text shown before the value and unit. |
| `floor.label.show_value` | `true` | boolean | Includes or omits the formatted Floor value independently of text and unit. |
| `floor.label.show_unit` | `true` | boolean | Includes or omits the effective row unit independently of text and value. |
| `floor.label.precision` | inherited | number | Overrides the numeric component's precision; omitted values inherit `formatting.decimal`. `floor.label.decimal` remains accepted for existing configurations. |
| `formatting.decimal` | `null` | number | Decimal places for displayed numeric values. |
| `formatting.unit` | entity unit | string | Display unit override. |

Legacy flat options are listed separately in the Legacy Compatibility / Migration section. They remain supported, but new dashboards should prefer the structured paths above.

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
| `peak` | object | disabled | Default structured peak marker config |
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

Entity-level configuration uses the same structured option groups as card-level configuration. Values set on an entity override the card-level defaults for that row only.

| Option | Type | Description |
|---|---|---|
| `entity` | string | Home Assistant entity id for the row |
| `name` | string | Row label override |
| `icon` | string | Row icon override |
| `layout` | object | Per-row layout override |
| `scale` | object | Per-row scale override |
| `bar` | object | Per-row fill and needle override |
| `target` | object/number | Per-row target override |
| `peak` | object | Per-row peak override |
| `floor` | object | Per-row floor override |
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

Fixed baseline:

```yaml
baseline:
  at:
    fixed: 0
```

Entity baseline:

```yaml
baseline:
  at:
    entity: sensor.dynamic_baseline
    fixed: 0
```

Percentage baseline:

```yaml
baseline:
  at: 50%
```

Bidirectional fill starts from `baseline.at` instead of always starting at `scale.min`. Optional `baseline.above.color` and `baseline.below.color` can semantically style each side.

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

## Peak Marker

```yaml
peak:
  enabled: true
  color: '#fde68a'
  reset: never
  label:
    show: false
```

The Peak marker tracks the highest finite value observed for the current card session. `reset: never` is the default. See [Peak and Floor reset policies](#peak-and-floor-reset-policies) for relative duration and local calendar resets.

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

## Generic Reference Markers

Use `markers:` to add up to two reference markers in each lane. Generic markers are fixed reference values, not trackers. They share the row's scale and effective unit; SBCP does not convert values from a dynamic source entity.

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

Markers default to the `below` lane, `circle` shape, color `#888888`, and a hidden label. The supported shapes are `circle`, `diamond`, `triangle`, `chevron`, `arrow`, and `pin`; lanes are `above` and `below`. A shown label defaults to the row's effective `formatting.decimal` and unit, and can independently compose optional `text`, `show_value` (default `true`), and `show_unit` (default `true`). Components are joined by one space. If all three components are disabled or absent, no label is rendered. Set `label.precision: 0` for integer precision; generic, Peak, and Floor labels also accept legacy `label.decimal`, and Target continues to accept its established `target.label.decimal` spelling. Use `label.show_unit: false` to omit the effective row unit. Dynamic source units are ignored, and labels remain in the row unit even when a marker falls back to its fixed value. The former marker-label `unit` option is unsupported; use `show_unit`.

At card scope, `markers:` supplies the list inherited by each entity. An entity may replace the list with its own `markers: [...]`; `markers: []` explicitly clears the inherited list. Lists replace rather than merge. A valid but unresolved marker still reserves its lane and one of that lane's two slots. Malformed markers are skipped without consuming a slot; further valid markers remain in configuration but are ignored at runtime with a non-fatal warning. Target, Peak, and Floor do not count toward this limit. Nearby marker labels may overlap.

## Formatting

```yaml
formatting:
  decimal: 1
  unit: kW
```

- `formatting.decimal` applies to displayed numeric values
- `formatting.unit` overrides the entity unit


## Behavior Notes

- Clicking a row opens the native Home Assistant more-info dialog.
- Peak and Floor values are stored in memory and reset when the card or browser is recreated.
- Textual states do not show leftover units.
- Time units `h`, `m`, and `s` render tight, for example `43s` and `4h`.
- Responsive fallbacks prioritize the bar and keep value + unit readable. In tight spaces, labels and icons may step aside automatically.

## Legacy Compatibility / Migration

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


## Demo Assets / Development

The repository includes a full demo playground and a dedicated screenshot board:

- playground dashboard: `examples/dashboards/sensor-bar-card-plus-playground.yaml`
- heritage parity dashboard: `examples/dashboards/sensor-bar-card-plus-heritage.yaml`
- screenshot dashboard: `examples/dashboards/sensor-bar-card-plus-screenshots.yaml`
- helper/template package: `examples/packages/sensor_bar_card_plus_playground_package.yaml`

Use them to validate fill styles, markers, dynamic scales, text states, edge cases, and responsive behavior.

### Test Suite Usage

Install the dev dependencies and Playwright browser once:

```bash
npm install
npx playwright install chromium
```

Run the pure logic unit tests:

```bash
npm run test:unit
```

Run the Playwright visual regression suite:

```bash
npm run test:visual
```

Update the stored visual snapshots intentionally after a reviewed visual change:

```bash
npm run test:visual:update
```

`npm test` runs the unit suite first and then the visual regression suite.

The visual regression suite covers baseline rendering, fill styles, target and peak markers, compact layouts, and clipping or rounded-edge regressions.

## Home Assistant Tile Bar Gauge vs Sensor Bar Card Plus

Home Assistant’s native Tile Bar Gauge is excellent for simple, compact Tile dashboards. Sensor Bar Card Plus is designed for advanced standalone and multi-entity visualization.

| Capability | HA Tile Bar Gauge | Sensor Bar Card Plus |
|---|---:|---:|
| Native Tile card feature | ✅ | Planned |
| Standalone card | ❌ | ✅ |
| Glanceable Hero / KPI layout | ❌ | ✅ |
| Multi-entity support | ❌ | ✅ |
| Visual editor | Basic/native | Advanced |
| Structured YAML output | N/A | ✅ |
| Per-entity overrides | ❌ | ✅ |
| Dynamic min/max entities | ❌ | ✅ |
| Dynamic target entities | ❌ | ✅ |
| Dynamic baseline entities | ❌ | ✅ |
| Target marker | ❌ | ✅ |
| Baseline support | ❌ | ✅ |
| Peak marker | ❌ | ✅ |
| Needle mode | ❌ | ✅ |
| Segments / bands | Limited | ✅ |
| Soft bands | ❌ | ✅ |
| Band gradients | ❌ | ✅ |
| Custom gradient stops | ❌ | ✅ |
| Gradient and segment previews | ❌ | ✅ |
| Entity row management | ❌ | ✅ |

The native Tile Bar Gauge is the right choice when you want a lightweight built-in Tile feature. Sensor Bar Card Plus is the better fit when you need richer visualization, multiple entities, dynamic references, markers, gradients, per-entity overrides, and fine-grained dashboard control.

A Tile-oriented SBCP variant may be considered later, but the current card is intentionally optimized as a dedicated advanced visualization card.


## Project Origin

Sensor Bar Card Plus was originally inspired by Sensor Bar Card by TommySharpNZ. The original project is here:

<https://github.com/TommySharpNZ/sensor-bar-card>

This project uses its own resource path and card type so both cards can coexist safely in the same Home Assistant installation:

- original card type: `custom:sensor-bar-card`
- this card type: `custom:sensor-bar-card-plus`
- this resource path: `/local/sensor-bar-card-plus.js`

It is not a drop-in replacement for the original card.


## Future Directions

Likely future work includes:

- visible `scale.ticks` support under `scale`
- verticality, baby!

## Contributing

Issues and pull requests are welcome.

Recommended workflow:

1. Make changes in the `src/` source tree.
2. Build the distributable:

   ```bash
   npm run build
   ```

3. Run the full test suite:

   ```bash
   npm test
   ```

4. If your change affects logic, layout, rendering, or screenshots, update or add the relevant tests.
5. Verify behavior in the demo playground and screenshot board.
6. Update screenshots or README examples if the user-facing behavior changed.
7. Open a pull request with a concise explanation of the change.

## Support Me

If `sensor-bar-card-plus` improves your Home Assistant dashboard, you can support continued development, maintenance, fixes, documentation, and new features.

[![Buy me a coffee on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/chrisdelaet)

## License

[MIT](LICENSE)
