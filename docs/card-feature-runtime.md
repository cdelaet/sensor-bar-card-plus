# Card Feature runtime and editor foundation

The existing `sensor-bar-card-plus.js` resource also registers
`sensor-bar-card-plus-feature`. No additional resource is required. This preview
uses Home Assistant's [public custom Card Feature API](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card-feature/).
The graphical Feature editor exposes entity inheritance/override, Scale,
Bar Appearance (fill style, color, solid fill), Segments for segment-based fill
styles, Gradient Stops for gradient, and Formatting. Palette edits preserve raw
item metadata/order and inactive palettes. Animation, Needle, Baseline and marker
configuration remains available through YAML; edits
in the graphical editor preserve that raw configuration. No second resource is
required for the editor.

A Tile's entity is inherited when the feature omits `entity`:

```yaml
type: tile
entity: sensor.grid_power
features:
  - type: custom:sensor-bar-card-plus-feature
    scale:
      min:
        fixed: 0
      max:
        fixed: 5000
    bar:
      fill_style: gradient
      animated: true
      gradient_stops:
        - pos: 0
          color: '#4CAF50'
        - pos: 100
          color: '#F44336'
```

An explicit feature entity can differ from a nonnumeric parent:

```yaml
type: tile
entity: switch.heat_pump
features:
  - type: custom:sensor-bar-card-plus-feature
    entity: sensor.heat_pump_power
    scale:
      min:
        fixed: 0
      max:
        fixed: 5000
    bar:
      fill_style: soft_bands
      needle: true
      segments:
        - from: 0
          to: 2000
          color: '#4CAF50'
        - from: 2000
          to: 5000
          color: '#F44336'
    target:
      at:
        fixed: 3500
    peak:
      enabled: true
      reset: daily
    floor:
      enabled: true
      reset: daily
    markers:
      - at: '50%'
        shape: pin
```

## Supported surface

Use the existing [SBCP configuration syntax](configuration.md) for `scale`, `bar`,
`baseline`, `target`, `peak`, `floor`, `markers` and `formatting`. Legacy aliases
continue through the same normalizer. Fixed/dynamic scales and their existing
fallback rules, all five fill styles, Segments, Target overlay colors, Baseline,
Needle and built-in/reference glyphs use the shared renderer. Baseline suppresses
Needle under the current SBCP semantics.

This surface contains the physical bar and compact marker labels. Title, multiple
entities, icons, Hero, label-position modes, primary-value layout and label hover
promotion are excluded. `entities` is rejected; use the singular
`entity` override. Presentation options such as `title` and `layout` do not add
standalone-card content. Actions, reverse scales, symbolic
Baseline endpoints and vertical orientation are not implemented.

The effective entity is the explicit override, otherwise `context.entity_id`.
Inheritance is never written into saved YAML. Area context without an explicit
entity shows “Configure an entity”; there is no area aggregation. The discovery
predicate accepts entity or area context, including nonnumeric parent entities,
because it cannot see the eventual feature override.

Missing, unknown, unavailable and nonnumeric values show a text status with the
entire visualization hidden. Numeric zero remains a valid reading. Accessible
information names the entity, current value/unit, scale and visible marker
semantics (including full configured labels even when width hides them), or the
unavailable state. Marker anchors and independent label values are described
separately. Initial display and recovery have no motion; subsequent updates use the
shared transition timing and honor reduced-motion preferences. The feature has
no controls or action handlers and leaves parent interactions available.

Sizing follows `--feature-height` (42px fallback) and `--feature-border-radius`
(12px fallback), with percentage geometry adapting to available width, inline
placement, short heights and zero-width recovery. Configured marker labels use
one local ResizeObserver and coalesced animation-frame layout; glyph-only
features need neither. Theme backgrounds/text are inherited;
`--feature-color` and HA's `color` input tint the track background. Fill colors
remain governed by SBCP's bar/Segment configuration. No button-spacing layout
is needed for a single passive bar.

## Compact marker labels

Target, Peak, Floor and reference markers use the existing `label` options,
including text, value, unit and precision. Generic `show_marker: false` anchors
and independent `label.entity` values work too. Labels remain passive: no hover
promotion, controls, keyboard stops or tap handlers.

Each configured above/below label lane reserves exactly 10px: 9px text with a
9px line-height plus a 1px gap to the rail. There is no outer vertical padding.
Reservations persist through unknown/unavailable label or anchor sources.
Glyphs alone reserve no label space. Height comes from the feature's own CSS
and dimensions, without inspecting Tile internals or relying on `position`.

| Configured label lanes | Bottom (42px) rail | Inline (36px) rail |
|---|---:|---:|
| None | 42px | 36px |
| One | 32px | 26px |
| Both | 22px | 16px |

With both lanes, above text occupies y=0..9 and the rail starts at y=10.
Bottom's rail ends at y=32, with below text at y=33..42. Inline's rail ends at
y=26, with below text at y=27..36. Dynamic characters never enlarge a lane.
The deliberately small font should be checked for readability in your theme.

Reserving either label lane caps all glyphs in the bar at 8px maximum dimension
in both Bottom and Inline, uniformly scaling each existing
shape without changing its anchor or direction. A 14×11px triangle becomes
8×6.29px; SVG glyph boxes become 8×8px. Only bars with no reserved label lanes
retain the existing glyph geometry. Compact sizing stays active through
unavailable label content and horizontal degradation/suppression, including
unlabelled markers in either lane. Needle stays 7px wide and behind
the marker glyphs; coincident Peak/Floor leave a visible central Needle section.

Within each lane, labels are sorted by physical anchor (model order breaks
ties) and assigned slots bounded by neighboring anchor midpoints. Slots have a
4px separation where possible; text has 2px horizontal padding per side.
Browser font measurements select the full configured label, then the configured
value/unit, then hide it. Enabled units and numeric precision are preserved;
numeric and independent state values are never truncated. Text-only labels may
show a measured prefix of at least three characters plus an ellipsis. Glyph
anchors and semantic lanes never move to accommodate labels. The accessible
description always retains full resolved marker information.

Label nodes persist by marker ID. Resize, font completion, configuration and
entity updates trigger local layout. Stable movement can use the shared 600ms
timing; resizing, slot-order/width changes and representation changes snap.
`bar.animated: false` and reduced motion disable transitions. Disconnect removes
the observer, font listener and pending frame; reconnect restores layout.

## History and lifecycle

Each feature instance owns its dynamic-scale fallback and Peak/Floor history,
even when two instances show the same entity. Peak/Floor use the existing pure
reset utility, including `never`, duration and local calendar resets, evaluated
on the next numeric sample using the state's timestamp (or current time if it
has none). They track readings received during that instance's lifetime; they
do not fetch recorder history. An unavailable primary value retains history.
Missing dynamic scale sources still follow SBCP's existing fallback rules;
previous bounds only protect numeric transient inversions.

Changing configuration or effective entity starts fresh history and rebuilds
bar structure. Repeating identical configuration does not reset it. Updating
`hass`, `context`, `color` or `position` without changing the effective entity
retains history. Disconnect/reconnect of the same instance retains history;
a newly created instance starts fresh. Ordinary state updates patch persistent
nodes. A change in required structure, such as Needle appearing when a dynamic
Baseline becomes unresolved, rebuilds the physical bar.

The Feature editor keeps inherited entity distinct from an explicit override and
reuses the shared Scale, Bar Appearance and Formatting sections with raw,
patch-only persistence. Its registry entry is configurable and
`getConfigElement()` returns `sensor-bar-card-plus-feature-editor`. Config
replacement currently resets runtime history; the editor relies on HA's
surrounding live preview and does not create a second runtime/history instance.

## Acceptance on current Home Assistant

The repository provides a simulated public-contract browser harness, but no
real Home Assistant frontend integration environment. Before considering live
acceptance complete, test the generated resource in a current Home Assistant
installation:

1. Reload the existing SBCP resource (clear frontend cache if necessary). Check
   discovery contains one “Sensor Bar Card Plus” feature and that existing SBCP
   cards and their editor still load. Repeated resource evaluation must not
   report duplicate custom-element registrations.
2. Paste the first Tile example, using a real numeric entity. Confirm inherited
   value, configured range and paint. Update the sensor and verify transitions.
3. Paste the second example with real switch/power entities. Confirm the switch
   remains the Tile's entity, the feature shows power, and tapping the Tile
   retains its usual interaction.
4. Try bottom and inline feature placement, narrow/two-column dashboards,
   mobile widths, short feature heights, hidden-view startup and later view
   activation. Check clipping and resize recovery.
5. Exercise all five fill styles, numeric/percentage Segments, fixed/dynamic
   scales and fallbacks, dynamic Baseline, Needle, Target overlays and all
   marker shapes. Verify current Baseline/Needle precedence.
6. Put two features for the same entity on screen, with different scale/reset
   settings. Check isolated Peak/Floor values and dynamic-scale fallback;
   exercise a duration/calendar reset across the next numeric update.
7. Remove/recover an explicit override, send unknown/unavailable/nonnumeric
   states, and switch the parent context entity. Check visible status, numeric
   recovery and fresh history after entity/config replacement.
8. Change themes and OS reduced-motion preference. Inspect accessible state
   with a screen reader, including entity/value/range and unavailable status.
9. Navigate away and back, then reload the dashboard. Verify same-instance
   reconnection and new-instance history behavior, with no console errors.

Also open the graphical Feature editor and check inherited/explicit entity
selection, clearing, context changes, picker behavior and narrow dialogs. Confirm
advanced YAML configuration survives edits to the exposed fields. Exercise palette
add/edit/remove, invalid drafts, CSS Gradient colors and narrow dialogs; confirm
inactive palettes, omitted Segment ends, metadata and raw order survive. The remaining
advanced graphical sections are not part of the current editor foundation.

## Marker-label manual checks

Use real entities in these examples. Reuse the first Tile with
`features_position: inline` to check the normal 36px presentation; bottom uses
42px. Neither mode should enlarge the Tile.

```yaml
type: tile
entity: sensor.sbcp_playground_sensor
features_position: bottom
features:
  - type: custom:sensor-bar-card-plus-feature
    scale: { min: 0, max: 100 }
    bar: { needle: true }
    target:
      at: 60
      label: { show: true, text: Target, precision: 1 }
    markers:
      - at: 25
        lane: above
        shape: diamond
        label: { show: true, text: Low }
      - at: 75
        lane: below
        shape: circle
        label: { show: true, text: High }
```

For the coincident Inline acceptance case, replace the feature with this and
start a fresh instance/reload while the sensor has a stable numeric value:

```yaml
- type: custom:sensor-bar-card-plus-feature
  scale: { min: 0, max: 100 }
  bar: { needle: true, animated: false }
  peak:
    enabled: true
    label: { show: true, text: High }
  floor:
    enabled: true
    label: { show: true, text: Low }
```

Peak, Floor and Needle initially share the current value. Check recognizable
8px-capped glyphs and the Needle between them. Change the reading and check
independent extrema, then repeat with animations enabled and reduced motion.

For independent label content, replace `markers` in the first example with:

```yaml
markers:
  - at: 25
    lane: above
    show_marker: false
    label:
      show: true
      text: Energy
      entity: sensor.sbcp_playground_label
      precision: 1
  - at: 75
    lane: below
    label: { show: true, text: High }
```

Update the label entity to numeric and textual states, then unknown/unavailable
and back. Its own unit/value must update while the anchor stays at 25; no glyph
should appear there. The two lane reservations must stay fixed. Also make the
primary sensor unavailable and recover: status should replace the visualization
and recovery should not animate from zero.

For narrow collisions, set Target and the below reference marker near 50,
use longer label text, and place the Tile in a narrow column/Inline layout.
Resize wider and narrower and test a hidden view becoming visible. Expect
full → value/unit → hidden according to measured width, with no numeric/unit
truncation, no label overlaps and no glyph movement. Check that Tile taps still
work over the text and that a screen reader retains the full labels.
