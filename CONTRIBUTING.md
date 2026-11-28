# Contributing

Thanks for helping improve Sensor Bar Card Plus. For user-facing behavior and YAML options, see the [README](README.md) and [configuration reference](docs/configuration.md).

## Development setup

Install the project dependencies and Chromium for Playwright:

~~~sh
npm install
npx playwright install chromium
~~~

## Source and generated bundles

Implement card changes in `src/`. `npm run build` uses two independent esbuild builds to generate the tracked, self-contained ESM artifacts `dist/sensor-bar-card-plus.js` and `dist/sensor-bar-card-plus-editor.js`. Install both in the same directory; register only the core as a Home Assistant JavaScript Module resource. Card and Card Feature runtimes load immediately; their async `getConfigElement()` factories share one lazy editor import and return fresh editor instances. When source or build inputs change, regenerate and include both files. Do not edit generated bundles by hand.

The build retains ES2018 lowering while preserving native dynamic import and `import.meta`. A deterministic pair identity hashes source, build script, package metadata, lockfile and esbuild version/options, excluding checkout paths. The companion exports that identity and its two constructors without registering elements. The core imports the fixed companion filename relative to its own module URL with a SHA-256 of final companion bytes used as the `sbcp_build` cache-busting query key. It does not hash the fetched companion at runtime; integrity relies on the companion's exported deterministic build identity matching the core, plus runtime-ownership and editor-tag preflight before either tag is registered. An explicit failed editor attempt can retry once using `sbcp_retry=1`; further failures require refresh. Display remains available if editor loading fails.

~~~sh
npm run build
npm run verify-dist
~~~

`npm run verify-dist` builds into a fresh temporary directory and verifies the exact two production filenames and bytes against tracked dist. Missing, stale or unexpected SBCP production artifacts fail verification. It never rewrites dist or deletes unrelated files. There are no generated chunks, hashed installed filenames, manifest requests or ZIP assets.

For source-mode browser development, run `node tests/visual/server.cjs` and open `http://127.0.0.1:4173/tests/visual/fixtures/harness.html`. The server supplies a current source fingerprint to the loader and companion, with distinct provenance from production. Refresh after source edits; a changed companion cannot be accepted by an older source runtime. Raw source files served without these development defines cannot open visual editors. Add `?source=dist` to test the installed production pair. For development in Home Assistant, copy both built files to the same development directory and register only that directory's core module.

Do not load regular and development SBCP resources together. The first registered runtime wins; unproven or mixed editor ownership fails with a refresh/conflict message. Custom elements cannot be replaced within a page. On manual upgrade, replace editor first, then core, and refresh Home Assistant. HACS 2.0.5 or newer uses normal release assets; upload/install ordering does not make installation atomic. Fixed filenames need no stale-hash cleanup.

## Tests and validation

The package scripts in `package.json` are:

~~~sh
npm run test:unit
npm run test:visual:fast
npm run test:visual:complete
npm run test:visual
npm run verify-dist
npm test
~~~

`npm run test:visual:fast` runs high-value Chromium and WebKit browser journeys for lazy editor loading, source/dist Paint editing, Target Paint lifecycle, and keyboard navigation. Use it during everyday development. `npm run test:visual:complete` runs the complete Chromium/WebKit suite with two workers and snapshot updates disabled. Run this once locally before release candidates. `npm test` retains the build, unit, and complete visual sequence.

The visual harness gives every test its normal fresh Playwright context and page. To contain WebKit's long-run process leak, its worker fixture recycles the local WebKit browser after 50 completed contexts when none are active. Tracing remains on Playwright's normal test lifecycle; Chromium and remote `connectOptions` browsers are not recycled. The fixture reads Playwright's internal `_browserOptions` worker fixture so launch settings and trace directories stay consistent. A unit test asserts this fixture is still registered by the pinned Playwright version; review the compatibility assertion when upgrading Playwright.

GitHub's **Fast Validation** (`.github/workflows/validate.yml`) runs HACS, verifies committed dist reproducibility and ESM syntax, runs the complete unit suite, and runs the focused Chromium/WebKit browser regression on pushes to `main` and pull requests. Scheduled runs only perform HACS validation and cannot qualify a release. The browser smoke job checks both source and dist where the journey covers both. The exhaustive browser suite remains available as an optional manually dispatched workflow.

The developer's MacBook is the primary environment for complete visual regression testing. Release preparation requires successful Fast Validation for the exact current `main` SHA; the manual Full Validation workflow is optional and is not a release prerequisite.

## Visual regression snapshots

The single canonical Playwright snapshot set is stored under `tests/visual/snapshots/`, without an OS-version suffix. Snapshots cover SBCP-rendered bars, gradients, markers, labels, feature output and responsive composition. Editor controls use state/configuration, keyboard and geometry/containment assertions instead of pixel comparisons, since checkbox and select appearance is controlled by the OS. The visual harness pins locale and accent color.

Run `npm run test:visual:complete` to compare against the canonical snapshots. After an intentional rendering change, generate snapshots locally with `npm run test:visual:update`, inspect every changed image, and commit only reviewed baselines. CI uses updates disabled and never generates or uploads replacement baselines. The comparator keeps its existing 50-pixel, 0.2 threshold for small rasterization differences; it is not raised to absorb layout or appearance changes.

## Release preparation

Before preparing a release candidate, set `package.json` to the intended version. If source or any build input changes, run `npm run build`, include both regenerated dist files, and confirm them with `npm run verify-dist`. The version, source and matching dist pair must be committed together.

After the change is merged, wait for Fast Validation triggered by the push to the current `main` commit. The release workflow accepts only that successful Fast Validation push run for the exact `main` SHA; a branch dispatch, pull request run, or scheduled HACS-only run does not qualify. Then prepare the release draft:

~~~sh
gh workflow run release-dist.yml --ref main -f version=1.11.0 -f title="Universal Paint and Dashboard Presets"
~~~

The Release workflow checks that its commit is still the tip of `main`, requires successful Fast Validation from a `push` event for that exact SHA (scheduled HACS-only and pull request runs do not qualify), checks that the requested version matches `package.json`, refuses an existing tag or release, verifies both tracked dist files, and records each SHA-256 and size. It then creates the annotated `vX.Y.Z` tag through the GitHub API, creates a DRAFT GitHub Release with the supplied title, and uploads the editor followed by the core. It verifies the exact two-asset set and downloads both to check bytes, hashes and sizes. The workflow never publishes the release.

After the workflow succeeds, open the draft GitHub Release, paste and review the canonical release notes from the private `private/WHATS-NEW.md`, verify the title, notes, tag, and both attached JavaScript files, then manually click **Publish release**. Never publish an incomplete draft or a draft from a failed preparation run; repair and verify both matching assets first.

## Development and demo fixtures

The Home Assistant YAML fixtures and their shared helpers are under `examples/`:

- `examples/dashboards/sensor-bar-card-plus-playground.yaml` is the interactive feature and QA playground.
- `examples/dashboards/sensor-bar-card-plus-screenshots.yaml` is the screenshot board for curated documentation captures and visual review.
- `examples/dashboards/sensor-bar-card-plus-recipes.yaml` collects the practical recipe cards listed in the [recipe catalogue](examples/recipes/README.md).
- `examples/dashboards/sensor-bar-card-plus-heritage.yaml` compares legacy and structured configuration for compatibility.
- `examples/packages/sensor_bar_card_plus_playground_package.yaml` supplies the template sensors and helpers used by the dashboards.

These fixtures have separate roles. Keep broad interactive exploration, curated captures, practical recipes, and compatibility demonstrations distinct.

## Documentation screenshots

README and documentation images are manually curated assets under `images/`. They may be captured from the screenshot dashboard or Home Assistant when an editor view is needed. These assets are separate from the Playwright snapshots described above. A detailed capture procedure has not been established yet; avoid treating test snapshots as substitutes for documentation images.

## Contribution workflow

1. Make focused changes in `src/` and update or add relevant tests for behavior changes.
2. Run the appropriate test commands and build the distributable when source changes require it.
3. Check the Playground and screenshot board for user-facing layout or rendering changes.
4. Update user documentation when behavior or configuration changes, keeping conceptual guidance in the README and exhaustive field detail in `docs/configuration.md`.
5. Open a pull request with a concise description of the change and its validation.
