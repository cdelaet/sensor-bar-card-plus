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

The build retains ES2018 lowering while preserving native dynamic import and `import.meta`. A deterministic pair identity hashes source, build script, package metadata, lockfile and esbuild version/options, excluding checkout paths. The companion exports that identity and its two constructors without registering elements. The core imports the fixed companion filename relative to its own module URL with a SHA-256 of final companion bytes in `sbcp_build`. It validates exact identity, runtime ownership and both editor tags before registering either. An explicit failed editor attempt can retry once using `sbcp_retry=1`; further failures require refresh. Display remains available if editor loading fails.

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
npm run test:visual
npm run verify-dist
npm test
~~~

`npm test` runs the build, unit tests, and Playwright visual tests in sequence. The unit suite checks configuration normalization, conversion, formatting, and card behavior. The Playwright suite checks rendered behavior including fill and Baseline cases, Target/Peak/Floor and generic reference markers, marker shapes and labels, responsive layouts, and clipping or rounded-edge regressions.

GitHub's **Fast Validation** (`.github/workflows/validate.yml`) runs HACS validation, verifies both production bundles and their ESM syntax, runs focused native-browser lazy-loading checks, and runs unit tests on pushes to `main` and pull requests. It does not run the complete Playwright suite on ordinary pushes or pull requests.

Before preparing a release, explicitly run **Full Validation** for the intended commit:

~~~sh
gh workflow run full-validation.yml --ref main
~~~

Full Validation runs HACS validation, dist verification, unit tests, and the complete Chromium and WebKit Playwright suite on macOS. The workflow run is tied to the exact `main` commit selected at dispatch; its run page and job summaries identify that SHA. Release preparation requires this successful Full Validation result for the exact same SHA; a successful Fast Validation run alone is insufficient.

## Visual regression snapshots

Playwright visual baselines are intentionally environment-specific. Local macOS tests use the complete `tests/visual/snapshots/local/` set; GitHub Actions on `macos-26` uses the complete `tests/visual/snapshots/ci/` set. The baseline set is selected centrally by `SBCP_VISUAL_BASELINE` in `playwright.config.cjs`. Normal local and CI validation never updates snapshots.

Run `npm run test:visual` to compare against local baselines. After an intentional visual change, run `npm run test:visual:update` to update only the local set, then review and commit the image changes with the code. Local snapshots remain local and developer-specific. Canonical CI snapshots are generated on GitHub's `macos-26` runner. Full Validation checks the committed canonical set with snapshot updates disabled.

After the canonical snapshot-update workflow is merged to `main`, the preferred workflow for an intentional visual change is to dispatch it from trusted `main` and provide the source branch:

~~~sh
gh workflow run update-snapshots.yml \
  --ref main \
  -f source_branch=<branch>
~~~

For intentional snapshot additions, deletions, or renames, explicitly allow snapshot-set changes:

~~~sh
gh workflow run update-snapshots.yml \
  --ref main \
  -f source_branch=<branch> \
  -f allow_snapshot_set_changes=true
~~~

The workflow generates the complete CI snapshot set and creates or updates a dedicated pull request targeting the source branch. The generated image changes still require human visual review before merging. Full Validation is dispatched separately for the generated branch. The earlier `gh workflow run validate.yml --ref <branch> -f generate_snapshots=true` artifact workflow remains available for diagnostics or as a fallback; it uploads the full `canonical-playwright-snapshots-<commit-sha>` artifact for manual comparison. When adding a screenshot assertion, update each complete set through these same local and GitHub-specific steps. These automated regression artifacts are not README or product screenshots.

## Release preparation

After Full Validation succeeds for the current `main` commit, prepare the release draft:

~~~sh
gh workflow run release-dist.yml --ref main -f version=1.8.0 -f title="Native Card Feature for Home Assistant Tile cards"
~~~

The Release workflow checks that its commit is still the tip of `main`, requires successful Full Validation for that exact SHA, checks that the requested version matches `package.json`, refuses an existing tag or release, verifies both tracked dist files, and records each SHA-256 and size. It then creates and pushes the annotated `vX.Y.Z` tag, creates a DRAFT GitHub Release with the supplied title, and uploads the editor followed by the core. It verifies the exact two-asset set and downloads both to check bytes, hashes and sizes. The workflow never publishes the release.

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
