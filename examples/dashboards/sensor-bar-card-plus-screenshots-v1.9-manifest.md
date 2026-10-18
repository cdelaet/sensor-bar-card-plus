# Screenshot capture manifest — v1.9

The Screenshot dashboard is for manually curated documentation and presentation captures. Keep broad interactive QA in the Playground, copyable configurations in Recipes, compatibility examples in Heritage, and automated regression images in Playwright. Do not use Playwright snapshots as documentation artwork. The v1.7 capture manifest and its versioned views remain unchanged; v1.9 gets a separate `Direction Showcase v1.9` view.

The view is planned for `examples/dashboards/sensor-bar-card-plus-screenshots.yaml` at path `sensor-bar-card-plus-direction-showcase-v19`. This manifest defines the later dashboard work and capture procedure; it does not itself add or change a dashboard view.

## Capture list

| Capture ID | View and card(s) | Helper state / setup | Intended output | Capture type |
|---|---|---|---|---|
| `direction-scale-bar-combinations` | Direction Showcase v1.9 · **Scale × Bar Direction** — one four-row standalone SBCP card | Fixed `sensor.sbcp_hero_shot_solar` at 7.2 kW; 0–10 kW Scale; all rows share the same semantic gradient; vary only the two direction fields across the four rows | `images/direction-combinations.png` | Static documentation capture |
| `direction-reverse-markers-needle` | Direction Showcase v1.9 · **Reverse Scale · Markers and Needle** — one two-row standalone SBCP card | Fixed solar sensor at 7.2 kW; reversed 0–10 kW Scale; Target 8.5 kW and generic reference 5.5 kW; one Reveal Fill row and one Needle row; shared semantic gradient | `images/reverse-scale-markers-needle.png` | Static documentation capture |
| `direction-reverse-bipolar-baseline` | Direction Showcase v1.9 · **Reverse Scale · Bipolar Baseline** — one two-row standalone SBCP card | Fixed solar sensor at +7.2 kW and grid sensor at −3.4 kW; reversed −10 to +10 kW Scale; Baseline 0; distinct semantic above/below colors | `images/reverse-bipolar-baseline.png` | Static documentation capture |

All three compositions use the existing fixed Hero screenshot sensors in [`sensor_bar_card_plus_playground_package.yaml`](../packages/sensor_bar_card_plus_playground_package.yaml). They need no new helpers or interactive controls.

## Selected v1.9 capture scope

The post-v1.8 history includes several user-facing additions and internal refinements. Direction is the only addition in this set that needs a new static image to explain its visual semantics. The other changes are better shown with configuration prose, examples, or automated editor acceptance than with another curated screenshot.

| Change inspected | Classification | Capture decision |
|---|---|---|
| Independent Scale Direction and Bar Direction | **Screenshot-worthy** | Include the three compositions below. Their physical projections and reveal origins are visual behavior that is difficult to communicate with prose alone. |
| Standalone row tap, hold, and double-tap Actions | **Prose-only documentation** | Document supported action configuration and gesture behavior with copyable YAML. A still image cannot demonstrate interaction; retain Playwright interaction coverage for regression. |
| Entity icon Default / Custom / Off controls and behavior | **Prose-only documentation** | Configuration documentation already explains automatic entity/fallback icons, explicit icons, and `icon: false`. A new still is not needed for this behavior. |
| Structured entity-attribute sources for Scale and other supported values | **Prose-only documentation** | Explain the source syntax, fallback rules, and supported attributes with YAML examples; the capability is configuration-driven rather than a distinct visual presentation. |
| Visual Editor organization and control refinements | **Prose-only documentation** | Mention the editing improvements where release notes warrant it. The editor acceptance screenshots remain automated regression assets, not documentation art. |
| Lazy editor loading, timing/lifecycle hardening, fallback-paint fixes, and layout/spacing corrections | **Bug fix / internal only** | Do not add dedicated captures. Describe user-visible corrections in release prose only when useful. |

The Card Feature is intentionally not given a Direction capture. It shares the finalized Direction normalization and rendering semantics, so a second static composition would repeat the standalone examples without adding a distinct user-facing visual explanation. Feature parity remains covered by runtime and Playwright acceptance tests.

## Direction contract shown by the captures

The accepted public configuration is:

```yaml
scale:
  direction: normal   # normal | reverse; defaults to normal

bar:
  direction: normal   # normal | reverse; defaults to normal
```

- `scale.direction` controls the physical projection of semantic scale coordinates. Reversing it changes where semantic minimum, maximum, and values appear; it does not swap the numeric meanings of `min` and `max`.
- Paint is defined in semantic scale coordinates and follows Scale Direction. Segment boundaries and Gradient Stops project with the Scale; users do not reverse their definitions manually.
- The current value, Target, Peak, Floor, generic references, and Needle position follow Scale Direction.
- `bar.direction` selects the physical reveal origin for an ordinary bar without an active Baseline. Normal starts at the physical left edge; reverse starts at the physical right edge. It does not reverse the Scale, Paint, markers, or semantic min/max.
- An active Baseline is the explicit semantic reveal origin. Its projected position and the current value determine reveal geometry, so Bar Direction does not override the Baseline. Scale Direction still projects the Baseline and semantic above/below regions.

These are separate public concepts: Scale orientation determines semantic-to-physical position, while Bar Direction chooses an ordinary reveal edge. The internal normalized representation and rendering implementation are outside this capture manifest.

## Composition intent

### Scale × Bar Direction

Use four rows on the same 0–10 kW semantic Scale and the same fixed 7.2 kW value. Keep this identical, evenly spaced semantic gradient in all rows:

| Semantic position | Color |
|---:|---|
| 0% | `#8b5cf6` (violet) |
| 25% | `#3b82f6` (blue) |
| 50% | `#2dd4bf` (turquoise) |
| 75% | `#fbbf24` (amber) |
| 100% | `#fb7185` (coral) |

The four rows are:

1. Scale normal · Bar normal
2. Scale reverse · Bar normal
3. Scale normal · Bar reverse
4. Scale reverse · Bar reverse

At 7.2 kW, normal Scale projects the value to 72% of the physical rail; reverse Scale projects it to 28%. Normal Bar Direction reveals from the physical left, while reverse Bar Direction reveals from the physical right. This makes the independent effects visible together: Scale Direction moves the value and reverses the semantic band order; Bar Direction changes the reveal origin without changing Paint.

Use text-only Generic Reference Markers at semantic 0 and 10 kW on the normal Scale · normal Bar and reverse Scale · normal Bar rows. Set `show_marker: false` while keeping each label visible. Scale Direction projects the endpoint labels, so the normal row reads 0 kW at left / 10 kW at right and the reverse row reads 10 kW at left / 0 kW at right. Keeping endpoint labels on this representative pair makes orientation clear without repeating them across all four rows. Use one full-width card and Above labels so the rows remain legible in a crop.

### Reverse Scale · Markers and Needle

Use two rows with the same fixed 7.2 kW solar value, reversed 0–10 kW Scale, Target at 8.5 kW, and a generic reference at 5.5 kW. One row uses ordinary Reveal Fill and the other uses Needle mode. Keep the same semantic gradient from Scale × Bar Direction so the captures read as one visual family. Add text-only Generic Reference Markers at semantic 0 and 10 kW on both rows, using `show_marker: false`; these establish 10 kW on the left and 0 kW on the right in the card itself. Use pale neutral `#f8fafc` for Target and Needle, and restrained violet `#a78bfa` for the 5.5 kW Reference.

The reversed projection puts the current value at 28%, Target at 15%, and generic reference at 45% of the physical rail. The relationship makes clear that value, marker coordinates, semantic Gradient, and Needle position follow the Scale. Bar Direction is not varied in this composition. Do not add Peak or Floor just to increase marker count; session extrema would require extra lifecycle setup and do not add a necessary explanation to this capture.

### Reverse Scale · Bipolar Baseline

Use two rows on a −10 to +10 kW Scale with `scale.direction: reverse` and Baseline 0. The fixed solar value is +7.2 kW and the fixed grid value is −3.4 kW. Use turquoise `#2dd4bf` for semantic values above Baseline and coral `#fb7185` below it, retaining the palette family without implying good/bad severity.

Zero remains at the physical midpoint. Positive values project to the left of zero and negative values to the right. The colors retain their semantic above/below meaning even though the positive side is physically left. This demonstrates that Baseline and side colors are semantic Scale concepts, not fixed physical-left/right regions.

## Deterministic fixtures

| Entity | Existing fixture state | Used by |
|---|---:|---|
| `sensor.sbcp_hero_shot_solar` | `7.2 kW` | All four Scale × Bar rows; both Reverse Scale marker/Needle rows; positive Baseline row |
| `sensor.sbcp_hero_shot_grid` | `-3.4 kW` | Negative Baseline row |

The Target, generic reference, Scale bounds, Baseline, direction settings, Paint, and Needle mode are literal card configuration. No phase selector, animation, extrema preparation, or mutable helper is needed. Keep entity values fixed; if the fixture package changes, update this manifest only after verifying the new values and their projected positions.

## Capture procedure

### Shared setup

1. After the later dashboard implementation, load the existing playground package and Screenshot dashboard using the normal Home Assistant configuration workflow. Confirm both fixed entities are available with the states above and the v1.9 card resource is loaded.
2. Open **Direction Showcase v1.9** at `sensor-bar-card-plus-direction-showcase-v19`. Use one consistent desktop viewport and the same Home Assistant theme for all three captures; dark theme is preferred to match the existing showcase palette. Collapse the sidebar and keep browser zoom fixed.
3. Let the static sensors settle. No animation, script, editor, helper control, or reload sequence is needed between captures. Reload only if Home Assistant has stale dashboard YAML or card resources; verify the same entity values after reload.
4. Capture each composition separately. Include its short Markdown heading/description and the complete SBCP card. Exclude browser chrome, Home Assistant navigation/sidebar, view tabs, unrelated cards, and any controls outside the composition. Do not crop away labels, rail endpoints, markers, or the full reveal/Needle geometry.
5. Use the card's full available width in the desktop view. Choose crop bounds after inspecting the actual Home Assistant rendering; do not force exact pixel dimensions before that inspection. Keep enough surrounding space to avoid clipping while making each image suitable for the intended documentation width.

### Per-capture checks

- **Scale × Bar Direction:** verify all four rows show the same 7.2 kW reading and semantic gradient; the representative normal/reverse rows label endpoints 0/10 kW and 10/0 kW from left to right; Scale positions are visibly 72%/28%; Bar Direction changes only the reveal origin. Capture the entire four-row card.
- **Reverse Scale · Markers and Needle:** verify both rows visibly label 10 kW at left and 0 kW at right, show 7.2 kW, Target 8.5 kW, and Reference 5.5 kW, and place Needle/Reveal Fill according to reversed projection. Capture the entire two-row card including all marker labels.
- **Reverse Scale · Bipolar Baseline:** verify solar is +7.2 kW, grid is −3.4 kW, zero Baseline is centered, positive is physically left, negative is physically right, and semantic above/below colors remain correct. Capture the entire two-row card.

## Later implementation and capture validation

Before producing these assets, confirm:

- The Screenshot dashboard YAML parses, and the new view title and path are unique.
- The view uses the planned Masonry/vertical-stack style and leaves all existing screenshot views intact, especially the versioned v1.7 captures.
- Every referenced entity exists in the playground package and resolves to the documented deterministic value and unit.
- All card configurations normalize and validate without errors; expected duplicate-entity warnings from repeated fixed solar rows are acceptable. All four Scale × Bar combinations, projected endpoint labels, and both Baseline colors render as specified.
- No source, unit/visual test, or `dist` files are changed as part of the screenshot-dashboard-only implementation unless separately authorized.
- Manual Home Assistant inspection confirms the intended view geometry, projected value/marker/Paint positions, semantic Baseline colors, and crop legibility at the intended documentation width.
- The three captures use the same desktop viewport/theme, preserve the complete explanatory geometry, and remain legible at their final documentation placement.

Do not redefine v1.7 capture IDs or filenames, modify its manifest, or substitute canonical Playwright images for any of these manual documentation captures.
