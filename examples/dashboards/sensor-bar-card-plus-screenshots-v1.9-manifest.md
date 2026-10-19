# Screenshot capture manifest — v1.9

The Screenshot dashboard is for manually curated documentation and presentation captures. Keep broad interactive QA in the Playground, copyable configurations in Recipes, compatibility examples in Heritage, and automated regression images in Playwright. Do not use Playwright snapshots as documentation artwork. The v1.7 capture manifest and its versioned views remain unchanged; v1.9 gets a separate `Direction Showcase v1.9` view.

The Direction Showcase has been implemented and manually accepted in `examples/dashboards/sensor-bar-card-plus-screenshots.yaml` at path `sensor-bar-card-plus-direction-showcase-v19`. It is the comprehensive runnable/demo surface for v1.9 Direction behavior. This manifest records its compositions and the final public documentation image selection.

## Showcase compositions and selected image

| Composition | Showcase content | Fixture / setup |
|---|---|---|
| **Scale × Bar Direction** | `direction-scale-bar-combinations` — one four-row standalone SBCP card | Fixed solar sensor at 7.2 kW; 0–10 kW Scale; identical semantic gradient across all four combinations |
| **Reverse Scale · Markers and Needle** | `direction-reverse-markers-needle` — one two-row standalone SBCP card | Fixed solar sensor at 7.2 kW; reversed 0–10 kW Scale; Target 8.5 kW and generic reference 5.5 kW; Reveal Fill and Needle rows |
| **Reverse Scale · Bipolar Baseline** | `direction-reverse-bipolar-baseline` — one two-row standalone SBCP card | Fixed solar sensor at +7.2 kW and grid sensor at −3.4 kW; reversed −10 to +10 kW Scale; Baseline 0; semantic above/below colors |

All three compositions are implemented in the runnable showcase and use existing fixed Hero screenshot sensors in [`sensor_bar_card_plus_playground_package.yaml`](../packages/sensor_bar_card_plus_playground_package.yaml). They need no new helpers or interactive controls.

The sole selected public documentation screenshot is [`docs/images/examples/direction-combinations.png`](../../docs/images/examples/direction-combinations.png). It illustrates the four Scale × Bar Direction combinations using one shared semantic gradient. The other two compositions remain demonstrated by the showcase dashboard and do not require separate documentation screenshots.

## Selected v1.9 documentation image scope

The post-v1.8 history includes several user-facing additions and internal refinements. Direction is the only addition in this set that needs a new static image to explain its visual semantics. The other changes are better shown with configuration prose, examples, or automated editor acceptance than with another curated screenshot.

| Change inspected | Classification | Image decision |
|---|---|---|
| Independent Scale Direction and Bar Direction | **Screenshot-worthy** | Use the four-combination image above; the showcase dashboard also demonstrates reverse-Scale markers/Needle and bipolar Baseline behavior. |
| Standalone row tap, hold, and double-tap Actions | **Prose-only documentation** | Document supported action configuration and gesture behavior with copyable YAML. A still image cannot demonstrate interaction; retain Playwright interaction coverage for regression. |
| Entity icon Default / Custom / Off controls and behavior | **Prose-only documentation** | Configuration documentation already explains automatic entity/fallback icons, explicit icons, and `icon: false`. A new still is not needed for this behavior. |
| Structured entity-attribute sources for Scale and other supported values | **Prose-only documentation** | Explain the source syntax, fallback rules, and supported attributes with YAML examples; the capability is configuration-driven rather than a distinct visual presentation. |
| Visual Editor organization and control refinements | **Prose-only documentation** | Mention the editing improvements where release notes warrant it. The editor acceptance screenshots remain automated regression assets, not documentation art. |
| Lazy editor loading, timing/lifecycle hardening, fallback-paint fixes, and layout/spacing corrections | **Bug fix / internal only** | Do not add dedicated captures. Describe user-visible corrections in release prose only when useful. |

The Card Feature is intentionally not given a Direction screenshot. It shares the finalized Direction normalization and rendering semantics, so a static composition would repeat the standalone examples without adding a distinct user-facing visual explanation. Feature parity remains covered by runtime and Playwright acceptance tests.

## Direction contract shown by the showcase

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

These are separate public concepts: Scale orientation determines semantic-to-physical position, while Bar Direction chooses an ordinary reveal edge. The internal normalized representation and rendering implementation are outside this documentation image manifest.

## Composition intent

### Scale × Bar Direction

The selected documentation image shows four rows on the same 0–10 kW semantic Scale and the same fixed 7.2 kW value. Keep this identical, evenly spaced semantic gradient in all rows:

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

Use text-only Generic Reference Markers at semantic 0 and 10 kW on the normal Scale · normal Bar and reverse Scale · normal Bar rows. Set `show_marker: false` while keeping each label visible. Scale Direction projects the endpoint labels, so the normal row reads 0 kW at left / 10 kW at right and the reverse row reads 10 kW at left / 0 kW at right. Keeping endpoint labels on this representative pair makes orientation clear without repeating them across all four rows. Use one full-width card and Above labels so the rows remain legible in the selected image.

### Reverse Scale · Markers and Needle

The showcase uses two rows with the same fixed 7.2 kW solar value, reversed 0–10 kW Scale, Target at 8.5 kW, and a generic reference at 5.5 kW. One row uses ordinary Reveal Fill and the other uses Needle mode. Keep the same semantic gradient from Scale × Bar Direction so the compositions read as one visual family. Add text-only Generic Reference Markers at semantic 0 and 10 kW on both rows, using `show_marker: false`; these establish 10 kW on the left and 0 kW on the right in the card itself. Use pale neutral `#f8fafc` for Target and Needle, and restrained violet `#a78bfa` for the 5.5 kW Reference.

The reversed projection puts the current value at 28%, Target at 15%, and generic reference at 45% of the physical rail. The relationship makes clear that value, marker coordinates, semantic Gradient, and Needle position follow the Scale. Bar Direction is not varied in this composition. Do not add Peak or Floor just to increase marker count; session extrema would require extra lifecycle setup and do not add a necessary explanation to this capture.

### Reverse Scale · Bipolar Baseline

The showcase uses two rows on a −10 to +10 kW Scale with `scale.direction: reverse` and Baseline 0. The fixed solar value is +7.2 kW and the fixed grid value is −3.4 kW. Use turquoise `#2dd4bf` for semantic values above Baseline and coral `#fb7185` below it, retaining the palette family without implying good/bad severity.

Zero remains at the physical midpoint. Positive values project to the left of zero and negative values to the right. The colors retain their semantic above/below meaning even though the positive side is physically left. This demonstrates that Baseline and side colors are semantic Scale concepts, not fixed physical-left/right regions.

## Deterministic fixtures

| Entity | Existing fixture state | Used by |
|---|---:|---|
| `sensor.sbcp_hero_shot_solar` | `7.2 kW` | All four Scale × Bar rows; both Reverse Scale marker/Needle rows; positive Baseline row |
| `sensor.sbcp_hero_shot_grid` | `-3.4 kW` | Negative Baseline row |

The Target, generic reference, Scale bounds, Baseline, direction settings, Paint, and Needle mode are literal card configuration. No phase selector, animation, extrema preparation, or mutable helper is needed. Keep entity values fixed; if the fixture package changes, update this manifest only after verifying the new values and their projected positions.

## Final documentation image

The Direction Showcase implementation and its three compositions have been manually accepted. Use `docs/images/examples/direction-combinations.png` as the single public documentation image for v1.9 Direction. It should show all four Scale × Bar combinations with their shared semantic gradient and the endpoint labels that make Scale orientation clear.

Separate images for **Reverse Scale · Markers and Needle** and **Reverse Scale · Bipolar Baseline** were considered and deliberately not selected. Those behaviors remain available in the runnable Direction Showcase dashboard; their lack of separate screenshots is not outstanding release work.

Do not redefine v1.7 capture IDs or filenames, modify its manifest, or substitute canonical Playwright images for the selected manual documentation image.
