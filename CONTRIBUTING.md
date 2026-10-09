# Contributing

Thanks for helping improve Sensor Bar Card Plus. For user-facing behavior and YAML options, see the [README](README.md) and [configuration reference](docs/configuration.md).

## Development setup

Install the project dependencies and Chromium for Playwright:

~~~sh
npm install
npx playwright install chromium
~~~

## Source and generated bundle

Implement card changes in `src/`. `npm run build` uses esbuild to generate the minified production bundle at `dist/sensor-bar-card-plus.js`. This file is tracked in Git and is the JavaScript resource distributed for Home Assistant and HACS. When a source or build change affects the distributable, regenerate and include it with `npm run build`. Do not edit the generated bundle by hand.

~~~sh
npm run build
npm run verify-dist
~~~

`npm run verify-dist` performs a fresh production build in a temporary location and byte-compares it with the tracked bundle. It reports a missing or stale `dist/sensor-bar-card-plus.js` and does not rewrite that file, so it is the non-mutating check that the committed bundle matches the current source and build configuration.

## Tests and validation

The package scripts in `package.json` are:

~~~sh
npm run test:unit
npm run test:visual
npm run verify-dist
npm test
~~~

`npm test` runs the build, unit tests, and Playwright visual tests in sequence. The unit suite checks configuration normalization, conversion, formatting, and card behavior. The Playwright suite checks rendered behavior including fill and Baseline cases, Target/Peak/Floor and generic reference markers, marker shapes and labels, responsive layouts, and clipping or rounded-edge regressions.

GitHub's **Fast Validation** (`.github/workflows/validate.yml`) runs HACS validation, verifies the production bundle and its syntax, and runs unit tests on pushes to `main` and pull requests. It does not run the complete Playwright suite on ordinary pushes or pull requests.

Before preparing a release, explicitly run **Full Validation** for the intended commit:

~~~sh
gh workflow run full-validation.yml --ref main
~~~

Full Validation runs HACS validation, dist verification, unit tests, and the complete Chromium and WebKit Playwright suite on macOS. The workflow run is tied to the exact `main` commit selected at dispatch; its run page and job summaries identify that SHA. Release preparation requires this successful Full Validation result for the exact same SHA; a successful Fast Validation run alone is insufficient.

## Visual regression snapshots

Playwright visual baselines are intentionally environment-specific. Local macOS tests use the complete `tests/visual/snapshots/local/` set; GitHub Actions on `macos-26` uses the complete `tests/visual/snapshots/ci/` set. The baseline set is selected centrally by `SBCP_VISUAL_BASELINE` in `playwright.config.cjs`. Normal local and CI validation never updates snapshots.

Run `npm run test:visual` to compare against local baselines. After an intentional visual change, run `npm run test:visual:update` to update only the local set, then review and commit the image changes with the code. Once reviewed, generate the GitHub canonical set by running `gh workflow run validate.yml --ref main -f generate_snapshots=true`; download and review the `canonical-playwright-snapshots-<commit-sha>` artifact, then commit those files under `snapshots/ci/`. The manually dispatched snapshot-generation run selects and updates only the CI set. Fast and Full Validation compare against their selected baselines with snapshot updates disabled. When adding a screenshot assertion, update each complete set through these same local and GitHub-specific steps. These automated regression artifacts are not README or product screenshots.

## Release preparation

After Full Validation succeeds for the current `main` commit, prepare the release draft:

~~~sh
gh workflow run release-dist.yml --ref main -f version=1.8.0 -f title="Native Card Feature for Home Assistant Tile cards"
~~~

The Release workflow checks that its commit is still the tip of `main`, requires successful Full Validation for that exact SHA, checks that the requested version matches `package.json`, refuses an existing tag or release, verifies the tracked `dist/sensor-bar-card-plus.js`, and checks the bundle's SHA-256. It then creates and pushes the annotated `vX.Y.Z` tag, creates a DRAFT GitHub Release with the supplied title, and attaches that exact tracked JavaScript file. The workflow never publishes the release.

After the workflow succeeds, open the draft GitHub Release, paste and review the canonical release notes from the private `private/WHATS-NEW.md`, verify the title, notes, tag, and attached JavaScript, then manually click **Publish release**.

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
