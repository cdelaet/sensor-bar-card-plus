# Shared editor infrastructure and sections (Phases 3A–3G)

The shipped standalone host remains `src/editor/SensorBarCardPlusEditor.js`.
It uses the same HTMLElement, shadow DOM, string templates and delegated events.
Phase 3D adds a separate Card Feature editor host without changing the
standalone host or its persistence policy. Phase 3E shares the two stateful
palette sections between these hosts; their persistence policies remain distinct.
Phase 3F shares Needle/Baseline while keeping destructive editing policy confined
to the standalone host. Phase 3G shares Target controls, sources and label editing
with distinct standalone/Feature persistence.

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

`setConfig`, non-palette/non-Baseline/non-Target draft maps, config-echo handling, focus restoration, scheduling,
picker synchronization, disclosure state, section composition and delegated event
lifecycle remain in the host. Generic effective inheritance/source readers, source
canonicalization, non-palette array mutation/validation and `_applyScopedMutation` (including
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
  remove explicit defaults. No inactive palette, animation, Needle or marker field is
  rewritten by an unrelated edit.
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
only entity/picker/color-control/palette structure changes rebuild DOM, restoring focus
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

Current composition is Entity → Scale → Bar Appearance → applicable Segments
or Gradient Stops → Needle → Baseline → Formatting. There are no title/entity-row/name/icon/layout/
height/Hero/Bottom/Inline controls. Animation, Needle, Baseline, built-in/reference
marker and marker-label editors remain absent; their raw configuration survives edits. There is no embedded
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

## Stateful palettes (Phase 3E)

`src/editor/sections/segments.js` and `gradient-stops.js` contain the exact root
and entity control templates previously embedded in `_render`, plus palette
readers, summaries, drafts, validation, previews and commit behavior. Both hosts
instantiate the same `SegmentsSection` and `GradientStopsSection` classes.
Standalone supplies its original disclosure wrapper to `render(scope, renderGroup)`;
Feature uses the same root content without the disclosure. Palettes remain
siblings of Bar Appearance; its Baseline/Needle child callback is unchanged.
Feature composes Segments for `bands`, `soft_bands`, `band_gradient`, Gradient
Stops for `gradient`, and neither for `solid`. Switching style retains both arrays.

### Original implementation map and ownership

The original `SensorBarCardPlusEditor.js` contained all the following responsibilities:

| Area | Segment entry points/state | Gradient Stop entry points/state |
|---|---|---|
| Scope/storage/display | `_getSegmentsValue`, `_getScopedSegmentsValue`, `_getStoredScopedSegments`, `_getFallbackSegments`, `_getDefaultSegments`, `_hasSegmentsOverride`, `_getSegmentsSummary`, `_isSegmentFillStyle` | `_getGradientStopsValue`, `_getScopedGradientStopsValue`, `_getStoredScopedGradientStops`, `_getFallbackGradientStops`, `_getDefaultGradientStops`, `_hasGradientStopsOverride`, `_getGradientStopsSummary` |
| Draft identity | `_getSegmentsScopeKey`, `_getSegmentBoundaryTextKey`; `_segmentDrafts`, `_segmentUiRows`, `_segmentBoundaryTexts` | `_getGradientStopsDraftKey`, `_getGradientStopPosTextKey`; `_gradientStopsDrafts`, `_gradientStopsUiRows`, `_gradientStopPosTexts`, `_gradientStopValidationMessages` |
| Draft lifecycle | `_getSegmentDraftState`, `_createSegmentDraftState`, `_getNewSegmentDefaults`, `_getSegmentDraftColorDefault`, `_setSegmentDraftState`, `_setSegmentDraftField`, `_commitSegmentDraft` | `_getGradientStopsDraftState`, `_createGradientStopDraftState`, `_getNextSuggestedGradientStopPos`, `_getGradientStopDraftColorDefault`, `_setGradientStopsDraftState`, `_setGradientStopsDraftField`, `_commitGradientStopDraft` |
| Intermediate text | `_getSegmentBoundaryText`, `_setSegmentBoundaryText`, `_clearSegmentBoundaryText`, `_clearSegmentScopeTextState`, `_getSegmentsUiRows`, `_setSegmentsUiRows` | `_getGradientStopPosText`, `_setGradientStopPosText`, `_clearGradientStopPosText`, `_clearGradientStopScopeTextState`, `_getGradientStopsUiRows`, `_setGradientStopsUiRows` |
| Parsing/comparison | `_parseSegmentBoundaryInput`, `_parseSegmentBoundaryText`, `_formatSegmentBoundaryValue`, `_compareSegmentBoundaries`, `_normalizeSegmentForEditorComparison`, `_segmentsEqualForEditor`, `_sortSegmentsForEditor` | `_normalizeGradientStopPosValue`, `_sanitizeGradientStopsForEmit`, `_isDefaultGradientStops` |
| Validation/commit | `_buildSegmentValidationRows`, `_getSegmentRowValidationMessage`, `_getValidSegmentDraft`, `_canAddSegment`, `_getSegmentDraftValidationMessage`, `_commitSegmentBoundaryEdit` | `_getValidGradientDraftStop`, `_hasGradientStopDuplicate`, `_canAddGradientStop`, `_getGradientDraftValidationMessage`, `_commitGradientStopPosEdit` |
| Preview/DOM refresh | `_getSegmentPreviewBoundaryValue`, `_getSegmentPreviewRows`, `_buildEditorSegmentPreviewStyle`, `_getSegmentPreviewDomIds`, `_renderSegmentPreview`, `_refreshSegmentPreview`, `_getSegmentDomIds`, `_refreshSegmentUi` | `_buildGradientPreviewEffectiveStops`, `_buildEditorGradientPreviewStyle`, `_getGradientPreviewStyle`, `_renderGradientPreview`, `_getGradientPreviewDomIds`, `_refreshGradientDraftUi` |
| Standalone persistence | `_setScopedSegments`, `_clearSegmentsOverride`, `_setSegments` | `_setScopedGradientStops`, `_clearGradientStopsOverride`, `_setGradientStops` |
| Templates/events | `_render` root sections and entity override content; palette branches in `_handleClick`, `_handleInput`, `_handleChange`, `_handleKeydown`, `_handleFieldEvent` | Same host entry points, including CSS-color fallback routing |

There were no reorder controls. These entries now delegate to the shared section
except `_setScopedSegments`/`_setScopedGradientStops`, whose original persistence
bodies remain standalone-owned. Override clearing moves with section state but
uses the host's scoped mutation/cleanup path. All 84 extracted private methods
remain explicit compatibility delegates. The seven state maps have compatibility
getters; shared controllers own/reset the maps.

### Minimal stateful interface

The established `read`, `mutate`, `source`, `setSource` context **does not change**.
Scale, Formatting and Bar are unaffected. Each palette additionally receives:

- A UI boundary `{ root(), render(), focus(selector) }`: access its shadow-root
  controls, request host-owned structural rendering, and queue focus for Add.
- An array adapter `write(scope, displayRows, options, operation)`. Operations
  are exactly `{ type: 'edit', index, field, value }`, `{ type: 'add', item }` and
  `{ type: 'remove', index }`. These express user intent rather than asking the
  Feature to persist a sanitized display array.
- The Feature adapter additionally supplies `rows(scope, section)` for raw-order
  display and `patchOnly: true` for strict commit validation/raw-index duplicate
  checks. No complete host or generic form framework crosses this boundary.

`src/editor/shared/palette-section.js` shares delegated event decoding for the
root/entity variants, keyboard/Add/remove routing and color edit intent. It
contains no configuration emission or whole-config cleanup. UI IDs, index data
attributes, error strings and exact standalone template whitespace are retained.

### Persistence and coordinate distinctions

Standalone still sorts/canonicalizes Gradient Stops, filters invalid entries,
trims colors, removes default/<2-stop arrays, deletes legacy keys and prunes the
bar. Segment boundary/add/remove commits sort; color commits preserve UI order;
empty/default segments remove overrides and aliases. Whole-config cleanup and
its normalized-semantics guard remain host-owned and unchanged.

`src/feature/feature-editor-palettes.js` instead starts from the authoritative
raw array and patches **only** the selected field. Adds append the new known-schema
item; removes splice exactly the selected index. Every other item retains its
original value and order, including invalid/unrecognized rows and percentage
strings. Edited-item unknown primitives, nested objects, arrays and explicit
`undefined` members survive. Immutable config helpers preserve these values;
JSON equality is never used to reconstruct a payload. Existing palette aliases
stay at their authoritative stored path; unrelated/inactive aliases and bar
siblings survive. Displayed fallback palettes are persisted only on an explicit
palette operation. Opening never materializes an omitted Segment `to`.

Segment numeric boundaries remain active-Scale values at runtime; percentage
strings/objects remain percentages. Gradient numeric and percentage-string
positions both remain percentage coordinates. Parsing is still separate.
Existing standalone validation/preview comparison behavior remains unchanged;
it is not a replacement for runtime scale resolution. Feature display handles
existing fixed/value/percent objects without rewriting their raw representation.
The pre-existing standalone fixed-object display exception remains outside this
extraction. No entity-backed boundary UI or new Segment CSS-color alternative
is introduced; Segment color stays native, Gradient color retains its fallback.

### Session, drafts, focus and browser layout

Scope/index keys, draft suggestions, intermediate text maps and Escape reset
semantics are unchanged. Ordinary rerenders/config echoes retain local drafts.
Foreign standalone config replacement resets its maps at the original boundary;
foreign Feature config replacement resets its controllers without emitting.
Intermediate Feature boundary edits remain local until validation succeeds;
standalone retains its existing invalid-boundary commit behavior. Gradient
positions reject invalid/out-of-range/duplicate values in both hosts; the Feature
checks duplicates by original raw index before any display-only sorting.
Structural Feature add/remove clears obsolete index text state. There is no new
persistent row ID scheme or implicit reorder.

Hosts own focus and listener lifetime. Standalone retains `_queuePostRenderFocus`
and `_applyPendingFocus`; Feature retains `_captureFocus` and indexed restoration. Native drafts update hints
and previews without replacing focused controls. Click Add queues draft focus.
Standalone Enter commits still do not queue focus; the existing Gradient Enter
focus-loss quirk remains characterized. Feature restores the exact indexed row
where its host rebuilds structure. CSS-color fallbacks remain mounted until blur.
Feature-only container CSS wraps existing controls below 320px; standalone CSS
and viewport breakpoints are unchanged. No observers/global state are added.

### Validation coverage

Before extraction, additional source/dist characterization covered omitted ends,
invalid Segment commits, Gradient normalization/order and root/entity draft echoes;
the root palette browser baselines were captured. Existing extensive tests cover
percent/numeric boundaries, overlap, add/remove, previews, scoped cleanup and
Enter behavior. Four standalone root/override palette screenshots now protect
this stateful seam. Expanded exact HTML parity adds omitted ends, percentage
objects, unsorted palettes, invalid stops, legacy paths, empty arrays and entity
overrides to the original 20/32/80-case matrices (96 combinations).

Feature unit/browser coverage checks selected-field metadata, nested arrays and
undefined members, raw order, append/remove, inactive palettes, omitted ends,
fixed/value objects, legacy paths, invalid drafts, duplicates, echo stability,
shared controller identity and conditional composition. Browser tests run both
source/dist at 360px and 240px, checking real focus, CSS colors, previews and
containment. Four new Feature palette screenshots supplement two whole-editor
screenshots, intentionally updated to include the newly available palette section.
All standalone and runtime snapshot baselines remain unchanged. Source/dist and
picker/fallback parity remain required. Live HA acceptance remains a manual step.

Final Phase 3E validation: 1,134 unit tests and 218 Playwright tests pass.
The standalone host shrinks from 6,657 to 5,400 lines; the Feature host grows
from 228 to 297 lines. The normal dist build and `git diff --check` pass.

## Needle and Baseline (Phase 3F)

`src/editor/sections/needle.js` and `baseline.js` own both hosts' exact control
implementations. They are section controllers like the stateful palettes, with
no full editor instance or private host-method access. Needle has no draft map;
Baseline owns `_baselineColorDrafts`, keyed by root/entity scope and numeric side.
Standalone retains a compatibility getter and resets this map at the same foreign
configuration boundary. Feature resets it on foreign replacement, retaining it
through ordinary updates and emitted-config echoes.

### Exact original implementation map

| Responsibility | Needle entry points | Baseline entry points |
|---|---|---|
| Raw/effective reading | `_getScopedNeedleConfig`, `_getEffectiveScopedNeedleConfig`, `_getNeedleValue` | `_getBaselineResolvableValue`, `_getEffectiveBaselineResolvableValue`, `_getBaselineMode`, `_getEffectiveBaselineMode`, `_getBaselineDirectionalColorValue`, `_getEffectiveBaselineDirectionalColorValue` |
| Detection/summary | `_hasNeedleOverride`, `_getNeedleSummary` | `_hasBaselineOverride`, `_getBaselineOverrideSummary`, `_getCardBaselineSummary` |
| Editing/clearing | `_setNeedle`, `_setScopedNeedleMode`, `_setScopedNeedleColor`, `_removeScopedNeedle` | `_setBaselineMode`, `_setBaselineResolvablePart`, `_setBaselineDirectionalColor`, `_isBaselineDirectionalColorEnabled`, `_setBaselineDirectionalColorEnabled`, `_clearBaselineOverride`, `_removeBaseline` |
| Drafts | None | `_getBaselineColorDraftKey`, `_setBaselineColorDraft`, `_getBaselineColorDraft`; `_baselineColorDrafts` |
| Rendering | `_render` root Bar Appearance inline controls and entity Needle override content | `_render` root Baseline card group nested within Bar Appearance and entity Baseline override content |
| Events | `_handleFieldEvent`: root `bar-needle-*`, entity `entity-needle-*` | `_handleFieldEvent`: root/entity mode, fallback, entity-source, side colors/toggles; `_handleClick`: `remove-baseline` |
| Host infrastructure retained | Generic config paths, `_applyScopedMutation`, `_applyUserConfig`, `_emitConfigChanged`, `_cleanupNeedleForEmit`, focus/listener/disclosure lifecycle | Same host lifecycle plus `_getResolvablePartsFromTarget`, `_getResolvableScopedValue`, `_getEffectiveResolvableScopedValue`, source canonicalization and `_cleanupBaselineForEmit` |

All 28 original section private entry points remain thin delegates. The old
Baseline source-writing body stays in standalone as `_persistBaselineSourcePart`.
Source getters/setters in the section call `source(scope, 'baseline', effective)`
and `setSource(scope, 'baseline', part, value)`; the host routes this key to its
existing generic readers and the preserved writer. Scale's paths and behavior
are unchanged. The shared `hasExplicitOverrideValue`/`hasResolvableOverride`
primitives are extracted from the original host verbatim with compatibility
delegates, including the original fixed/entity-only override test.

Standalone keeps the exact Baseline-before-Needle nested Bar child templates,
whitespace, IDs/classes, labels/help text, source controls, color helpers,
summaries, disclosure nesting and field ordering. Feature renders these same
root control templates in separate Needle/Baseline sections after its palette.
No extra Bar child hook, new source editor, percentage control, observer or form
framework is introduced. Host picker synchronization extends to the existing
Baseline entity-source control.

### Host mutation policy, not duplicated controls

The four-operation section context is **unchanged**. Existing mutation options
carry two narrow field intents:

- `needleEdit: { field: 'mode' | 'color', value }`
- `baselineEdit: { path, value }` for enabled/side-color fields

They describe ownership for host-specific persistence. There is no new context
operation or arbitrary policy framework. Scale/Formatting/Bar/palette sections
continue to use their existing contracts.

The shared Needle mode mutation contains **no Baseline deletion**. Standalone
`_applySectionMutation` wraps an enabling-mode mutation with the exact historical
side effect formerly embedded in `_setScopedNeedleMode`: it removes the entire
**local** Baseline when `enabled === true`, or when enabled is not false and the
existing editor reader has a fixed/entity source. Root edits affect only root;
entity edits affect only that entity, leaving root/siblings untouched. Disabled
Baselines survive. Inherit/disable mode requests and color changes do not trigger
this deletion. A percentage-only auto Baseline also survives because the existing
editor override test omits percent; that quirk is intentionally preserved.
Standalone still rebuilds known Needle fields, canonicalizes booleans on emission,
removes root disabled/default settings and performs its unchanged whole-config
cleanup. Enabling Needle may remove an explicitly enabled but unresolved Baseline:
this is the historical editor policy, not the runtime visibility rule.

Feature uses `src/feature/feature-editor-needle-baseline.js` to patch only the
owned Needle field or Baseline field. Enabling/disabling Needle preserves **all**
Baseline data; enabling/disabling/configuring Baseline preserves **all** Needle
data. Colors retain nested side metadata and the opposite side. Unknown Needle,
Baseline, source, root and bar metadata, palettes, markers and inactive settings
survive. Clear/default Needle color owns only `color`. Explicit Remove Baseline
owns the whole Baseline; it does not touch Needle. Neither control is disabled
because the other is configured.

### Representation and source preservation

Feature opening, context changes and unrelated edits preserve `needle: true`/
`false` exactly. Mode edits keep an existing boolean boolean; expanded objects
patch only `show`. Enabling an absent Needle writes `true`; disabling an absent
Needle is a no-op. Setting a custom color on a boolean minimally creates
`{ show: <previous boolean>, color }`, including disabled false. Expanded objects
keep unknown siblings, show state and nested metadata. A color on an absent
Needle creates `{ color }` without implicitly enabling it. Default white removes
only the owned color field. These storage rules intentionally avoid standalone's
canonical rebuild/deletion behavior while using the same shared controls.

`src/feature/feature-editor-config.js` now shares one internal raw source-component
patcher between Scale and Baseline. It preserves unknown metadata and the other
source component. Existing `value` fallback syntax stays `value`; explicit edits
of a stored fixed part use `fixed`, and clearing the fixed control owns both
fixed/value aliases. Other inactive aliases/metadata remain untouched. Entity
edits own only `entity`. Scalar numeric or entity `baseline.at` forms remain
scalar when that scalar's part is edited; adding another part minimally promotes
to an object retaining the original component. Legacy numeric top-level Baseline
stays scalar for fallback edits and promotes to `{ at: <previous source>, ... }`
only when a new enabled/side-color/entity field requires an object. Opening never
promotes it. Invalid numeric fallback input follows the existing source-control
clear semantics and never emits malformed numeric text.

Fallback means the currently supported `fixed`/`value` component alongside an
entity. A literal unknown `fallback` property is preserved as metadata; the current
normalizer does not consume it. No new fallback semantics are added.

Percentage `baseline.at` strings/objects are readable through the existing
normalizer and display a blank numeric fallback. No percentage control is added.
Unrelated fields leave the percentage representation untouched. Adding an entity
or numeric fallback to a scalar percentage minimally promotes it to
`{ percent: <original percent>, <edited component> }`, retaining its percentage
semantics. Object percentages and metadata survive component edits/clears.
Standalone retains its existing source commit behavior, which reconstructs
fixed/entity parts and can drop percentage/source metadata on a source edit.

### Runtime precedence and lifecycle

The runtime is unchanged. `buildRowViewModel` resolves an enabled/auto Baseline
source; finite Baseline coordinates suppress `getNeedleState`. If disabled or
unresolved, Baseline does not suppress Needle. Configuration presence by itself
is insufficient. The Feature-only helper states:

> An active, resolved Baseline takes visual precedence over Needle.

Controls remain independently editable. Ordinary value edits patch mounted
controls and retain focus/selection; structural CSS-color changes use existing
capture/restoration and defer fallback removal until blur. Both hosts retain the
same directional-color draft restoration on toggle/echo. Foreign Feature config
replacement resets its drafts without emission. HA picker `value-changed` is
still authoritative, including clear; internal input/change events are ignored.
Context/hass-only changes never alter raw Needle/Baseline data. No animation or
runtime observers/lifecycle are changed.

### Regression evidence

Before extraction, 18 source/dist characterization cases protected boolean/object
reading/inheritance, local destructive policy (including disabled/percentage
exceptions), root disabled color behavior, canonical source writes, percent reads,
and color draft echoes. Four root/entity Needle/Baseline browser screenshots were
captured before moving templates. The 406 pre-existing standalone editor tests
remain required. The HTML matrix expands from 96 to 128 cases for booleans,
colors, fixed/entity/value/percent sources, metadata, legacy scalars, enabled/
disabled/null settings and entity overrides, retaining all old matrices.

Feature unit tests cover field ownership, metadata including arrays/undefined,
boolean/object transitions, source component/alias/percentage preservation,
legacy promotion, independent enable/disable, explicit removal, picker events,
source/dist shared-controller identity and template/picker parity. A test feeds
edited config into the unchanged runtime model to verify resolved Baseline
precedence and Needle restoration when resolution fails. Browser tests run
source/dist at 360px/240px with real focus/echo, independent edits, source/color
controls, percentage config and HA picker events. Four new Feature screenshots
protect these controls; two whole-Feature baselines intentionally add the new
sections. All standalone and runtime snapshot baselines remain unchanged.

Final Phase 3F validation passes 1,219 unit tests and 226 Playwright tests.
The 20/32/80/96-case existing HTML matrices and expanded 128-case matrix pass,
including source/dist and picker/fallback environments. The standalone host
shrinks from 5,400 to 4,970 lines; the Feature host grows from 297 to 333 lines.
The normal dist build and `git diff --check` pass.

### Phase 3F next boundary (completed by Phase 3G)

Extract **Target alone first**. Baseline/Needle extraction revealed that generic
source policy and raw representation preservation are the main boundary for the
next source-backed section. Target additionally owns marker shape/direction,
labels and above-target fill drafts/aliases, while Peak/Floor own history/reset
controls rather than the same source editor. Target deserves its own cohesive
characterization/extraction before Peak/Floor; grouping all three now would add
unrelated marker-label and reset machinery to one phase. No prerequisite framework
or runtime redesign was revealed. Do not start that extraction in Phase 3F.

## Target (Phase 3G)

### Exact pre-extraction method/state map

| Responsibility | Original standalone methods/state |
|---|---|
| Source | `_getTargetResolvableValue`, `_getEffectiveTargetResolvableValue`, `_setTargetResolvablePart`; generic `_getResolvablePartsFromTarget`, `_getResolvableScopedValue`, `_getEffectiveResolvableScopedValue`, `_setCanonicalResolvablePart` with canonical `target.at`, legacy scalar `target` and `target_entity` |
| Enabled/inheritance | `_getTargetMode`, `_getEffectiveTargetMode`, `_setTargetMode`, `_hasTargetOverride`, `_clearTargetOverride` |
| Shape | `_getTargetShapeValue`, `_hasTargetShape`, `_getEffectiveTargetShapeValue`, `_setTargetShape` |
| Color | `_getTargetColorValue`, `_getEffectiveTargetColorValue`, `_hasCustomTargetColor`, `_setTargetColor`; legacy `target_color` |
| Label show/precision compatibility | `_getTargetLabelShowValue`, `_getEffectiveTargetLabelShowValue`, `_setTargetLabelShow`, `_getTargetLabelDecimalValue`, `_getEffectiveTargetLabelDecimalValue`, `_setTargetLabelDecimal`; legacy `show_target_label`, `label.decimal` |
| Built-in label model/control/edit | `_getBuiltinMarkerLabelOptions`, `_renderBuiltinMarkerLabelControls`, `_setBuiltinMarkerLabelField` (also used by Peak/Floor); shared `renderBuiltinMarkerLabelControls` |
| Direction | `_getEffectiveMarkerDirection`, `_setMarkerDirection` (also used by Peak/Floor); canonical `direction`, legacy marker direction read |
| Exceeded fill | `_getTargetAboveFillColorValue`, `_getEffectiveTargetAboveFillColorValue`, `_setTargetAboveFillColor`, `_isTargetAboveFillEnabled`, `_setTargetAboveFillEnabled`; legacy `above_target_color` |
| Drafts | `_targetAboveFillDrafts`, `_getTargetAboveFillDraftKey`, `_setTargetAboveFillDraft`, `_getTargetAboveFillDraft`; root/entity keys, reset on foreign configuration replacement |
| Summaries | `_getCardTargetMarkerSummary`, `_getTargetOverrideSummary` |
| Rendering | `_render`: root `marker-target` card disclosure within Markers; entity `target` override disclosure; source/color/shape/direction/built-in label/exceeded-fill controls |
| Routing | `_handleFieldEvent`: root `target-*`, `target-entity-source`, entity `entity-target-*`, built-in label field decoding |
| Host retained | `_cleanupTargetForEmit`, whole-config cleanup/emission, scoped mutation, generic source canonicalization, picker synchronization, disclosure state, listener/focus/render/echo lifecycle |

The authoritative options are **diamond/triangle** and **inward/outward** (default
inward), not above/below direction options. Runtime Target occupies its existing
below lane; this phase changes no lane geometry. Label controls use `show`,
`text`, `show_value`, `show_unit`, and `precision` with legacy `decimal` read support.
Hidden show, empty text, value/unit true and primary precision inheritance remain
the defaults. Literal label `value`/`unit` are not these controls' canonical fields;
raw unsupported metadata, including independent label entity, is preserved by
Feature rather than gaining UI or semantics. No Target label draft map exists.

### Shared section and the unchanged seam

`src/editor/sections/target.js` owns the 32 Target-specific methods above, the
exceeded-fill draft map, exact root/entity templates and decoded field handler.
Standalone retains all 32 methods as thin delegates and a compatibility draft-map
getter. Root disclosure location and entity grouping remain host composition.
The Feature reuses the exact root template in its own Target section after
Baseline and before Formatting; it has no copied Target handlers/templates.

`src/editor/shared/editor-marker-controls.js` extracts the existing built-in label
option/edit algorithm and direction helpers, preserving the same delegates for
Peak/Floor callers. Their sections are not extracted. The existing shared label,
source and color rendering helpers are reused. A narrowly extracted
`getEffectiveDisplayValue` primitive also keeps the standalone compatibility
method. The four operations remain `read`, `mutate`, `source`, `setSource`.
`targetEdit` and `markerEdit` mutation options identify field ownership for the
Feature adapter; no new context operation, generic draft framework or editor is
introduced. Standalone routes Target source writes to its existing generic writer.

### Persistence and representation

Standalone retains cleanup/default removal, alias canonicalization, inheritance,
summary text and the exact historical override-clear field list. Target source
edits reconstruct known fixed/entity/percent parts, preserving percentage but
removing unknown source metadata as before. Legacy label decimal compatibility
methods remain, while the actual label controls edit precision. No standalone
behavior or runtime code changes.

`src/feature/feature-editor-target.js` patches only the selected Target field.
Color, shape, mode, label and exceeded-fill edits preserve source data, unknown
Target siblings, nested label/source/exceeded-fill metadata, Baseline, Needle,
palette arrays, animation and all YAML-only markers. Edits of owned aliases may
clear only those aliases: color owns `target_color`, exceeded fill owns
`above_target_color`, show owns `show_target_label`, precision owns `decimal`.
Other aliases/defaults stay raw. Label text whitespace and invalid precision use
the existing normalization/validation algorithm. Feature stores explicit label
booleans without applying standalone default cleanup, and never rebuilds a label
from its normalized model. There is no independent Target label entity control.

`feature-editor-config.js` extends the existing raw source-component patcher used
by Scale/Baseline. Scalar `target.at` stays scalar when editing its own component;
adding another part minimally promotes it and retains its original fixed/entity/
percent component. Existing `value` syntax remains `value`; clearing fixed owns
fixed/value only. Unknown metadata and the other source component survive.
Legacy scalar Target and `target_entity` survive source edits in their existing
representation until another Target field requires object syntax. That promotion
retains both source components, leaving unrelated aliases untouched. Literal
`fallback` remains unknown metadata; supported numeric fallback is fixed/value.

Percentage `target.at` strings/objects load with blank numeric fallback, preserve
raw syntax on unrelated edits, and add no percentage control. Adding fixed/entity
to a scalar percentage creates `{ percent: <original>, <edited component> }`.
Opening never invents a source or materializes the parent entity.

### Drafts, lifecycle and runtime

Exceeded-fill color entered while disabled stays in the local section draft and
emits nothing. Toggle on restores that draft/effective color or black; toggle off
removes only the owned fill field/alias. Drafts survive echo and context changes;
foreign replacement resets stale drafts. Enabled color text follows the existing
CSS-color editing behavior; no new validator or color semantics is introduced.
Mounted Feature controls synchronize values/checks without replacing ordinary
focused inputs. Structural CSS-color transitions keep the existing deferral and
focus restoration. HA picker value-changed events remain authoritative, including
clear, while internal input/change events are ignored. Both hosts retain their
existing lifecycle; no new observers, animation or global state.

Target exceeded fill and Baseline side colors remain independently stored. The
runtime owns paint precedence, not the editor. Target edits preserve Baseline and
Needle; their edits preserve Target, as do palette and other shared fields.

### Regression evidence

Before extraction, 18 new source/dist characterization tests protected Target
modes/defaults/inheritance, source canonicalization/percent/aliases, labels and
precision validation, exact override clearing, presentation defaults and
exceeded-fill drafts/echo. Root/entity Target screenshots were captured before
moving templates. All 406 pre-existing standalone editor tests remain required.
The expanded standalone HTML matrix has 160 cases and retains the older
20/32/80/96/128 matrices, across source/dist and picker/fallback environments.

Feature preservation tests assert whole raw config equality after owned edits,
including nested arrays and own undefined metadata, source forms, aliases, label
fields, legacy promotion and disabled drafts. Browser cases run source/dist at
360px and 240px, checking config echoes, focused node identity, picker behavior,
percentage preservation and combinations with Baseline/Needle/palettes. Two new
Target Feature screenshots protect wide/narrow layouts. The two whole-Feature
editor screenshots intentionally include Target; standalone/runtime baselines
remain unchanged.

Final Phase 3G validation passes 1,304 unit tests and 233 Playwright tests.
All 20/32/80/96/128/160-case HTML matrices and Feature source/dist/picker/fallback
checks pass. The standalone host shrinks from 4,970 to 4,487 lines; the Feature
host grows from 333 to 358 lines. The normal dist build and `git diff --check` pass.

## Phase 3G next boundary (completed by Phase 3H)

Extract **Peak + Floor together** next. They share extremum enabled/color/reset,
built-in label and direction controls with closely related history/reset semantics.
The reusable label/direction helpers now remove their main common-control
prerequisite. Reference markers have stateful arrays, capacity/source/label-only
anchors and independent label entities, making them a separate larger boundary.
Animation and percentage controls should remain a later deliberate capability-gap
phase. No new prerequisite framework was revealed. Do not start the next phase.

## Peak + Floor (Phase 3H)

### Exact pre-extraction method/state map

| Responsibility | Original standalone methods/state |
|---|---|
| Peak raw/effective enabled and color | `_getScopedPeakConfig`, `_getEffectiveScopedPeakConfig`; canonical `peak`, legacy `peak_marker`, `show_peak`, `peak_color` |
| Floor raw/effective enabled and color | `_getScopedFloorConfig`, `_getEffectiveScopedFloorConfig`; canonical `floor` |
| Peak detection/clear/summary | `_hasPeakOverride`, `_clearPeakOverride`, `_getPeakSummary` |
| Floor/common detection/clear/summary | `_hasExtremumOverride`, `_clearFloorOverride`, `_getFloorSummary` |
| Enabled compatibility/mutation | `_setScopedPeakEnabled`, `_setScopedExtremumEnabled`, `_setPeakShow`, `_getPeakShowValue` |
| Color mutation | `_setScopedPeakColor`, `_setScopedExtremumColor` |
| Extras/inheritance/reset summary | `_getScopedMarkerExtras`, `_getEffectiveMarkerExtras`, `_getMarkerResetSummary` |
| Reset write | `_setScopedExtremumReset`; shared `renderResetOptions` already in `editor-controls.js` |
| Legacy label compatibility | `_setScopedExtremumLabelShow`, `_setScopedExtremumLabelDecimal` |
| Actual label and direction controls | `_getBuiltinMarkerLabelOptions`, `_renderBuiltinMarkerLabelControls`, `_setBuiltinMarkerLabelField`, `_getEffectiveMarkerDirection`, `_setMarkerDirection`; already shared in `editor-marker-controls.js` |
| Rendering/routing | `_render` root `marker-peak`/`marker-floor` disclosures within Markers and per-entity Peak/Floor overrides; `_handleFieldEvent` root `peak-*`/`floor-*`, entity `entity-peak-*`/`entity-floor-*` and built-in label dispatch |
| Host-owned cleanup/emission | `_cleanupPeakForEmit`, `_cleanupFloorForEmit`, `_cleanBuiltinMarkerLabelForEmit`, `_cleanupEditorEmittedConfig`, `_emitConfigChanged`, `_applyScopedMutation`, `_refreshDerivedEditorUi`; disclosure/focus/picker/config-echo lifecycle |
| Local state | No Peak/Floor reset, label or direction draft map. Native reset selects have no intermediate typed draft. Existing host focus/control values and disclosure state remain host-owned. No extrema/history state in the editor. |

### Actual reset schema and unchanged UI

Public `peak.reset` and `floor.reset` are **scalar strings**, not reset mode
objects. Defaults are `never`; duration strings are `1m`–`59m` and `1h`–`23h`.
Calendar presets are `quarterly`, `hourly`, `daily`, `weekly`, `monthly`, `yearly`.
`quarterly` means a quarter-hour boundary, not a quarter-year boundary. The
runtime uses local clock/calendar boundaries (weekly starts Monday). Its internal
`{ kind: 'duration', minutes/hours }` / `{ kind: 'calendar', unit }` /
`{ kind: 'never' }` parsing results are not saved configuration syntax.

Both hosts reuse the existing 89-option native select: never, six calendar
presets, 59 minute durations, 23 hour durations. There is no mode selector,
freeform duration input, calendar subform, reset validation message or reset draft
map to extract. The existing pure `isValidReset` predicate trims/lowercases,
accepts numeric minute/hour strings within those ranges (including leading zeros),
and rejects seconds, zero/out-of-range durations and other syntax. Invalid loaded
strings normalize to never at runtime; opening the editor does not rewrite them.

The historical standalone private reset setter is deliberately permissive:
it writes any trimmed lowercase string. The finite UI prevents malformed typing;
characterization retains this private-method quirk rather than changing behavior.
Feature additionally rejects invalid synthetic reset events with `isValidReset`,
without emission or history mutation. Empty clears only reset, never stays explicit
in Feature. Standalone removes root never and retains per-entity never; its Peak
reset setter also removes legacy Peak alias containers as before. Native input/
change duplicate events emit once by raw-config equality. Echo leaves mounted
focused inputs intact; foreign replacement synchronizes controls. No reset draft
or shared scheduling framework is introduced.

### One shared extremum section, genuine differences retained

`src/editor/sections/extrema.js` owns the 22 extremum-specific methods in the map,
one root and one entity template parameterized by Peak/Floor, and one decoded
field handler. Shared extras, reset, labels, direction and rendering have one
implementation. Peak-specific enabled/color/override readers and mutation
callbacks remain explicit because their alias precedence/cleanup differ. All 22
standalone entrypoints remain thin private delegates. Root/entity disclosure
placement, summaries, HTML whitespace, cleanup and emission remain unchanged.

Peak raw editor precedence is canonical Peak, then `peak_marker.show/color`,
then `show_peak`; an existing root `peak_marker` with no `show` selects disabled.
Color falls back to `peak_color`; default gray is omitted. Floor enabled/color
read only canonical Floor, default `#888888` (Peak's `#888` is the same color).
Peak own-override detection includes legacy aliases; Floor's detection uses the
canonical known fields. Direction for both can read legacy marker direction.
Existing clear behavior removes known canonical fields and the whole label/
legacy marker container while preserving unknown canonical siblings. Standalone
Peak enable/color setters carry effective color/enabled and clear aliases; Floor
retains its narrower canonical behavior. Existing emit cleanup differences,
including empty/null Floor reset removal, stay in the host.

Labels reuse `editor-marker-controls.js` and existing shared rendering without
copies: `show`, `text`, `show_value`, `show_unit`, `precision`, legacy `decimal`
reading. Default show is false; value/unit true; empty text and inherited primary
precision. Direction remains `inward`/`outward`, default inward. There is no
independent built-in label entity UI or new runtime semantics. No new reset helper
is warranted: the options renderer and pure validator already exist. The section
context still has exactly `read`, `mutate`, `source`, `setSource`; the narrow
`extremumEdit` option identifies ownership alongside existing `markerEdit`.

### Feature persistence and runtime separation

`src/feature/feature-editor-extrema.js` applies only the owned canonical field.
Unknown Peak/Floor siblings, nested label metadata, own undefined values/arrays,
the other extremum, Target/Baseline/Needle, palette order/inactive palettes,
reference markers, animation and root metadata survive. Explicit enabled/label
booleans and inward direction stay explicit; Feature never runs standalone emit
cleanup. Label precision owns legacy decimal removal; other label fields do not.

Raw reset strings (including casing/leading zeros) remain unchanged on unrelated
edits. Unsupported loaded reset objects and all their metadata also survive those
edits. Because the actual reset schema is scalar and there are no supported nested
reset controls, editing reset owns the **entire reset value** and replaces an
unsupported object with a valid string. No object subfield is invented or silently
canonicalized on open.

Peak enabled owns `show_peak` removal and synchronizes only existing
`peak_marker.show` so the shared legacy reader still displays the selected state;
other legacy marker fields survive. Peak color owns `peak_color` and
`peak_marker.color` removal only. Reset/label/direction edits leave these aliases
untouched. Floor edits own only their canonical fields. Neither extremum is made
mutually exclusive; disabling one preserves all config for the other.

Feature composes both shared templates after Target and before Formatting. It
extends existing value/check synchronization and CSS-color structure detection;
no new lifecycle, observer, polling, global state, runtime preview or history API
is introduced. The adapter imports only the pure reset-validation predicate,
not extrema-update/reset-history APIs. Runtime per-instance Peak/Floor history,
reset semantics and config-replacement behavior are unchanged.

### Coverage and next boundary

Before extraction, 22 source/dist characterization tests protected both extrema,
root/entity inheritance, override detection/clear/summaries, color/defaults,
labels/precision/direction, all presets and boundary/invalid resets, aliases,
unsupported objects and reset setter quirks. Four new standalone root/entity
screenshots were captured before extraction and retained unchanged, with native
reset keyboard/focus and label edit/echo checks.

Feature unit coverage asserts complete raw config equality after owned edits,
source/dist controller/template identity, picker/fallback parity, all 89 presets,
boundaries/invalid synthetic events, aliases, unknown reset/label metadata,
independence and cross-feature preservation. Browser tests exercise source/dist
at 360px/240px, default/enable/disable, CSS/native color, both directions, labels,
reset presets/boundaries/invalid events, keyboard/focus/echo and foreign replacement.
Four new Feature section screenshots protect Peak/Floor wide/narrow presentation;
whole-Feature screenshots intentionally include these sections. Existing standalone
and runtime baselines must remain unchanged.

Feature capabilities are Entity, Scale, Bar Appearance, Segments, Gradient Stops,
Needle, Baseline, Target, Peak, Floor, Formatting. `bar.animated` and reference
markers remain YAML-only; percentage Target/Baseline controls stay deferred.

Recommend **Phase 3I — Reference markers** next. Shared labels/direction/extrema
now have the required separation; no prerequisite framework or runtime-history
change is needed. Reference-marker arrays, sources, label-only anchors and
independent label entities deserve their own characterization/extraction phase.
Do not start that next phase as part of Phase 3H.

Final Phase 3H validation passes **1,405 unit tests** and **241 Playwright tests**
(22 new standalone characterization tests, 79 Feature unit tests, two standalone
browser cases and six Feature browser cases). All 406 original standalone editor
unit tests pass. The existing 20/32/80/96/128/160-case HTML matrices and expanded
192-case matrix match the pre-extraction fingerprints exactly, across source/dist
and picker/fallback environments; Feature template/control parity also passes.
Existing standalone runtime/editor and Card Feature runtime snapshots are
unchanged. Four new standalone screenshots remain identical to their captures
before extraction; four new Feature section screenshots pass. Only the two
whole-Feature editor screenshots intentionally change to include Peak/Floor.
The normal dist build and working/staged `git diff --check` pass. Standalone host:
4,487 → 3,939 lines; Feature host: 358 → 382 lines. No runtime source file changes.

## Reference Markers (Phase 3I)

### Exact pre-extraction method/state map

| Concern | Standalone method/state before extraction |
|---|---|
| Array/inheritance | `_hasMarkersOverride`, `_getGenericMarkers`, `_getGenericMarkersSummary`, `_setGenericMarkerList`; root list, entity list replacement, explicit empty override |
| UI identity | `_genericMarkerUiIds` Map, `_expandedGenericMarkerUiIds` Set, monotonic `_nextGenericMarkerUiId`; `_getGenericMarkerScopeKey`, `_getGenericMarkerUiIds`, `_resetGenericMarkerUiScope`, `_toggleGenericMarkerExpanded` |
| Row summary | `_getGenericMarkerSummary`, `_refreshGenericMarkerSummary`; lane, shape, source text; no separate graphical preview |
| Source read/write | `_getGenericMarkerSource`, `_setGenericMarkerSourceMode`, `_setGenericMarkerField` and its `atLeaf` closure; `_updateGenericMarker`; public anchor `at` |
| Rendering | `_renderGenericMarkersEditor`, root `generic-markers` card disclosure titled Reference markers and per-entity `markers` disclosure titled Reference markers; collapsible item headers, scope/index/UI-ID datasets |
| Actions | `_handleClick` inline add/remove/move-up/move-down/toggle blocks; add appends `{ at: { fixed: 50 } }`, expands new row; reorder moves array item and UI ID together; remove deletes selected ID/expansion |
| Field routing | `_getGenericMarkerScope`, `_handleFieldEvent` generic-marker branches plus `entity-markers-inherit`; text color suffix decoding; checkbox/input/change/value-changed host handling |
| Label | `_setGenericMarkerField`: show/text/show_value/show_unit/precision and independent entity; legacy decimal read; richer row-specific template, shared entity-source and color controls |
| Host lifecycle | `setConfig` clears identity/expansion on foreign replacement, not echo; `_render`, `_refreshDerivedEditorUi`, `_syncEntityPickers`, `_bindShadowListeners`; active ordinary controls remain mounted on nonstructural edits |
| Persistence | `_cleanupGenericMarkersForEmit` and `_cleanupEditorEmittedConfig` semantic-equivalence guard, `_setScopedValue`, `_removeScopedValue`, `_applyScopedMutation`, `_emitConfigChanged`; default removal/canonicalization stay standalone policy |

Rows use scope-local positional UI IDs (`marker-N`), never hashes of marker
content. Duplicate configurations remain separate rows. IDs move with reorder,
survive edits/echo, and disappear with removal; counter stays monotonic through
foreign replacement. There is no maximum editor list length or separate label/
source draft map. Active DOM inputs are the local text state. Inherited entity
lists are deep-copied when overridden; explicit empty lists clear inheritance.

The existing Source dropdown exposes Fixed, Entity, Entity with fixed fallback,
and Percentage. Percentage input has min/max 0/100 but the private setter accepts
out-of-range finite values; runtime validation supplies invalid-percentage feedback.
Percent persists as an `at: 'N%'` string. Runtime rejects object `at.percent`.
The old editor reader recognizes percent/entity strings and object fixed/entity,
but displays scalar numeric anchors and the runtime-supported object `value` alias
as blank fixed values. Keep that standalone quirk through extraction.

Source-mode changes replace scalar sources with their normal mode defaults;
object fixed/entity modes preserve unknown object keys. Choosing percent replaces
the whole anchor with `50%`. Numeric blanks/invalid input remove fixed, while
percent blanks/invalid input set at to null. Reference precision invalid/blank
input removes precision and decimal (unlike the built-in invalid-precision rule).
Lane defaults below, shape circle, direction inward, gray `#888888`, shape visible,
label hidden, value/raw unit visible, precision inherited. Six shapes are circle,
diamond, triangle, chevron, arrow, pin; directions are inward/outward. Generic
color already supports the shared CSS text fallback. Text collapses whitespace;
label entity trims and clears independently. `show_marker:false` retains the full
label-only anchor; it does not disable/remove the item.

Standalone emit cleanup drops explicit default presentation/label booleans,
normalizes fixed/entity source fields, removes label unit and canonicalizes decimal
into precision while preserving unknown keys. The whole-config equivalence guard
can reject cleanup for incomplete/invalid input. This policy must stay unchanged;
Feature must never apply cleanup or rebuild all rows from the display model.

### Shared section and host policies

`src/editor/sections/reference-markers.js` owns the exact row template, summaries,
array operations, source modes, field normalization, scope-local IDs and expansion.
It is a dedicated section, not a palette subclass or generic array framework.
The standalone host retains thin delegates for all 16 mapped private methods and
compatibility accessors for the three identity fields. Its root/entity disclosures,
picker synchronization, event wrappers, derived-UI refresh and emit cleanup remain
host responsibilities. `_cleanupGenericMarkersForEmit` remains standalone-only.

The context still has only `read`, `mutate`, `source`, `setSource`. Source keys
accept a narrow `{ type: 'reference-marker', marker/index }` descriptor; mutation
options carry an explicit `referenceMarkerEdit` operation. No fifth operation,
registry, global state, observer or runtime API is added. The standalone context
uses the historical reader/source setter and scoped mutation policy. Feature uses
`src/feature/feature-editor-reference-markers.js` for display and raw persistence.
Its source writer reuses the existing `patchSource` function from
`feature-editor-config.js`, applied relative to one marker so deletion need not
traverse an array. Source normalization never becomes an emitted list.

Feature ordinary field edits copy only the selected item's path. Untouched raw
rows retain object identity, duplicates and order. Add appends the existing
`{ at: { fixed: 50 } }` default; remove splices exactly one item; existing up/down
controls move complete objects and their UI IDs together. There is no editor
maximum; the runtime's four-per-lane occupancy/warnings remain authoritative.
Unknown root/item/source/label metadata and own `undefined` fields survive.

Unrelated edits preserve numeric, percentage, entity-string and object `at`
representations. Feature correctly displays numeric anchors and object `value`
aliases without altering the standalone reader quirk. Same-component scalar edits
stay scalar; adding another source component promotes minimally. Object source
edits preserve unknown keys and existing `value` aliases. Clear removes only the
owned component (fixed clear owns fixed/value). Fixed/entity mode conversion owns
the source's recognized components and retains object metadata. Selecting
Percentage intentionally replaces the whole anchor with `50%`: object percentage
syntax is invalid for Reference markers, so source-object metadata cannot remain
at that anchor after this explicit conversion. Marker/label metadata still stays.

`editor-marker-controls.js` shares only pure label-field normalization. Built-in
label inheritance/default/removal/invalid-precision behavior remains unchanged;
Reference markers retain their richer template and independent `label.entity`.
Text, entity, booleans and precision patch separately. Precision owns the legacy
decimal alias; blank/invalid precision clears both as before. Clearing label entity
removes only entity. `show_marker:false` remains a label-only anchor and leaves
labels, source and presentation intact; showing the glyph again does not destroy
label configuration. No independent entity control is added to built-in labels.

Feature composes the section after Floor and before Formatting, with narrow-host
container rules only in its host CSS. Ordinary edits, config echoes, hass/context
updates and validation drafts retain mounted controls. Structural add/remove/
reorder/source-mode/picker changes use existing render scheduling and restore
focus by stable UI ID, including row action buttons. Foreign config replacement
resets IDs/expansion and replaces stale input values; a monotonic ID counter keeps
old identities distinct. Feature ignores native blur/change events whose old row
ID no longer matches the current indexed item, preventing replacement/reorder
from writing stale values into another marker. Picker `value-changed` remains
authoritative, with independent anchor/label association, hass, allowCustomEntity
and accessible names. No parent entity is materialized by marker edits.

### Coverage and final Phase 3I result

Before extraction, 28 source/dist characterization tests and four root/entity
screenshots captured exact standalone behavior, including all source-reader
quirks, percentage modes, six shapes, both lanes/directions, richer labels,
identity/reorder, inheritance, invalid input and cleanup guards. The four new
standalone images compare unchanged after extraction. Two browser cases also
protect mounted inputs, keyboard/focus and identity/expansion through reorder.

Feature adds 71 unit tests for exact raw config equality, own undefined values,
untouched row identity, source forms/aliases, fields, labels/entities, label-only
anchors, add/remove/reorder, cross-section preservation, stale-event rejection,
picker association and source/dist whole-template parity. Eight source/dist
browser cases cover 360px/240px, source-mode focus, percent boundaries, local
invalid input, independent picker/text entities, replacement/echo, keyboard
disclosure and raw metadata preservation. Two new Feature section screenshots
protect both widths; only the two whole-Feature screenshots intentionally change
to insert Reference markers. Existing standalone editor/runtime and Feature
runtime snapshots remain unchanged. No runtime source is changed.

Final validation: **1,504 unit tests** and **251 Playwright tests**, exact
20/32/80/96/128/160/192-case standalone HTML parity and expanded **256-case**
Reference Marker parity, each spanning source/dist and picker/fallback. Normal
dist build and working/staged `git diff --check` pass. Standalone host shrinks
3,939 → **3,588 lines**; Feature host grows 382 → **409 lines**. Shared Reference
section: 437 lines; Feature raw adapter: 62 lines.

### Read-only capability-gap audit after Phase 3I

The audit compares the canonical tree in `configuration.md`, normalization and
resolution in `src/config`, `buildBarRenderModel`/paint helpers, the Feature
runtime's compact presentation and its composed section controls. Entity,
fixed/live Scale and fallbacks, fill style/color/solid fill, Segments, Gradient
Stops, Needle, Baseline, Target/exceeded fill, Peak/Floor/reset, all Reference
marker and label fields (including entity), and Formatting are now editable.
Inactive palettes and unsupported/unknown raw metadata stay preserved. Reference
percentages already have controls; Gradient Stop percentage literals are displayed
numerically by the raw adapter and can be edited, so neither is a new gap.

| Class | Remaining capability | Evidence and disposition |
|---|---|---|
| A — supported, expose | `bar.animated` | `normalizeBarConfig` and `buildBarRenderModel` consume it; Feature honors it with reduced motion and first-display suppression. Bar Appearance currently has no toggle. Add a canonical raw-field toggle. |
| A — supported, expose | `target.at` and `baseline.at` percentages | `normalizeStructuredResolvableValue(...allowPercent)` and resolution support strings and object percent components. Feature readers preserve percent, but section controls expose fixed/entity only. Add percentage read/edit/clear while preserving object metadata and existing fixed/entity components/precedence. |
| A — supported, expose | Omitted/null `bar.segments[].to` | `normalizeGaugeSegments` and rendering infer the next start or scale end. `_getSegmentRowValidationMessage` and `_getValidSegmentDraft` require both boundaries. Existing omitted ends survive unrelated edits but cannot be created/cleared through the UI, and block boundary validation. Allow an explicit automatic end, including drafts; infer effective validation/preview endpoints without persisting inferred values or reordering raw rows. |
| A — supported, expose | CSS color entry for direct paints | `renderColorInput` exposes text only for an already-loaded nonhex value; hex/default controls cannot enter CSS. Segments use native color inputs only, including drafts. Expose text entry from every starting state for bar, Needle, Baseline sides, Target/exceeded fill, Peak/Floor, Reference colors and Segment colors. Preserve raw strings and active text/focus. |
| B — runtime/presentation only | HA context/entity inheritance, host color/position, feature height/radius; compact label typography/lanes/degradation; automatic scale holding, motion timing and extrema history | Owned by HA or existing presentation/lifecycle rules. No new Feature editor controls; marker label configuration and reset policy are already exposed. |
| B — inappropriate for this surface | Standalone title/name/icon, multirow inheritance UI, `layout`/Hero/primary labels and hover promotion; Segment label metadata | The Feature renders a singular compact bar; it overrides rail height and does not render standalone row content or Segment labels. Preserve raw data without adding ineffective controls. |
| C — unsupported | Actions, reverse Scale, vertical orientation, symbolic/future Baseline endpoints, area aggregation, `entities` | Feature explicitly rejects entities or lacks the corresponding runtime behavior. Editor closure must not implement these. |
| C — unsupported | Built-in `label.entity`, custom marker `label.unit`, Reference object `at.percent`, entity-backed Segment boundaries, richer reset objects/durations outside the accepted presets | Current normalization/validation does not support them. Do not infer new controls from retained unknown fields. |
| C — incomplete color runtime support | Arbitrary CSS Gradient Stops and numeric color sampling for gradient/soft_bands/band_gradient solid-fill overrides | Ordinary Gradient Stops pass through `hexToRgb`; `getColor` samples RGB/hex, so CSS text support is not equivalent to runtime interpolation support. Direct bands, soft-band painting and band-gradient painting can pass CSS to the browser. Do not expand interpolation/sampling in editor closure; retain existing YAML/fallback behavior and describe hex requirements. |
| D — compatibility only | Flat Scale/color/fill/animation/Target/Peak/Formatting aliases, `severity`, top-level palettes, `segment_space`, source `value`, marker label `decimal` and older marker wrappers | Normalization/host adapters already read or preserve them. Canonical controls and narrow owned-alias cleanup suffice; no duplicate compatibility controls. |

Recommend **Phase 3J — Capability Gap Closure**, exactly four work items:

1. Add the Feature animation toggle, editing only `bar.animated`, with legacy
   precedence handled only when that field is explicitly edited.
2. Add Target/Baseline percentage editing/clear for supported scalar/object
   forms, preserving fixed/entity fallbacks and unknown source metadata. Reuse
   source controls and the existing four-operation context; do not copy Reference
   marker's string-only percentage conversion rule to these richer sources.
3. Add automatic Segment ends for existing rows and new drafts, runtime-consistent
   inferred validation/preview, raw omission on save and no sorting/reconstruction.
4. Add Feature CSS text entry for the direct-paint fields listed above, including
   Segment rows/drafts, with native hex controls retained. Keep Gradient Stops'
   effective paint/sampling limitations explicit; no renderer change.

Use narrow Feature policy flags/host adapters when shared controls need different
capabilities so standalone snapshots/behavior remain unchanged. Require raw
preservation, focus/echo, source/dist, narrow browser, runtime snapshot and full
suite validation. No further substantial extraction, generic framework, new
marker API or runtime feature is justified by this audit. **Phase 3J is recommended
only; none of these gaps is implemented in Phase 3I.**

## Capability Gap Closure (Phase 3J)

### Characterized boundary and implementation decision

Starting point: `feat/card-feature` at `f4a7fa4`, clean. Before production edits,
characterization covers animation default/alias/inheritance, Target/Baseline
percentage strings and objects/precedence, omitted/null/mixed Segment ends and
configured-order inference, CSS direct paints versus hex interpolation, and the
standalone controls/drafts/validation. A 288-case standalone HTML matrix was
captured before editing, retaining all earlier matrices.

Animation defaults true. Normalization uses local `bar.animated`, local flat
`animated`, inherited structured/flat animation, then true, with nullish fallback;
it does not coerce strings. Rendered animation uses its truthiness. Standalone
has no animation control. Target/Baseline accept percentage strings and source
objects with `percent`; resolution prefers numeric entity, then fixed/value, then
percentage of the current scale. Out-of-range YAML percentages are not rejected
by those runtime sources (positions are bounded for drawing); the new graphical
input uses the existing Reference 0–100 editing convention without changing YAML
runtime semantics. Reference object percentages remain unsupported.

Omitted/null Segment ends inherit the following valid configured row's start in
normalization. Remaining unresolved ends use the next sorted resolved start or
100% (Scale max) during rendering. Mixed active-scale/percentage coordinates are
supported; malformed/entity boundaries are skipped. Out-of-order rows can produce
reversed ranges: the editor must report that rather than reorder or rewrite them.
Standalone currently requires explicit ends and native Segment colors; common
color controls show text only for already-loaded nonhex values.

The shared sections opt into these extensions only when composed by the Feature
host. This keeps existing standalone controls, cleanup, inheritance and HTML
unchanged while sharing runtime semantics and implementation. No fifth context
operation or broad extraction is needed. The four approved gaps are the complete
scope; runtime paint/math, timing, geometry and all Class B/C/D items stay outside.

### Four shared extensions and Feature persistence

- Bar Appearance owns `getBarAnimatedValue`/`setBarAnimated` and the Animated
  checkbox. Feature opts in with `animation: true`; omitted/default-on does not
  emit or materialize a default. Off stores canonical false. On removes canonical
  animation unless a flat/inherited false needs an explicit true override. The
  flat alias remains raw; other bar/root fields are not rewritten.
- `renderScalePercentageInput` is extracted from the existing Reference markup
  byte-for-byte. Target/Baseline additionally use `renderMarkerPercentageControls`
  and `normalizeScalePercentageInput`; Feature opts in via `percentSources`.
  Existing fixed/entity component inputs remain visible to preserve mixed source
  semantics; the note explains entity → fixed → percentage precedence. Explicit
  Fixed/Entity/Entity-with-fallback/Percentage conversions use the same
  `setSource` operation, replacing only recognized source components. Initial
  fixed/percent values use the existing source value when available, otherwise 50.
  Scalar percentage anchors remain strings; object anchors retain unknown keys.
  Clear removes only percent; invalid/incomplete edits remain in section-local
  drafts. Unsupported raw forms survive opening and unrelated edits.
- Feature Segments opt into `autoEnds` through the existing palette adapter.
  Blank End displays Auto and deletes only the owned `to`; null survives untouched.
  `_resolveAutomaticEndRows` reuses `normalizeGaugeSegments`, `normalizeScaleConfig`,
  `getResolvedScale` and `getSegmentsForRendering` for validation/preview, including
  current dynamic Scale. Temporary index labels associate resolved/sorted preview
  rows with raw rows and never persist. Explicit/automatic edits preserve color,
  unknown row metadata, raw order and other row identities. New drafts can omit
  End; malformed, duplicate, reversed and overlapping ranges stay local/reported.
- `renderColorInput` has a Feature `cssText` opt-in: picker plus always-available
  text, from default/hex/nonhex states. `normalizeEditorColorValue` preserves
  nonempty raw text rather than converting/trimming it. The Feature host validates
  through native `CSS.supports('color', value)` only. No parser, sampling, canvas,
  RGB normalization or renderer change is introduced.

| Exact field | Runtime class | Phase 3J text entry |
|---|---|---|
| `bar.color` | Direct solid/base paint | Yes |
| `bar.segments[].color` (existing rows and draft) | Direct bands/soft_bands/band_gradient painting | Yes; numeric sampling remains limited |
| `bar.needle.color` | Direct glyph paint; existing contrast fallback | Yes |
| `baseline.above.color`, `baseline.below.color` | Direct overlays | Yes |
| `target.color` | Direct glyph paint; existing contrast fallback | Yes |
| `target.when_exceeded.fill_color` | Direct overlay | Yes |
| `peak.color`, `floor.color` | Direct glyph paint; existing contrast fallback | Yes |
| `markers[].color` | Direct glyph paint; existing contrast fallback | Yes |
| `bar.gradient_stops[].color` and Gradient draft | Numeric hex interpolation | No new text path; existing loaded-nonhex fallback is retained |
| Interpolated/sampled solid-fill color | Numeric sampling in `getColor` | No new runtime support; use hex for these combinations |

Browser-valid examples verified include short/full hex, red/orange,
`rgb(1, 2, 3)`, `rgba(0, 100, 0, .5)`, `hsl(30, 100%, 50%)` and
`var(--warning-color)`. CSS variable resolution depends on theme definitions.
Existing contrast/border fallbacks are unchanged; accepting direct paint does not
promise arbitrary CSS interpolation or sampled-color support. Standalone styling,
entity inheritance and conditional fallback controls keep their prior behavior.

Invalid CSS lives in a Feature map keyed by stable text control IDs. Config echo,
hass/context updates and blur retain it; foreign config resets it. Native picker
edits clear the associated text draft. Segment array length changes clear indexed
color drafts to prevent reassociation after add/remove; existing row edits keep
other rows untouched. Reference controls retain their stable UI identities.
Native validity and `aria-invalid` follow restored/reset drafts. Structural foreign
replacement ignores native change events from replaced controls, preventing stale
focused percentage text from resurrecting a discarded draft. No global observer,
new context operation, state subscriptions or runtime lifecycle changes are added.

Opening/context/reopen emits nothing and never persists normalized display values.
Edits preserve root/bar/marker/row metadata, nested unknown keys, own `undefined`,
unsupported fields and aliases not owned by the edit. Explicit source conversion
owns source aliases; existing default-equivalent color removal remains unchanged.
Cross-gap tests cover animation/custom fill, Auto/CSS Segments, percentage Target
with labels/exceeded fill, percentage Baseline with side colors, and untouched
Reference/Peak/Floor/Needle/inactive palettes.

### Final read-only runtime versus editor audit

Compared `SensorBarCardPlusFeature._reconcile`/render/label layout with
`normalizeCardConfig`, Scale/Bar/Baseline/Target/Extrema/Reference normalization,
`getSegmentsForRendering`/paint paths, and all composed editor sections/adapters.
The following covers canonical Feature-appropriate runtime capabilities; aliases
are compatibility representations, not additional capability controls.

| Runtime capability | Editor coverage / remaining class |
|---|---|
| One inherited or explicit entity | Entity section, parent context and override/clear |
| Scale bounds, fixed/entity and fallbacks | Shared Scale section; automatic history/holding is B |
| Five fill styles, solid fill, base color, animation | Shared Bar Appearance; all four exposed |
| Numeric/percent/mixed Segments, automatic ends, colors | Shared Segments with Feature opt-ins; row labels are B, entity boundaries C |
| Hex Gradient Stops | Shared Gradient Stops; arbitrary CSS interpolation/sampling C |
| Needle enable/color | Shared Needle; runtime precedence and geometry B |
| Baseline mode, fixed/entity/percent, side colors | Shared Baseline plus source adapter; symbolic min/max C |
| Target mode/source/percent, shape/direction/color, labels/exceeded fill | Shared Target; independent built-in label entity C |
| Peak/Floor enable/color/direction/labels/reset presets | Shared Extrema; history/timing B, unsupported reset forms C |
| Reference markers, sources/percent, lanes/shapes/direction/colors, label-only and independent label source | Shared Reference; object percent/custom label unit C |
| Unit/precision | Shared Formatting; standalone primary labels/layout B |
| HA feature sizing/context/theme and compact label degradation/motion | B; runtime presentation and host contract |
| Actions/reverse/vertical/area aggregation/multiple entities | C; not implemented by Feature |
| Legacy aliases, top-level palettes, severity, source value/decimal wrappers | D; preserve/read existing paths, no duplicate controls |

**No known Class A gap remains.** No additional genuine canonical,
Feature-appropriate runtime capability was discovered. The earlier B/C/D audit
still applies; none is promoted or implemented in this phase. Four shared section
extensions with explicit Feature policy flags were sufficient. Standalone has
identical controls/HTML and remains 3,588 lines; Feature host is 437 lines. The
four-operation context remains `read`, `mutate`, `source`, `setSource`.

### Validation and next phase

Phase 3J adds nine pre-change characterization tests, 63 capability unit tests and
12 browser cases (source/dist, 360/240px, native validation, drafts/focus/echo,
conversions, foreign replacement, Auto/CSS combined edits, verbatim side/exceeded
color off/on). Final validation: **1,576 unit tests** in 31 files and **263
Playwright tests** pass. All standalone runtime/editor and Card Feature runtime
snapshots are unchanged. Twelve existing Feature editor images intentionally
change: two each for whole-editor composition, Needle, Baseline, Target, Floor
and Segments. Peak, Reference and Gradient Stop section images remain unchanged;
four new images cover Bar Appearance/Auto-CSS Segments at 360/240px. Narrow
screenshots were visually reviewed and browser containment/focus checks pass.

All earlier HTML matrices (20/32/80/96/128/160/192/256) remain exact, plus the
expanded 288-case baseline captured before production edits. Source/dist and
picker/fallback environments pass; new Feature template parity also passes.
Normal dist build and working/staged `git diff --check` pass. Complete diff review
confirms only editor controls/adapters, focused tests/images, documentation and
the regenerated bundle changed; runtime/standalone host source is untouched.

Recommend **Phase 3K — Full Card Feature acceptance in real Home Assistant**.
This is acceptance, not architecture: inherited/explicit entities; Bottom/Inline;
narrow/mobile; every fill; animation on/off; Needle; percentage Baseline/Target;
Peak/Floor/Reference; labels and independent Reference label entities; dynamic
Scale; Auto ends; CSS direct paints; unknown/unavailable sources; echo/reopen;
and complex combinations. Phase 3K is not started by this change.

## Phase 3K acceptance fixes: canonical editor UX and Reference scrolling

> The standalone Sensor Bar Card Plus editor defines the canonical editor information architecture. The Card Feature editor preserves the same applicable ordering, terminology, disclosure behavior, summaries, and visual hierarchy, omitting only controls that are not applicable to the Card Feature host.

### Pre-change canonical map and comparison

Inspected the current `SensorBarCardPlusEditor._render`, `_renderCardGroup`,
`_renderOverrideGroup`, state sets, shared section renderers and reference UI,
not an order from an earlier prompt. Starting state: `feat/card-feature`, clean
at `ecf9d67`. The root information architecture is:

| Position | Canonical visible heading / group | Visibility and initial state | Summary / hierarchy | Feature before fix |
|---|---|---|---|---|
| 1 | Basics | Always visible | Title; standard section shell | Omit: standalone card content |
| 2 | Entities | Always visible; each entity Overrides initially folded | Entity list/reorder/duplicate, entity-local overrides | Required host difference: one inherited/explicit entity; heading/hierarchy align |
| 3 | Scale | Always visible | Fixed/entity Min and Max, native picker/fallback | MATCH |
| 4 | Markers | Always visible section shell | Target → Peak → Floor → Generic Reference Markers | ORDER, DISCLOSURE, SUMMARY, VISUAL/HIERARCHY MISMATCH: separate expanded Feature sections below Bar |
| 4a | Target | Collapsed card subgroup, regardless of configured source | `_getCardTargetMarkerSummary`; mode/source/shape/direction/color/labels/exceeded fill inside | All controls visible; no canonical group summary |
| 4b/4c | Peak / Floor | Collapsed card subgroups | `_getMarkerResetSummary`: enabled/reset; shared controls | All controls visible; no canonical group summaries |
| 4d | Generic Reference Markers | Collapsed card subgroup | Count summary; nested Reference marker N rows initially folded | Separate Reference markers section; nested row folding matches, enclosing group absent |
| 5 | Bar Appearance | Always visible | Fill/Solid/color → collapsed Baseline → always-visible Needle | ORDER/VISUAL/HIERARCHY MISMATCH: separate Baseline and Needle below palettes |
| 5a | Baseline | Collapsed card subgroup | `_getCardBaselineSummary`; mode/source/side colors inside | All controls visible; no summary |
| 5b | Needle | Always visible controls, no root section heading or disclosure | Shared mode/color controls within Bar Appearance | Separate Needle section |
| 6 | Segments | Always-present section shell; collapsed subgroup | Count/default/inactive summary; inactive note/dimming outside segment fills | DISCLOSURE/SUMMARY mismatch; section omitted for inactive fills |
| 7 | Gradient Stops | Always-present section shell; collapsed subgroup | Count/default/inactive summary; inactive note/dimming outside gradient | DISCLOSURE/SUMMARY mismatch; section omitted for inactive fills |
| 8 | Layout | Always visible | Row height, primary label/Hero sizing | Omit: Feature geometry belongs to HA |
| 9 | Formatting | Always visible | Unit/decimal | MATCH |

All root group state belongs to standalone `_expandedCardGroups`, an initially
empty local Set. `_renderCardGroup` uses a button, `aria-expanded`, ▸/▾, title and
escaped summary, then a grid body hidden with `display:none`. Config edits/echo,
hass updates and rerender keep group state; foreign config does not clear the
root group Set. Reference rows instead have stable local IDs and their own expanded
Set, preserved through echo/reorder, reset on foreign config. Add creates and
expands one new row; fold/expand emits no configuration.

Canonical spacing comes from shared `editorStyles`: editor gap 18px, section gap
14px/padding 14px/radius 14px; subgroup margin-top 2px, header padding 10px 12px,
body grid gap 12px/padding 0 12px 12px. Summary truncation, inactive styling and
chevrons are canonical. Entity scope differs: Overrides contains Scale → Target →
Peak → Floor → Reference markers → Bar Appearance → Baseline → Needle → Segments →
Gradient Stops → Layout → Formatting, each its own initially folded override group
with inheritance summaries. Feature has no multirow/entity override scopes.

The filtered root order must be Entities → Scale → Markers → Bar Appearance →
Segments → Gradient Stops → Formatting, with the same nested groups/order above.
Only Basics, Layout, entity-list/row-content/override controls are omitted. The
Feature parent-context entity UI and already-approved 3J control extensions remain;
they are genuine host/capability differences, not reasons to rearrange groups.

### Pre-fix Reference interaction evidence

Added page and nested-dialog browser cases in source/dist before production edits.
Both place the interaction far below the top with nonzero scroll, then expand,
fold and add. The plain fallback harness retained scroll, but reproduced removal
of the interacted toggle and whole-editor replacement in all four cases; the
stable-node regression fails before the fix. Real HA's exact jump to zero is the
reported acceptance finding, not a claim reproduced by the fallback harness.

`_toggleGenericMarkerExpanded` requests host render. Feature's reference render
callback sets `_referenceRenderRequested`, so `_render` replaces the complete
shadow DOM, including unrelated controls/styles. Add changes the marker-ID
signature and also replaces that DOM. Ordinary `.focus()` restoration may scroll;
Add has no restoration selector. These are avoidable focus/DOM disruptions to the
HA editor host. No anchor/default navigation or `scrollIntoView` exists in that
path. Config echo retains marker IDs/expansion; the identity map is not the cause.
Standalone uses the same row state, but does not restore arbitrary active controls
with scrolling focus; its pending focus uses `preventScroll`. No standalone
scrolling defect was demonstrated, and its lifecycle will not be redesigned.

### Implementation and final interaction behavior

`shared/editor-disclosures.js` extracts the exact root `_renderCardGroup` template
and the small canonical Markers section composition. Standalone delegates to
these helpers without changing its state, control content, event routing or
render lifecycle. Feature uses the same wrappers, section controllers, shared
styles and existing summary methods. No new summary semantics or configuration
normalization is introduced; percentage-only Target/Baseline summaries deliberately
retain the current standalone Automatic/Auto wording.

The final Feature order is Entities → Scale → Markers → Bar Appearance →
Segments → Gradient Stops → Formatting. Target, Peak, Floor, Generic Reference
Markers, Baseline, Segments and Gradient Stops start folded, even when configured.
Needle remains visible within Bar Appearance. Both palettes are mounted with
canonical inactive styling/notes, rather than conditionally omitted. Feature's
own `_expandedCardGroups` Set survives edits/echo, context updates, structural
rerenders and foreign replacement, matching standalone root behavior. Reference
row expansion uses the shared stable-ID state and resets only on foreign config.

Feature no longer forces whole-editor replacement for Reference disclosure
changes. `_syncDisclosures` patches expanded attributes, chevrons, summaries and
body visibility in place. Existing expand/fold retains the interacted DOM node,
focus and nearby scroll position, with no explicit scroll call and no config
emission. Structural changes such as Add still render the changed marker list;
focus restoration uses `preventScroll: true`. Add tracks the newly created stable
ID, focuses its heading without scrolling, then uses `scrollIntoView` with
`block: 'nearest', inline: 'nearest'`. No page scroll manipulation, timeout, global
listener or observer is added. Palette pending focus also uses `preventScroll`.

The one-entity parent-context UI is the required host exception, placed under
the canonical Entities heading: inherit parent, explicit override, clear back to
inheritance, and Area/no-parent requirements all remain unchanged. Basics/Title,
Layout/primary row presentation, multirow entity management and entity-local
override/inheritance controls remain omitted because they do not apply to this
Feature. All 3J controls remain available inside the canonical groups, including
animation, Auto Segment ends, direct CSS paints, percentage sources, all marker
labels and independent Reference label entities. Raw metadata, aliases, own
undefined, inactive arrays and source forms remain field-patched and preserved.

### Acceptance verification and targeted HA retest

Four new characterization/parity unit tests and eight browser tests cover
source/dist, 240/360px order/summaries, all seven disclosures, native keyboard
activation, no-emission UI changes, edit/echo/context/foreign lifecycles, raw
metadata and narrow containment. Four of the browser cases use tall page and
nested overflow-dialog fixtures, nonzero scroll, expand/fold/Add, stable existing
toggle identity, no jump to top, nearby visibility, new-row expansion/focus and
exact Add emission count. Their stable-node assertion fails before the fix.
The fallback harness did not reproduce HA's exact jump to zero; actual HA
confirmation remains a targeted manual acceptance check.

All nine pre-change standalone HTML matrices remain byte-exact:
20/32/80/96/128/160/192/256/288, including source/dist and picker/fallback cases.
Standalone editor/runtime and Card Feature runtime screenshots are unchanged.
Only Feature editor images are intentionally updated: 22 existing images reflect
the new canonical composition; six new images show initial, expanded Markers
and Bar Appearance at 240/360px. The narrow states were visually reviewed and
header/control containment passes. Native number-input hover arrows are excluded
from disclosure test captures by moving the pointer away after setup/interaction; screenshot
tolerance is unchanged.

Final validation: **1,580 unit tests** in 32 files and **271 Playwright tests**
pass. Normal dist build and working/staged `git diff --check` pass. Complete diff
review confirms only the editor hosts/shared disclosure helper, focused editor
tests/images, documentation and regenerated bundle changed; configuration adapters
and renderer/runtime source are untouched.

For real HA, retest only: Add and expand/fold Reference rows while scrolled down
(no top jump; new heading remains visible), compare standalone/Feature order,
expand/fold Target/Peak/Floor/Baseline and edit/echo within an open group, reopen
the editor, then quick Bottom/Inline and iPhone/narrow sanity checks. No further
targeted implementation issue is identified by automated acceptance coverage;
complete real-HA acceptance after these focused checks. Phase 3L is not started.

## Numeric input draft acceptance fix

> Temporary empty or syntactically incomplete numeric input is local draft state. It must not mutate configuration or alter source mode. Valid completed input commits normally; configuration echo preserves the owned draft, while genuine foreign replacement may discard it.

Starting state was clean `feat/card-feature` at `3099cd0`. The native keyboard
reproduction was added before production edits in both hosts, source and dist:
Add Reference Marker → Percentage (50) → Backspace (5) → Backspace (empty).
All four cases failed. Feature switched to Fixed; standalone retained its old
mounted Percentage controls momentarily but had already mutated `at` to null,
so a subsequent render would also derive Fixed. This predates 3K: 3K changed
disclosure DOM handling, not Reference numeric parsing or its source writers.

### Exact Reference path and ownership

Reference `handleField` passes `generic-marker-percent` through
`_setGenericMarkerField` to the host context's `setSource`. Unlike Target/Baseline's
`_percentageDraft`, Reference had no incomplete numeric draft owner. Its standalone
writer `_setGenericMarkerSourcePart` and Feature's
`patchFeatureReferenceMarkerSource` both normalize empty/invalid numeric input to
null and write `at: null`. Feature `mutate` emits the changed configuration;
`setConfig` echo correctly recognizes it as owned, not foreign. The new marker
source is now Fixed according to `_getGenericMarkerSource`, changing Feature's
structural signature and replacing the controls. No ID/expansion reset or foreign
replacement is needed to trigger the bug. Standalone has the same destructive
mutation even when its current controls remain mounted.

The source's last committed representation and its temporary text are now
separate. A local empty Reference percentage retains the last valid percentage
source, so source-mode derivation stays Percentage. Explicit Source conversion
discards the previous source-field drafts. Valid replacement follows the existing
writers and cleanup policies; no source schema/default/range rule changes.

### Focused input audit (before fix)

| Input family | Classification | Finding / resulting policy |
|---|---|---|
| Reference Percentage | BUG | Empty/invalid input writes null; now owned locally before source mutation. Existing finite-number percentage acceptance is preserved, including out-of-range literals supported before this fix. |
| Reference Fixed / fixed fallback | BUG | Empty/invalid typing removes the source component. Local entry draft now protects both hosts. |
| Target / Baseline Percentage | SAFE | Existing section `_percentageDraft` and explicit source mode retain empty/invalid values through echo; their 0–100 graphical range rules and Clear percentage action remain unchanged. These controls are not given a second draft store. |
| Target / Baseline Fixed | BUG | Empty/incomplete input can remove a committed source component; shared native-entry guard now owns that draft. |
| Scale Min / Max fixed, root and entity | BUG | Empty or malformed entry reaches deletion/cleanup; shared guard retains the draft without changing bounds or aliases. |
| Segment from/to editing | SAFE on input; BUG on standalone invalid change/Enter | Existing boundary-text Map already owns typing. Standalone commit previously persisted malformed text such as `-`; commit now retains syntactically incomplete/invalid boundaries locally. Feature already rejects invalid boundaries. Valid commit/sorting behavior is unchanged. |
| Feature Segment End blank (Auto) | NOT APPLICABLE on deliberate commit | Blank typing remains local; change/Enter intentionally omits `to` using the existing Auto-end behavior. No inferred end is persisted. |
| Gradient Stop position | SAFE | Existing position-text Map, validation and change/Enter commit retain empty/invalid drafts through both hosts' renders/echo. No new draft store or palette rewrite. |
| New Segment / Gradient Stop numeric drafts | SAFE | Existing section draft Maps do not save configuration until valid Add/Enter. |
| Reference label precision | BUG | Invalid precision can delete precision/decimal aliases; now retained locally. |
| Built-in label / Formatting precision, root and entity | BUG for empty entry; existing invalid-value rejection | Empty typing removes the override; now local. Existing integer/nonnegative validation and committed alias cleanup remain. |
| Standalone row height, label width, Hero maximum font size, root and entity | BUG for empty entry / missing render persistence | Same native-entry policy; existing height validation and Hero clamp remain unchanged. |
| Reset presets, source/entity pickers, booleans, colors, semantic text | NOT APPLICABLE | Different input families; existing handling remains unchanged. |

For fields whose blank means reset/inherit, native **change on blur** remains the
explicit blank commit. Empty **input while typing** never performs that action.
Bad native numeric input (for example a transient minus sign) is not mistaken for
an intentional blank reset on change. Reference percentages keep their draft even
on empty change; conversion uses Source. Target/Baseline retain their explicit
Clear percentage controls. This preserves established committed clearing and
canonicalization while fixing the destructive typing lifecycle.

### Shared fix and host lifecycle

`shared/editor-numeric-drafts.js` supplies `NumericInputDrafts` for ordinary native
entry controls lacking section-owned text drafts. It uses existing number/decimal
normalizers, a local Map keyed by control ID, and native `validity.badInput`.
Hosts consult it before invoking field writers, restore owned drafts after render
or synchronization, and reset it in their existing genuine-foreign replacement
branches. Echo does not reset it. Palette and Target/Baseline percentage draft
owners remain authoritative; the four-operation section context is unchanged.

Reference control IDs already contain stable marker UI IDs, so reorder does not
transfer a draft to another marker. Removed controls discard their entries;
explicit Reference source conversion discards obsolete source drafts. Standalone
entity indices are positional, so explicit entity move/duplicate/remove operations
discard the native-entry drafts rather than transferring them across indices.

Browser testing also established that replacing a focused native number input
can dispatch `change` before the node detaches. Both hosts now ignore numeric
entry events during DOM replacement; detached Feature controls also retain their
existing rejection. That event is not a deliberate blur commit. Standalone
restores focus with `preventScroll` only for an owned numeric draft; Feature keeps
its existing focus restoration. Feature defers structural replacement while an
owned active native bad-input buffer exists, preserving browser text not exposed
through `.value`. No global observer, timeout or scroll policy is added.

The shared Segment commit check keeps existing boundary text when syntax is
empty/incomplete/invalid, with the Feature Auto End exception above. Subsequent
valid change/Enter still uses the previous writer and standalone cleanup. Runtime,
geometry, scale resolution, YAML, editor ordering/disclosures and registration are
unchanged. Phase 3L and distribution work are not started.

### Verification and manual acceptance

Five shared-primitive unit tests cover incomplete strings, valid reconciliation,
native bad input, deliberate blank commit, rendering-generated change suppression,
precision/height validation, section-owned exclusions, focus/foreign reset and
removed/converted sources. Sixteen new browser cases cover source/dist and both
hosts: the exact Reference deletion sequence; empty draft plus echo/forced render;
valid replacement; foreign replacement; fixed/fallback/Scale/precision families;
standalone Layout/entity scopes; built-in percentage Clear actions; incomplete
Segment changes, Feature Auto End and Gradient Stop position drafts. Existing
cleanup tests now use an explicit change for intentional numeric blank commits;
invalid Reference precision tests assert preservation with no emission.

Final validation: **1,585 unit tests** in 33 files and **287 Playwright tests**
pass, including all four 3K page/dialog Reference scroll cases. Marker identity,
expansion, focus and Add nearest-scroll behavior remain covered. All standalone
editor/runtime and Feature editor/runtime snapshots are unchanged; no PNGs were
updated. The nine HTML matrices remain exact (20/32/80/96/128/160/192/256/288),
including source/dist and picker/fallback cases. Normal dist build and working/
staged `git diff --check` pass. Diff review confines this change to editor input
lifecycle, tests, this document and the required regenerated bundle.

Real HA retest: Add a Reference Marker, select Percentage, backspace 50 to empty,
pause, then type 75; verify Percentage/focus/disclosure remain stable and no empty
value is saved. Repeat briefly for Target/Baseline Percentage and one Fixed/Scale
field; verify intended blank reset/inherit on deliberate commit and Auto Segment
End still work. While scrolled down, Add and expand/fold a Reference row to confirm
the 3K scroll fix. Reopen the editor and check the saved values.
