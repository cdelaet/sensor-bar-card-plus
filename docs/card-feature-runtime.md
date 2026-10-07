# Card Feature runtime (YAML preview)

The existing `sensor-bar-card-plus.js` resource also registers
`sensor-bar-card-plus-feature`. No additional resource is required. This preview
uses Home Assistant's [public custom Card Feature API](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card-feature/).
The graphical feature editor is deferred to Phase 3; configure this runtime in YAML.

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

This surface contains the physical bar only. Title, multiple entities, icons,
Hero, label-position modes, primary-value layout, external marker labels/lanes
and label hover promotion are excluded. `entities` is rejected; use the singular
`entity` override. Presentation options such as `title`, `layout` and marker
labels do not add standalone-card content. Actions, reverse scales, symbolic
Baseline endpoints and vertical orientation are not implemented.

The effective entity is the explicit override, otherwise `context.entity_id`.
Inheritance is never written into saved YAML. Area context without an explicit
entity shows “Configure an entity”; there is no area aggregation. The discovery
predicate accepts entity or area context, including nonnumeric parent entities,
because it cannot see the eventual feature override.

Missing, unknown, unavailable and nonnumeric values show a text status with the
entire visualization hidden. Numeric zero remains a valid reading. Accessible
information names the entity, current value/unit and scale, or the unavailable
state. Initial display and recovery have no motion; subsequent updates use the
shared transition timing and honor reduced-motion preferences. The feature has
no controls or action handlers and leaves parent interactions available.

Sizing follows `--feature-height` (42px fallback) and `--feature-border-radius`
(12px fallback), with percentage geometry adapting to available width, inline
placement, short heights and zero-width recovery. No measurement loop or
ResizeObserver is needed. Theme backgrounds/text are inherited;
`--feature-color` and HA's `color` input tint the track background. Fill colors
remain governed by SBCP's bar/Segment configuration. No button-spacing layout
is needed for a single passive bar.

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

For Phase 3, keep inherited entity distinct from an explicit override and use
the same canonical sections. Config replacement currently resets history, so
live editor previews should account for that. External labels remain outside
this surface's contract. The registry is intentionally not marked configurable
and the feature has no `getConfigElement()` yet.

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

Full public documentation and the graphical editor remain deferred to Phase 3.
