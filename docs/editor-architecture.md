# Shared editor infrastructure and sections (Phases 3A/3B)

The shipped standalone host remains `src/editor/SensorBarCardPlusEditor.js`.
It uses the same HTMLElement, shadow DOM, string templates and delegated events.
There is no Card Feature editor or new editor registration in this phase.

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

Recommended Phase 3C: mechanically extract Bar Appearance (existing fill style,
color and `solid_fill` controls/readers/handlers, including current inherited
paint explicitness). Keep Segments, gradient drafts, Needle, Baseline and marker
sections host-owned until their own characterization/extraction steps. Do not
add animation controls or the Feature host during that extraction.
