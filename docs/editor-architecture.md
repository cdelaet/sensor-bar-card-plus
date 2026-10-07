# Shared editor infrastructure and sections (Phases 3A–3D)

The shipped standalone host remains `src/editor/SensorBarCardPlusEditor.js`.
It uses the same HTMLElement, shadow DOM, string templates and delegated events.
Phase 3D adds a separate Card Feature editor host without changing the
standalone host or its persistence policy.

## Shared seam

- `src/editor/shared/editor-config.js`: existing cloning, stable config equality,
  path reads/writes/deletes, scoped path construction, pruning and scalar parsing.
  Operations return config data; they do not emit events or clean a whole config.
- `src/editor/shared/editor-controls.js`: existing entity/source input templates,
  color helpers/controls, built-in marker label templates and reset options.
  The host supplies resolved label options, synchronizes entity pickers and handles
  events. Existing IDs and data attributes remain unchanged.
- `src/editor/shared/editor-styles.js`: the existing standalone CSS verbatim.
  No selectors, layout or theme behavior changed. A future host can choose which
  sections to compose; sharing CSS does not require rendering standalone sections.

Private methods remain thin delegates for existing callers and tests. Template
whitespace is preserved so representative generated HTML can match exactly.

## Responsibilities deliberately retained by the standalone host

`setConfig`, draft maps, config-echo handling, focus restoration, scheduling,
picker synchronization, disclosure state, section composition and delegated event
lifecycle remain in the host. Generic effective inheritance/source readers, source
canonicalization, array mutation/validation and `_applyScopedMutation` (including
standalone shorthand-to-entity-list conversion).

`_applyUserConfig`, `_emitConfigChanged` and `_cleanupEditorEmittedConfig` remain
host-owned. A future Feature host may reuse pure config primitives and controls
with its own patch-only persistence policy. These shared modules do not implement
that future policy or require the standalone cleanup path.

## Existing behavior intentionally preserved

- Whole-config cleanup and its normalized-semantics guard remain unchanged;
  this is not an exact raw-YAML preservation guarantee for unknown configuration.
- Enabling Needle still removes an active Baseline in the standalone editor.
- An entity-only Scale override has no inherited fixed fallback in the editor's
  effective source reader; a scope with no override inherits the root source.
- Ordinary typing/config echoes preserve mounted focused inputs. Enter-committing
  a gradient draft currently does not restore focus after the structural render.
- Segment colors remain native color pickers. Non-hex color text fallbacks appear
  only where the existing color helper already rendered them.

## Regression protection and next boundary

`tests/unit/editor-infrastructure.spec.mjs` characterizes loading/equality,
config events, immutable paths, scoped edits, sources, picker/fallback behavior,
array drafts and marker identity against both source and dist. Existing extensive
editor and semantic-preservation tests remain in place.

`tests/visual/editor-infrastructure.spec.js` checks real-browser focus, drafts,
disclosures and Enter commit. Two editor screenshots capture Scale and expanded
Target controls before extraction. Existing runtime snapshots remain unchanged.

## Scale and Formatting sections (Phase 3B)

`src/editor/sections/scale.js` owns root/override templates, bounds accessors,
override detection/summary/clearing and decoded field routing. Its source readers
and edits use the host's generic resolvable-source machinery, also used by Target
and Baseline; this intentionally remains host-owned to avoid moving unrelated
sections or changing source canonicalization.

`src/editor/sections/formatting.js` owns raw/effective unit and decimal readers,
aliases, field-specific mutations, override detection/summary/clearing, templates
and decoded field routing. It preserves empty/null inheritance, explicit zero
precision and existing invalid-input handling.

The standalone `_createSectionContext()` supplies four plain operations:

| Operation | Contract |
|---|---|
| `read(scope, path)` | Read the raw value at a scoped path, without persisting defaults. |
| `mutate(scope, mutation, options)` | Apply a section's immutable mutation; the host owns emission and optional `rerender`. |
| `source(scope, key, effective)` | Return current source parts, optionally using existing effective inheritance. |
| `setSource(scope, key, part, value)` | Request a source edit using the host's canonicalization/persistence policy. |

Formatting uses only `read` and `mutate`; Scale uses `source`, `setSource` and
`mutate`. Section functions receive this context, never the complete editor.
Decoded field handlers return a handled boolean, including invalid/no-op edits;
the host retains event decoding, routing priority and listener ownership.

Root sections render at their existing positions. Entity sections return their
existing control content; the host retains `_renderOverrideGroup`, titles,
disclosure state and list composition. All twelve pre-existing Scale/Formatting
private entry points remain delegates. Picker synchronization stays in the host.
Shared control IDs/data attributes and template whitespace remain unchanged.

A future Feature host can supply root-only scoped reads and its own mutation and
source policies. It needs no `entities` array, title/layout state, editor class or
standalone cleanup. `tests/unit/editor-sections.spec.mjs` demonstrates this with
plain contexts, alongside source/dist characterization of existing standalone
semantics. No Feature persistence policy or Feature editor is implemented here.

Two additional browser baselines capture root/override Formatting before this
extraction. Existing Scale/Target editor baselines remain unchanged. Browser
tests cover focused Scale/Formatting edits, inherited presentation and clearing
an override. Representative before/after HTML checks include explicit/legacy
Formatting, zero precision and entity-only Scale overrides.

Lesson for later sections: move the templates and field-specific readers/edits
together, while retaining generic sources, lifecycle and persistence in the host.
Preserve the distinction between raw/local values and effective display values.
Avoid adding context operations until a section actually needs them.

## Bar Appearance section (Phase 3C)

`src/editor/sections/bar-appearance.js` owns the existing `bar.fill_style`,
`bar.color` and `bar.solid_fill` controls: raw/effective readers, aliases,
default handling, field-specific mutations, override detection/summary/clearing,
root/override templates and decoded field routing. Color controls use the shared
`renderColorInput` primitive. Effective fill style reuses `normalizeBarConfig`
and its existing paint explicitness; it never normalizes or persists a whole
card. Runtime normalization itself is unchanged.

Bar Appearance uses only `read` and `mutate`. An empty-path `read(scope, [])`
returns raw scope data for the existing bar normalizer, including palette
explicitness that affects fill style. Entity scope resolution remains the host's
responsibility; the shared section never indexes `entities[]`. Mutation options
retain existing alias/pruning metadata and override clearing requests
`{ rerender: true }`; cleanup, emission and scheduling remain host-owned.
The four-operation section context is unchanged.

The exact render interface is
`renderBarAppearanceSection(context, scope, renderChildren = () => '')`.
The optional, synchronous, zero-argument callback returns HTML at the root's
existing child position. It captures only the host's current template content;
the section receives no editor instance or arbitrary private-method access.
The standalone host supplies the existing nested Baseline and Needle templates
verbatim. An entity render returns only controls for `_renderOverrideGroup`,
with disclosure state, title and summary composition still host-owned.

The actual DOM has **Segments and Gradient Stops as sibling sections**, not
children of Bar Appearance. Their templates and conditional inactive/default
presentation remain in the host, reading the shared effective fill style via
the retained delegates. They are always rendered; the current fill style
determines their inactive notes and summaries. Neither their DOM hierarchy nor
their behavior was changed to fit a conceptual parent/child diagram. Their
array rows, sorting, drafts, validation, previews, focus and event handlers also
remain host-owned. No additional palette-render hook or slot framework is needed.
A future host can compose the shared Bar Appearance section and separately
compose palette sections, and omit the nested-child callback when unnecessary.

These private entry points retain thin delegates:

- `_getFillStyleValue`, `_getFillStyleFromColorMode`, `_getScopedFillStyleValue`,
  `_getEffectiveScopedFillStyleValue`, `_getEffectiveFillStyleValue`,
  `_setScopedBarFillStyle`.
- `_getScopedBarColorValue`, `_getEffectiveScopedBarColorValue`,
  `_setScopedBarColor`.
- `_getScopedBarSolidFillValue`, `_getEffectiveScopedBarSolidFillValue`,
  `_setScopedBarSolidFill`.
- `_clearEntityBarAppearance`, `_hasEntityBarAppearanceOverride`,
  `_getBarAppearanceSummary`.

The existing `_setBarFillStyle` and `_setBarColor` root convenience delegates
also remain. `_render` delegates root/override control rendering, and
`_handleFieldEvent` delegates decoded Bar field handling at the original routing
positions. Generic source/canonical mutation helpers, `_cleanupBarForEmit` and
all whole-config cleanup/emission remain in the standalone host.

Questionable existing behavior is intentionally preserved:

- A color-only config's raw fill reader returns `bands`, while the effective
  runtime-backed reader selects `solid`; explicit palettes retain precedence.
- Default blue (`#4a9eff`, case-insensitive) removes a color override, even if
  that restores a different inherited color.
- A stored local `solid_fill: false` is displayed as false, but editing false
  removes the key and restores the root setting. There is no top-level
  `solid_fill` alias in these readers.
- Nested `bar.color_mode` is read but does not alone count as a Bar override;
  appearance clearing/setters remove the top-level mode alias, not that nested
  key. Summaries omit `solid_fill` and default `bands`.
- Conditional palette DOM refresh follows the existing host structural-render
  policy; this extraction does not alter focused-input/config-echo handling.

`tests/unit/editor-bar-appearance.spec.mjs` characterizes these rules against
source and dist, all supported fill styles, inheritance, aliases, scoped
clearing, CSS colors, config echoes and unrelated configuration preservation.
Two plain root-context tests prove rendering, optional child composition and
edits without an editor class, entity array or standalone persistence policy.
The read-only bar normalization does not invoke the host's whole-config cleanup.

`tests/visual/editor-bar-appearance.spec.js` covers real-browser focused root
and entity color editing/config echoes, inherited controls, clearing and palette
inactive presentation. Two root/override Bar screenshots were captured before
extraction. All previous editor/runtime baselines remain unchanged. Expanded
before/after HTML parity covers 80 source/dist and picker/fallback combinations,
alongside the original 20-case and Phase 3B 32-case checks.

## Card Feature editor foundation (Phase 3D)

`src/feature/SensorBarCardPlusFeatureEditor.js` is the second thin HTMLElement
host, using an open shadow root and the existing shared stylesheet. It owns raw
Feature config, `hass`, public Feature `context`, entity selection/inheritance,
section composition, picker synchronization, delegated events, coalesced
microtask rendering and `config-changed` emission. It imports the exact shared
Scale, Formatting and Bar Appearance sections. The four-operation context is
unchanged; all scopes supplied by this host are root scopes, with no entity rows.

### Raw, patch-only persistence

`setConfig()` clones raw data without emitting, normalizing, canonicalizing or
materializing defaults. The host applies the immutable mutation requested by a
shared section, compares raw values for a no-op, then emits a cloned raw config
in a bubbling, composed `config-changed` event with `detail: { config }`.
Normalized/effective values are only for display. No standalone cleanup,
serialization of runtime configuration or known-field reconstruction is used.
Unknown root/nested siblings, inactive configuration, explicit defaults,
advanced sections and array ordering survive unrelated edits. Input configs and
emitted event payloads do not share mutable data with the retained config.
Stable serialization is used only for equality; it never becomes the payload.

Control ownership is explicit:

- Formatting edits own only the selected unit/decimal and its top-level alias.
- Bar edits own only the selected fill style/color/solid-fill and its existing
  top-level alias/default-removal behavior. Opening or unrelated edits never
  remove explicit defaults. No palette, animation, Needle or marker field is
  rewritten because it is absent from the current UI.
- Scale source edits use `src/feature/feature-editor-config.js`, a small host
  persistence adapter rather than standalone source canonicalization. Object
  bounds retain metadata and the other source part; the fixed control owns its
  `fixed`/`value` aliases, and clearing removes both fallback aliases. Existing
  `value` syntax is retained when it is the stored fallback. Legacy root bounds
  remain legacy and their other source part remains untouched. Scalar bounds
  retain scalar syntax when editing that scalar's part, promoting to an object
  only when adding the other part. Clearing an absent part is a no-op, including
  an explicit null bound. Inactive aliases remain untouched by unrelated edits.

Standalone source canonicalization and global cleanup remain exactly as before.
The shared Scale section delegates source policy through `source`/`setSource`,
which lets these deliberately different host policies coexist without a fork.

### Entity and editor lifecycle

The effective entity is the explicit Feature `entity`, otherwise
`context.entity_id`. A status describes the current source using text. With a
parent and no override, its entity is displayed read-only; “Use explicit entity”
reveals an empty picker without persisting anything. Selecting an entity writes
only `entity`; unchecking or clearing deletes it and immediately restores parent
inheritance. Context-only changes update the description without emitting.
Explicit overrides survive parent changes. With no parent/override, including
Area context, the editor displays an entity-required message and picker; no
entity is invented or Area aggregated. Custom entity IDs and all domains remain
available; numeric-state suitability belongs to the runtime.

The shared picker primitive provides HA picker or text fallback. The host
synchronizes `hass`, labels, accessible names, `allowCustomEntity` and values.
HA `value-changed` is authoritative; internal picker input/change events are
ignored. A one-time `whenDefined` completion upgrades a late HA picker without
polling. HA input arrival order is independent. Echoes/no-ops preserve mounted
controls and avoid duplicate emissions. Ordinary value updates patch properties;
only entity/picker/color-control structure changes rebuild DOM, restoring focus
and text selection where applicable. A CSS-color fallback remains mounted during
typing until blur, even if its value becomes hex; a focused override toggle is
also retained until blur when clearing removes its no-parent presentation.
Disconnect invalidates pending
render work; reconnect reuses the owned delegated listeners.

### Public integration and exposed scope

The [public HA feature API](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card-feature/)
supports `configurable: true`, static `getConfigElement()` and an inherited stub.
The [HA editor interfaces](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/types.ts)
include `hass`, `context` and `setConfig()`; the event contract follows the
[custom-card editor API](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/#graphical-card-configuration).
The single resource guards registration of
`sensor-bar-card-plus-feature-editor`, exposes it from Feature `getConfigElement`
and marks its discovery entry configurable. `getStubConfig()` remains entity-free.
There is no private Tile DOM dependency or second resource.

Current composition is Entity → Scale → Bar Appearance → Formatting. There are
no title/entity-row/name/icon/layout/height/Hero/Bottom/Inline controls. Palette,
animation, Needle, Baseline, built-in/reference marker and marker-label editors
remain absent; their raw configuration survives edits. There is no embedded
runtime preview or duplicate scale/extrema history; use HA's surrounding preview.
Feature-local CSS makes the shared grid fit narrow dialogs without modifying
standalone CSS or templates.

`tests/unit/feature-editor.spec.mjs` covers guarded source/dist registration,
inheritance/override/required-entity UX, picker events, raw preservation, Scale
part ownership, shared template reuse, arrival orders, echoes, disconnect and
source/dist picker/fallback parity. `tests/visual/feature-editor.spec.js` covers
public opening, entity state, shared controls, raw preservation, focus through
echoes/structural changes, late picker loading, narrow containment and two new
Feature editor screenshots. Existing standalone HTML matrices and snapshots,
and Card Feature runtime tests/snapshots, remain regression gates. These are
public-contract harness tests; live HA editor acceptance still needs manual
testing in an installation.

## Recommended next boundary

The second host validates the shared-section architecture, including different
source and persistence policies without changing the context. There is no new
prerequisite exposed by this foundation. Extract Segments and Gradient Stops
next, with characterization of drafts, validation, focus, array ordering and
unknown row metadata before composing them into the Feature host. Their shared
mutation paths must honor Feature patch-only preservation rather than assume
standalone cleanup. Keep the small context and add a lifecycle capability only
if those stateful sections demonstrate a concrete need. Phase 3D does not start
that extraction.
