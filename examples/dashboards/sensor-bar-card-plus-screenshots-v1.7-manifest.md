# Screenshot capture manifest — v1.7.0

All captures use the `sensor-bar-card-plus-screenshots` dashboard. The existing views remain intact. Still-image material lives in **README Captures v1.7.0** and **README Hero Still v1.7**; the promotional sequence lives in **Hero Showcase v1.7**. Configure the [playground package](../packages/sensor_bar_card_plus_playground_package.yaml) in Home Assistant to provide its synthetic entities.

| Capture ID | View and card(s) | Helper state / setup | Intended output | Capture type |
|---|---|---|---|---|
| `overview-energy-dashboard` | README Captures v1.7.0 · Solar production, Household load, Utility exchange, Battery power, EV charging, Battery reserve | Select **EV plugged in** | `images/overview-energy-dashboard.png` | Static composite |
| `layout-modes` | README Captures v1.7.0 · Five label layouts | None; fixed 7.2 kW solar fixture | `images/layout-modes.png` | Static |
| `fill-style-comparison` | README Captures v1.7.0 · Solid, Gradient, Bands, Soft bands, Band gradient + solid fill | None; fixed 7.2 kW solar fixture | `images/fill-style-comparison.png` | Static composite |
| `baseline-bidirectional-origin` | README Captures v1.7.0 · Energy across zero | Select **Battery charge**; both values are phase-derived. No Target is configured on these tracks. | `images/baseline-bidirectional-origin.png` | Static |
| `target-peak-floor` | README Captures v1.7.0 · Target and observed range | Select **Dawn**, reload the view to initialize session extrema, then step once through each phase to **Night** without leaving the view. Expected Battery Power Max: `1800 W`; Min: `-1200 W`. | `images/target-peak-floor.png` | Static after phase sequence |
| `generic-marker-glyphs` | README Captures v1.7.0 · Circle, Diamond, Triangle, Chevron; Arrow and Pin direction | None; fixed 21.8 °C comfort fixture keeps the reading clear of the glyph positions. Cards use actual SBCP marker glyphs. | `images/generic-marker-glyphs.png` | Static composite |
| `marker-labels-and-comfort-range` | README Captures v1.7.0 · Bedroom comfort range | None; fixed 21.8 °C comfort fixture | `images/marker-labels-and-comfort-range.png` | Static |
| `visual-editor-markers` | README Captures v1.7.0 · EDITOR PREP — Marker controls | Open that card in the Home Assistant Visual Editor | `images/visual-editor-markers.png` | Manual editor capture |
| `responsive-hero` (optional) | README Captures v1.7.0 · Responsive Hero | Use a narrow/mobile viewport | `images/responsive-hero.png` | Static at narrow width |
| Hero Showcase v1.7 | Hero Showcase v1.7 · **Home energy** vertical stack: Rooftop solar, Grid, Home / EV, Battery power / reserve | Follow the reset and nine-phase procedure below; exclude Capture controls from the crop. | `images/hero-170.gif` | Later animated capture; not created in this phase |
| `readme-hero-still` | README Hero Still v1.7 · **Home energy** vertical stack: Rooftop solar, Grid, Home / EV, Battery power / reserve | Reload the view to reset session extrema, then run **Prepare extrema** in Static Capture Controls below the stack. | `images/readme-hero-still.png` | Static capture |

## Hero composition

One normal Home Assistant vertical stack, headed **Home energy**, contains four SBCP cards:

1. **Rooftop solar** — full-width 32 px Reveal Fill gradient from purple through pink to peach; the moving pale-yellow Forecast pin sits below the track.
2. **Grid · export / import** — full-width 32 px zero-baseline track. Export grows left in cyan; import grows right in the solid mint fill. The built-in Target marks the 3000 W Grid Import Limit in coral.
3. **Home / EV charging** — two 24 px Above rows on the same 0–5000 W scale. Periwinkle-gradient household demand and a blue-gradient EV load form a compact comparison.
4. **Battery** — 28 px Above power row with a zero Baseline, cyan charging / light-blue discharging, and genuine observed Max above / Min below. The paired Inside reserve gauge uses Needle mode over purple, yellow and pink bands, with an 80% Goal chevron.

Short Above labels leave the bar width available for data. The only Inside row is the reserve gauge. All numbers use the card's locale-aware formatting. The palette distinguishes solar (purple/pink/peach), home load (periwinkle), EV load (blue), battery direction (cyan/light blue), and reserve (purple/yellow/pink). There is no oversized Hero number or explanatory dashboard prose. Capture controls remain separate from the image area. No custom layout plugin, card-mod, YAML anchors, or runtime changes are required; each SBCP card remains editable normally.

## Energy story values

`input_select.sbcp_docs_energy_phase` selects an exact named keyframe; `input_number.sbcp_docs_story_position` represents positions 0–8 and interpolates between those same nine snapshots. Both are independent of wall-clock time and production sensors. All power values below are watts; reserve is a percentage. These are representative moments with unspecified intervals, not a time-integrated battery model. Reserve can reflect charging/discharging between snapshots.

```text
grid import (+) / export (-) = home load + EV load + battery power - solar production
battery power: charging (+), discharging (-)
```

At each position the power and reserve sensors use the same eased interpolation fraction. Grid is derived from the interpolated Home, EV, Battery and Solar values, never separately interpolated, so the balance equation holds between keyframes too.

| Phase | Solar | Forecast | Home | EV | Battery | Grid | Reserve | Max / Min |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Dawn | 0 | 150 | 1100 | 0 | 0 | +1100 | 38% | 0 / 0 |
| Morning ramp | 850 | 1200 | 1450 | 0 | 0 | +600 | 39% | 0 / 0 |
| Solar surplus | 2800 | 2650 | 1900 | 0 | +700 | -200 | 43% | 700 / 0 |
| Battery charge | 5200 | 5500 | 2100 | 0 | +1800 | -1300 | 55% | 1800 / 0 |
| Peak sun | 6100 | 5800 | 2300 | 0 | +1800 | -2000 | 68% | 1800 / 0 |
| EV plugged in | 4800 | 5100 | 2400 | 3600 | 0 | +1200 | 72% | 1800 / 0 |
| Cloud passing | 2000 | 2700 | 2200 | 3600 | -1200 | +2600 | 64% | 1800 / -1200 |
| Evening import | 350 | 500 | 1800 | 3600 | -800 | +4250 | 54% | 1800 / -1200 |
| Night | 0 | 0 | 1400 | 0 | 0 | +1400 | 50% | 1800 / -1200 |

Solar wakes up, covers the home, charges storage and exports the surplus. EV charging turns exports into imports; a cloud widens the forecast shortfall and the battery helps supply the load. Evening demand crosses the 4000 W import budget. At night the EV stops, the battery rests, and the grid supplies the home. Reserve peaks at 72%, below the 80% goal.

## Hero marker semantics

| Row / marker | Source and meaning | Appearance |
|---|---|---|
| Solar **Forecast** | Dynamic generic reference: `sensor.sbcp_docs_solar_forecast`, an expected instantaneous production profile, not daily energy. It is 150 W at Dawn, peaks at 5800 W, and returns to 0 W at Night; during Cloud passing it exceeds actual production by 700 W. Its independent keyframes allow actual solar to exceed it at Solar surplus and Peak sun. | Pale amber inward pin, below; text-only label. At Night it coincides with zero; at Dawn it remains above actual solar. |
| Grid **Import Limit** | Built-in Target: fixed **3000 W**, a visual reference, not a protective cutoff or an enforced tariff limit. | Coral marker with the “Grid Import Limit” label; exceedance fill is deep red. |
| Reserve **Goal 80%** | Generic chevron reference at fixed **80%**. The Target configuration is disabled on this row; the card still shows the white Needle over 0–12% purple, 12–80% yellow, and 80–100% pink segments. | Pale-yellow chevron below with the text-only “Target” label. |
| Battery **Max** | Built-in Peak: greatest signed battery power observed by this card since initialization. | Mint built-in marker above, text-only label. |
| Battery **Min** | Built-in Floor: least signed battery power observed by this card since initialization. | Blue built-in marker below, text-only label. |

The two zero baselines are fill origins, not Target markers. The Hero uses two generic markers on separate tracks: the solar Forecast pin and the reserve Goal chevron. The grid import limit is the built-in Target marker. The existing Phase 2 helper `sensor.sbcp_docs_grid_plan` is retained but is not used by this Hero.

Max/Min are **in-memory card-session extrema**, not historical statistics. `reset: never` preserves them only while the card instance survives. Refreshing the page or recreating the card clears them; changing phases alone does not. The values in the last table column assume the exact Dawn-to-Night sequence below. At Dawn both values are zero, with their labels on separate lanes. Min remains zero until Cloud passing; the final range is **Max 1800 W / Min -1200 W**.

## Continuous playback model and controls

The existing integer keyframes and exact readings in the table are unchanged. Position advances continuously across eight segments. Within each segment, each sensor uses smoothstep easing, `t²(3 − 2t)`, to interpolate its two adjacent keyframe values. Grid is recomputed from the other interpolated loads at one decimal W. The playback script updates position every **100 ms**; the card's adaptive Reveal Fill transition (**150–600 ms**, based on normalized geometry movement) smooths each update.

The **Transition seconds, Dawn through Night** input contains the eight segment durations in order. Its default is **`6, 6, 6, 5, 4, 4, 6, 3` seconds** (Dawn→Morning, Morning→Surplus, Surplus→Battery charge, Battery charge→Peak sun, Peak sun→EV, EV→Cloud, Cloud→Evening, Evening→Night). Edit this single list to retune the tempo. **Hold at keyframes** defaults to 0.25 s at the seven intermediate integer positions; **Hold at Night** defaults to 3 s before the loop. At 1× the default loop takes about **45 s**: 40 s of transitions, 1.75 s of intermediate holds and 3 s at Night. The 0.5× / 1× / 1.5× / 2× speed selector scales transition time; the holds stay fixed. Total time is about 85 / 45 / 31 / 25 s respectively.

During the automatic Peak-sun→EV segment, EV power begins just above the Peak-sun keyframe at about **300 W** and smoothsteps to **3600 W over 3 seconds at 1×** (proportionally faster/slower at other speeds). The interpolation depends on story position, so pausing preserves the same readings. Manually selecting any named keyframe, including EV plugged in, shows its exact documented value immediately.

**Animation Controls** provides Run/Play, Stop/Pause, previous/next named-keyframe stepping, speed, and timing/hold controls. Steps wrap Night→Dawn and Dawn→Night. Stop pauses at the current interpolated position. Manual selection of a different phase pauses playback and snaps to that exact keyframe. The live **Current energy phase** display follows the nearest keyframe during a transition, and the selector is synchronized at those crossings. If the selector already names that nearest phase, use **Jump to selected phase** to explicitly seek to the exact keyframe; this also works when selecting the current option would produce no Home Assistant state change.

Looping Night→Dawn resets only the story position and selector. It deliberately does not clear SBCP's in-memory extrema. Reload the view at Dawn before every fresh recording as described below.

## Exact Hero setup and later capture procedure

1. Load the updated playground package into Home Assistant with the normal configuration check/restart or template reload appropriate to that installation. Load the updated screenshot dashboard YAML. Use the current v1.7 development card resource containing generic markers; refresh the browser resource cache if HA still serves an older card. No new build is required by this fixture change.
2. Open **Hero Showcase v1.7** (`sensor-bar-card-plus-hero-showcase-v17`). Ensure its six readings and `sensor.sbcp_docs_solar_forecast` are available. Use the **Capture controls** selector to jump manually, or **Animation Controls → Run / Play** for the continuous sequence. The current phase display tracks playback; Stop pauses at the current position. Previous/next step by named phase and wrap. Keep controls visible only if desired in the eventual image; they are outside the Hero crop.
3. Finish any Visual Editor adjustments first. Press **Stop / Pause**, select **Dawn**, then press **Jump to selected phase** (needed if the selector already showed Dawn). Wait for solar/EV/battery power = 0 W, home/grid = 1100 W and reserve = 38%, then **reload the Hero browser page**. Keep Dawn selected during reload. This creates a fresh battery card initialized at zero. Verify Max and Min both sit at zero. Merely selecting Dawn after a previous run is not a reset.
4. Use a single-column viewport (start at **480 CSS px** wide), sidebar collapsed, browser zoom 100%. Target a **440 CSS px wide Home energy stack**. Use the installation's existing theme; dark is the intended promotional appearance. Crop only the title and four SBCP cards, excluding HA chrome, view tabs and Capture controls. Allow about **560 CSS px** of crop height (roughly **11:14**, 440 × 560); the local component preview's content height is 527 px. HA theme/title metrics can differ, so establish one crop that contains every phase before recording. Keep that crop and viewport fixed throughout.
5. For the automated take, select **1×** and press **Run / Play**. The story follows **Dawn → Morning ramp → Solar surplus → Battery charge → Peak sun → EV plugged in → Cloud passing → Evening import → Night**, with smooth 100 ms updates, eased values, the configured transition durations, 0.25 s intermediate holds and 3 s at Night. Let one loop finish. The speed selector supports 0.5× for inspection through 2× for a shorter capture. For a manual take, select each named phase in the same order; it snaps to the exact table values. Leave the view/crop unchanged and do not open the Visual Editor during recording.
6. Check that Cloud passing sets Min to -1200 W and the evening Grid passes its fixed budget. Night retains Max 1800 / Min -1200. Playback looping does not reset these extrema. For a retake, stop playback, select Dawn, reload the Hero view, verify zero extrema, then start again. Keep the reset/reload outside the eventual animation.
7. Prefer native **440 px** output width; avoid aggressive downscaling of 11–13 px marker/row text. The fixture was also inspected at 400 px width. A later high-density capture may use 880 × 1120 device pixels and export to 440 × 560. Confirm icons, crop bounds and label legibility in actual HA before producing the final GIF. Save the later asset as `images/hero-170.gif`; preserve `images/hero-400.gif`.

This phase only prepares the fixture. No final screenshots or GIF are produced here. A local browser preview used the actual current SBCP source with synthetic states and a simulated HA shell; HA icons were not rendered. That preview does not replace the final manual HA check.

## README Hero Still v1.7

The `sensor-bar-card-plus-readme-hero-still-v17` view provides a deterministic still capture using the same **Home energy** visual card stack as Hero Showcase v1.7. It uses dedicated `sensor.sbcp_docs_static_hero_*` entities. The **Static Capture Controls** card is below the intended screenshot area; capture only the Home energy title and four SBCP cards.

The eight adjustable controls start at these recommended values:

| Control | Default |
|---|---:|
| Solar | 5500 W |
| Solar Forecast | 5900 W |
| Home load | 2300 W |
| EV charging | 3600 W |
| Battery current | -1000 W |
| Battery reserve | 65% |
| Peak setup | +1800 W |
| Floor setup | -1200 W |

Solar, forecast, home, and EV are independent inputs. Grid is not adjustable; it continuously calculates `home + EV + battery - solar` from the controls, so the defaults give `2300 + 3600 - 1000 - 5500 = -600 W`. Positive grid is import and negative grid is export; positive battery power is charging and negative battery power is discharging. Forecast changes independently of actual Solar.

The Battery current control is the desired final value. The displayed `sensor.sbcp_docs_static_hero_battery_power` reads a separate internal driven helper during preparation. The Prepare extrema script reads Peak setup, Floor setup, and Battery current, then drives the sensor through those three values in order, waiting 2 seconds between Peak and Floor and between Floor and the final current. The desired-current control itself stays at its configured value while the sensor is temporarily driven. Peak and Floor remain genuine SBCP session-observed extrema with `reset: never`; they are not generic markers.

**Reset recommended values** restores all eight controls to the defaults above and returns the driven battery sensor to -1000 W. It does not clear Peak/Floor already observed by the card. To prepare a capture, open the static view and refresh the browser page to create a fresh card session, then adjust controls as desired and run **Prepare extrema** below the capture stack. Confirm the displayed Peak/Floor and settled Battery current before capturing.

Moving Peak farther outward (higher) or Floor farther outward (lower) can be done by changing its setup value and running **Prepare extrema** again. To reduce an already-observed Peak or raise an already-observed Floor, refresh/recreate the card first, then run **Prepare extrema** again; the card retains session extrema until recreated. Use **Reset recommended values** separately when you want to restore the eight controls, since it cannot clear that card-local history.

## Fixture validation

- The dashboard and package YAML parse with duplicate-key rejection. All 186 declared fixture helper/entity IDs and 15 view paths are unique. Animated and static Hero sensor references resolve to package entities, and the static preparation script is defined in the package.
- Static Hero defaults, continuously calculated Grid, independent Forecast, separate desired/driven Battery helpers, configured Peak/Floor preparation sequence, and recommended-values reset were checked against the package and dashboard controls.
- All nine keyframes and interpolated positions were evaluated with Jinja2 and checked against the energy equation, displayed scales, forecast values and expected extrema. Playback timing, speed multipliers, phase-step wrapping, manual seeking, and EV ramp math were simulated from the configured controls.
- Current HEAD's SBCP normalizer/validator accepts all four cards and six rows with zero warnings/errors; both generic markers are accepted. Source extrema checks confirm that phase changes preserve the range and a new Dawn card resets it.
- Browser inspection of the actual SBCP component covered Dawn, settled Peak sun at 440 px, settled Evening import at 400 px, and Night/fresh-Dawn extrema. Labels remained readable, the stack height stayed 527 px, and the final range was 1800 / -1200 W. The new HA controls/automations were statically inspected and simulated; no connected Home Assistant instance was used. HA's template update scheduling may add some latency beyond the 100 ms script cadence. Final in-HA control inspection remains manual.
- The pre-existing dashboard and other Phase 2 capture area are byte-identical to the versions before this redesign. The original GIF, runtime source, dist, snapshots, recipes, version and committed Phase 1 documentation remain unchanged. `git diff --check` passes. No runtime unit or Playwright suites were run.

The screenshot dashboard is for manual documentation captures. Keep broad interactive QA in the Playground, copyable configurations in Recipes, compatibility examples in Heritage, and Playwright snapshots as automated regression assets. Do not use regression snapshots as documentation artwork.
