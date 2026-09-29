![Sensor Bar Card Plus](images/branding/logo-300.png)

# Sensor Bar Card Plus

[![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/cdelaet/sensor-bar-card-plus)](https://github.com/cdelaet/sensor-bar-card-plus/releases)
[![Validate](https://github.com/cdelaet/sensor-bar-card-plus/actions/workflows/validate.yml/badge.svg)](https://github.com/cdelaet/sensor-bar-card-plus/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License: MIT-yellow.svg)](https://github.com/cdelaet/sensor-bar-card-plus/blob/main/LICENSE)

Sensor Bar Card Plus (SBCP) is a Home Assistant dashboard card for presenting numeric sensor values as configurable bars or gauges. It is useful when a value needs visual context: its scale, operating range, target, recent extrema, or relationship to a neutral point.

![Sensor Bar Card Plus showcase](images/hero-400.gif)

SBCP supports multiple entities, structured YAML, animated reveal fills, Needle gauges, semantic fill styles, five label layouts including Hero, dynamic scales, Baseline fill origins, Target/Peak/Floor markers, generic reference markers, per-entity overrides, and a Visual Editor. Its responsive layout adapts labels and supporting details to the available card width.

Now you have no excuse not to build that pretty dashboard. Go forth and look cool. -Chris

## Install

### HACS

1. Open **HACS** in Home Assistant.
2. Search for **Sensor Bar Card Plus** and select **Download**.
3. Refresh your browser.

![Installing Sensor Bar Card Plus from HACS](images/hacs-installation.png)

### Manual

1. Download `sensor-bar-card-plus.js` from the [latest release](https://github.com/cdelaet/sensor-bar-card-plus/releases).
2. Copy it to `/config/www/`.
3. Under **Settings → Dashboards → Resources**, add `/local/sensor-bar-card-plus.js` as a JavaScript module.
4. Refresh your browser.

## Your first card

This example shows a power sensor on a 0–3000 W scale, with a gradient fill and a 2500 W target:

~~~yaml
type: custom:sensor-bar-card-plus
title: Caravan Power
layout:
  label:
    position: left
scale:
  min:
    fixed: 0
  max:
    fixed: 3000
formatting:
  unit: W
target:
  at:
    fixed: 2500
  label:
    show: true
bar:
  fill_style: gradient
entities:
  - entity: sensor.caravan_power
    name: Caravan
    icon: mdi:caravan
~~~

The filled track moves with the sensor reading, while the target marks the configured threshold. Change the entity and scale to fit your sensor. You can create the card from the Home Assistant card picker and edit the same configuration in the Visual Editor.

![Basic example](images/bar-basic.png)

## How a card works

Each row starts with a sensor value. SBCP compares that value with the row’s effective minimum and maximum to place it on a scale. Those bounds, Baseline, Target, and generic marker values can use live Home Assistant entities as sources. The track represents the scale; the fill or Needle shows the current value. Peak and Floor show observed extrema. Baseline changes where a reveal fill begins. Labels and layout determine how the value and its context fit around the track.

Card settings provide defaults for supported row settings. Entity rows can override layout, scale, bar, Baseline, Target, Peak, Floor, generic markers, and formatting; card-only settings such as `title` and `entities` are not row overrides. Lists such as markers replace the inherited list. See [Configuration: scope and inheritance](docs/configuration.md#scope-inheritance-and-replacement) for the detailed rules.

## Rendering and fill styles

### Reveal fill

Reveal fill runs from its fill origin to the current value. By default, the origin is the scale minimum; when Baseline is active, it becomes the fill origin. Reveal fill works well for progress, usage, charge, and other quantities where the amount filled is meaningful.

### Needle

Needle mode keeps the full track visible and places a moving indicator at the current value. Use it when the full scale and its color regions should remain visible, even at low readings. Needle and Baseline are distinct rendering models; Needle does not use Baseline fill geometry.

### Fill styles

The fill style controls how the track is colored:

- `solid` uses one color.
- `gradient` blends configured colors across the scale.
- `bands` changes color at segment boundaries.
- `soft_bands` blends across short transitions between segments.
- `band_gradient` creates a continuous gradient from segment colors.

`solid_fill` samples the active color at the current value and uses it uniformly across the revealed fill, which is useful when the active band or gradient color should remain consistent behind the reading.

Segment boundaries can describe percentages of the track or values on the configured scale. The [configuration reference](docs/configuration.md#fill-styles-reference) has the detailed options and defaults.

![Gradient fill example](images/example-gradient-small.gif)

## Layouts

Choose a label position to suit the dashboard:

- **Left** keeps a label beside each bar and works well for aligned multi-row cards.
- **Above** puts the label above the track, useful when the left column is tight.
- **Inside** places the label within the track.
- **Off** leaves the bar without a name label.
- **Hero** gives the value more prominence for a glanceable gauge or KPI.

The card can adapt supporting labels and icons as width changes. Hero gives the value priority; standard layouts preserve useful room for the track and may hide supporting details in tight spaces. Explicit row height remains respected, and very dense or narrow layouts can still have edge cases. Exact sizing and responsive configuration are in [Layout](docs/configuration.md#structured-configuration).

## Baseline: fill from a reference point

**Baseline controls where the fill begins. It is not a marker glyph.**

For a bidirectional quantity such as grid import/export, set a zero Baseline on a scale that includes both negative and positive values. The reveal fill then grows away from zero toward the current reading. The same pattern works for battery charge/discharge or a measurement that moves above and below a neutral point. Optional above/below colors can distinguish the two sides.

~~~yaml
scale:
  min:
    fixed: -5000
  max:
    fixed: 5000
baseline:
  at:
    fixed: 0
  above:
    color: '#22c55e'
  below:
    color: '#3b82f6'
entities:
  - entity: sensor.grid_power
    name: Grid exchange
~~~

Baseline does not change the scale or the meaning of its values. Its full field reference is in [Baseline](docs/configuration.md#baseline).

## Markers: targets, extrema and references

Markers add values worth seeing against a row’s scale. They do not set the fill origin; use Baseline when the fill should begin from a reference point.

### Target

Target is a configured threshold or reference. It supports fixed, percentage, and entity-driven values, including existing dynamic behavior. Target predates v1.7.0; its default glyph is now Diamond. Set `target.shape: triangle` to keep the former triangle appearance. Target labels and above-target fill color are optional.

### Peak and Floor

Peak tracks the highest finite value observed for the card row; Floor tracks the lowest. They complement each other by showing the observed range. Their values are runtime/session state held by the card, not durable historical statistics, and are lost when the card or browser is recreated. Each can be reset using supported duration or local calendar policies; see [Peak and Floor reset behavior](docs/configuration.md#peak-and-floor-reset-behavior).

### Generic Reference Markers

Use `markers` for configured references that are not Target thresholds or observed extrema. A marker can use a fixed value, a percentage of the effective scale, an entity value, or an entity with a fixed fallback. For example, the following row shows a forecast reference and an entity-driven trigger:

~~~yaml
markers:
  - at: 35%
    lane: above
    shape: diamond
    color: '#38bdf8'
    label:
      show: true
      text: Forecast
  - at:
      entity: sensor.warning_threshold
      fixed: 75
    lane: below
    shape: pin
    direction: outward
    color: '#f59e0b'
    label:
      show: true
      text: Trigger
entities:
  - entity: sensor.grid_power
    name: Grid
~~~

Markers can occupy the `above` or `below` lane. Their shapes are Circle, Diamond, Triangle, Chevron, Arrow, and Pin. Direction (`inward` or `outward`) affects directional shapes; Circle and Diamond do not change with direction. Marker color and labels can distinguish a forecast, reserve, comfort bound, or other reference.

Up to four markers can appear above the bar and four below it. Peak uses an above slot; Floor and Target use below slots. A marker label can display a different entity with `label.entity`, and `show_marker: false` makes it a label-only information anchor that still uses a slot. Nearby labels can overlap. For units, unavailable states, inheritance, clamping, and full syntax, see [Generic Reference Markers](docs/configuration.md#generic-reference-markers).

## Practical examples

The [recipe catalogue](examples/recipes/README.md) contains copyable dashboard patterns with descriptions of when they fit. A few starting points:

- **Grid import/export** and **battery flow** use Baseline to show movement on either side of zero: [grid import/export](examples/recipes/energy/grid-import-export.yaml), [battery flow](examples/recipes/energy/battery-flow.yaml), and [bidirectional power](examples/recipes/baseline/bidirectional-power.yaml).
- **Solar production** and **EV charging** show positive power and household demand: [solar production](examples/recipes/energy/solar-production.yaml) and [EV charging](examples/recipes/energy/ev-charging.yaml).
- **Server health**, **network latency**, and **dense telemetry** demonstrate compact operational dashboards: [server health](examples/recipes/telemetry/server-health.yaml), [network latency](examples/recipes/telemetry/network-latency.yaml), and [dense AV telemetry](examples/recipes/telemetry/dense-av-telemetry.yaml).
- [Needle basics](examples/recipes/gauges/needle-gauge-basics.yaml) and [Needle with soft bands](examples/recipes/gauges/needle-soft-bands.yaml) keep the whole scale in view.

The [example dashboards](examples/dashboards/) serve different purposes: interactive exploration, curated screenshots, practical recipes, and legacy/structured compatibility demonstrations.

## Visual Editor

The Home Assistant Visual Editor edits ordinary SBCP card configuration and previews the result as you work. Use it to add entities, adjust layout and fill, configure references, or explore a card before editing YAML directly.

Target, Peak, Floor, Generic Reference Markers, and individual generic markers have collapsible editor groups. Baseline is configured under **Bar Appearance**; entity-level Baseline remains with the entity overrides. The editor keeps its local disclosure state out of saved YAML. You can continue editing the same structured configuration manually at any time.

![Visual Editor screenshot — pending v1.7.0 replacement](images/visual-editor.png)

## Responsive behavior and data details

SBCP adapts label and icon placement to available width, while keeping the bar and value useful where possible. Click or tap an entity row to open Home Assistant’s standard more-info dialog. If an entity is missing, its row shows an error while other rows remain available. Dynamic scales and reference values update as their source entities change. When a primary reading is unknown or unavailable, the card cannot place a new numeric value; Peak and Floor retain the last finite sample until reset or reconfiguration.

Peak and Floor are session state rather than long-term history. Marker labels can overlap when references are close together, and a dynamic marker’s source unit is not converted to the row unit. These details and other boundary behavior are covered in the [configuration reference](docs/configuration.md#behavior-notes).

## Compatibility

Existing dashboards do not require a configuration migration for v1.7.0. Target’s default appearance changed to Diamond; set `target.shape: triangle` to retain the former triangle. Legacy flat configuration remains supported. See [Legacy compatibility and migration](docs/configuration.md#legacy-compatibility-and-migration) for aliases and the converter.

## Documentation and examples

- [Complete configuration reference](docs/configuration.md)
- [Practical recipe catalogue](examples/recipes/README.md)
- [Example dashboards](examples/dashboards/)
- [Contributor and development guide](CONTRIBUTING.md)

## About, support and license

Sensor Bar Card Plus was inspired by [Sensor Bar Card by TommySharpNZ](https://github.com/TommySharpNZ/sensor-bar-card). SBCP uses its own card type (`custom:sensor-bar-card-plus`) and resource path (`/local/sensor-bar-card-plus.js`), so both cards can coexist.

If SBCP improves your Home Assistant dashboard, you can [support continued development on Ko-fi](https://ko-fi.com/chrisdelaet).

Licensed under the [MIT License](LICENSE).
