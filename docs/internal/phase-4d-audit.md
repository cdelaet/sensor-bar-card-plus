# Phase 4D Audit

## Summary

Phase 4A through 4C successfully introduced a shared row view model and adopted it in both `_patchRow()` and `_buildRow()` without changing behavior. The current state is stable, but row-level logic is still split across three places:

- `buildRowViewModel()` in `src/view-model/row-view-model.js`
- `_buildRow()` in `src/card/SensorBarCard.js`
- `_patchRow()` in `src/card/SensorBarCard.js`

The biggest remaining duplication is no longer inside `_buildRow()` and `_patchRow()` themselves. It is now between:

- the card’s inline first-render loop in `_update()`
- the view-model builder
- a smaller set of helper methods still duplicated between `SensorBarCard.js` and `row-view-model.js`

## Remaining duplication between `_buildRow()`, `_patchRow()`, and `buildRowViewModel()`

### Still duplicated in `_update()` and the view model

The initial render loop in `_update()` still recomputes row state inline before calling `_buildRow()`:

- resolved `min` / `max`
- numeric state parsing
- `pct`
- target resolution
- display formatting
- display unit selection
- target display formatting
- peak tracking / peak display

This is now the clearest remaining duplication in the row path.

### Still duplicated between `SensorBarCard.js` and `row-view-model.js`

These computations exist in both files with near-identical logic:

- default icon resolution
  - `SensorBarCard._getDefaultEntityIcon()`
  - local `getDefaultEntityIcon()` in `row-view-model.js`
- scale percentage conversion
  - `SensorBarCard._toScalePct()`
  - local `toScalePct()` in `row-view-model.js`
- numeric formatting
  - `SensorBarCard._formatNumericDisplay()`
  - local `formatNumericDisplay()` in `row-view-model.js`
- unit formatting helpers
  - `SensorBarCard._isTightUnit()`
  - `SensorBarCard._formatDisplayWithUnit()`
  - local `isTightUnit()` / `formatDisplayWithUnit()` in `row-view-model.js`
- needle styling and edge logic
  - `SensorBarCard._getNeedleRenderState()`
  - `SensorBarCard._getNeedleBorderColor()`
  - local `getNeedleState()` / `getNeedleBorderColor()` in `row-view-model.js`
- baseline percent resolution
  - `_resolveBaselinePct()` in `SensorBarCard.js`
  - baseline value + percent logic embedded directly in `buildRowViewModel()`

### Still duplicated inside `_buildRow()` and `_patchRow()`

This duplication is smaller after Phase 4C, but some overlap remains:

- both still call `_getFillRenderState(...)`
- both still independently apply peak marker color/contrast styling
- both still rely on external caller-supplied `pct`, `targetPct`, `targetDisplay`, `peakPct`, and `peakDisplay` instead of converging on one source of truth

## Possibly obsolete wrappers

These wrappers may be obsolete in later cleanup phases, but should not be removed yet without a broader call-site audit:

- `_getEntityNumericValue(...)`
- `_getNumericValue(...)`
- `_resolvePercentValue(...)`
- `_getNormalizedResolvableNumericValue(...)`

Reason:
They now delegate directly to `src/config/resolve.js`, and the row path increasingly bypasses them by using `buildRowViewModel()`.

These wrappers are more likely still useful for compatibility and incremental migration:

- `_resolve(...)`
- `_resolveBaselinePct(...)`
- `_formatNumericDisplay(...)`
- `_formatDisplayWithUnit(...)`
- `_getNeedleRenderState(...)`

Reason:
They are still used in live rendering and are still the behavioral reference for tests.

The normalization passthrough methods at the top of `SensorBarCard.js` also look mechanically redundant, but they are outside the row-view-model scope and should be audited separately.

## View-model fields computed but unused

These fields are currently computed by `buildRowViewModel()` but are not used by runtime rendering code yet, or are only asserted in tests:

- `rawUnit`
  - useful contract field, but runtime code does not currently read it
- `unit`
  - runtime uses `displayUnit`; `unit` is currently an alias
- `barColor`
- `fillStyle`
- `segments`
- `gradientStops`
- `targetVisible`
- `baselineVisible`
- `peak`
- `peakPercent`
- `peakDisplay`
- `peakVisible`
- `classes`
  - `classes.labelPosition`
  - `classes.animated`
- `attributes.entity`

These fields are not necessarily dead. Most look like preparation for later migration of:

- first-render HTML generation
- color / fill decisions
- peak marker rendering
- layout / class derivation

## Good candidates for Phase 4E

### Best next migration target

Migrate the inline first-render calculations in `_update()` to `buildRowViewModel()`.

That is now the highest-value cleanup because it would remove the largest remaining duplicated row-state assembly without touching DOM structure.

### Good small helper extraction candidates

If Phase 4E allows a small shared utility layer, the lowest-risk shared helper candidates are:

- default icon resolution
- scale percent conversion
- numeric display formatting
- display-with-unit formatting
- needle border-color calculation

These are already duplicated almost verbatim.

### Good view-model adoption targets

If runtime behavior remains stable, the next safe row-view-model adoption candidates are:

- use `rowViewModel.targetDisplay` in the initial render path
- use `rowViewModel.displayValue` / `displayUnit` in the initial render path
- use `rowViewModel.peak*` fields in the initial render path only after confirming peak mutation ordering remains unchanged
- use `rowViewModel.attributes.entity` consistently for row metadata

## Things to avoid touching for now

- Do not move peak mutation into `buildRowViewModel()`.
  - Peak state is still a card-owned runtime side effect.
- Do not collapse `_buildRow()` and `_patchRow()` into a new renderer abstraction yet.
  - Too much snapshot risk.
- Do not remove `_resolve(...)` yet.
  - It still centralizes normalized entity config + live state fallback behavior.
- Do not deduplicate formatting helpers by importing card methods into the view model or vice versa without deciding a clear shared utility home first.
  - That can easily create circular import pressure.
- Do not change `_buildRow()`’s public argument shape yet.
  - Tests call it directly with precomputed values.

## Recommended next step

Phase 4E should focus on one narrow goal:

1. Replace the inline row-state assembly in `_update()` with `buildRowViewModel()`.
2. Keep peak mutation in `SensorBarCard.js`.
3. Keep `_buildRow()` argument shape unchanged for now.
4. Do not attempt broad helper deduplication in the same phase.

That would remove the biggest remaining duplication while keeping the row rendering surface stable.
