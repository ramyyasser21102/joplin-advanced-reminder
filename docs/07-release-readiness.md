# Feature 07 — Release Readiness

**Status:** Done

## Completion checklist, verified against actual repo state

- [x] Official Joplin generator used as the foundation (generator-joplin v3.7.2, monorepo version, not the stale standalone repo)
- [x] TypeScript is used
- [x] Plugin name is `Advanced Reminder` (`src/manifest.json`)
- [x] npm package follows `joplin-plugin-*` naming (`joplin-plugin-advanced-reminder`)
- [x] `src/manifest.json` contains a valid Joplin manifest — all fields present
- [x] `src/index.ts` remains small — 14 lines, bootstrap only
- [x] Reminder logic has its own modules (`src/reminder/*`, 6 files, largest is 40 lines)
- [x] Dialog code is separated from reminder business logic (`src/ui/*` vs `src/reminder/*`)
- [x] Pure scheduling logic can be unit tested without Joplin (`reminderScheduler.ts` has no `joplin` import)
- [x] Tests live outside `src/` (`tests/`, 10 files, 39 tests)
- [x] `api/` remains generator-managed — never edited this session
- [x] `webpack.config.js` remains generator-managed — never edited this session
- [x] External TypeScript scripts use `plugin.config.json` (`extraScripts: ["ui/dialog/dialog.ts"]`)
- [x] `dist/`, `publish/`, `node_modules/` all gitignored
- [x] Lockfile committed — `pnpm-lock.yaml` (deviation from spec's literal `package-lock.json`, by explicit decision — see below)
- [x] No direct SQLite/database code (`grep` clean)
- [x] No network or telemetry dependencies (`grep` clean; `dependencies: {}` — everything is devDependencies, bundled at build time)
- [x] Dependencies are minimal (only the generator's own toolchain + vitest)
- [x] `pnpm run dist` succeeds (spec's `npm run dist` — pnpm is this project's package manager)
- [x] A `.jpl` can be generated — `publish/com.advancedreminder.joplin.jpl`
- [x] Development/test files are not bundled — archive contains exactly `index.js`, `manifest.json`, `ui/dialog/dialog.js`, `ui/dialog/dialog.css`
- [x] Git repository is clean after generated build artifacts are ignored — `git status` clean on `release/release-ready`

All 39 tests passing, `tsc --noEmit` clean, full `pnpm install --frozen-lockfile` -> `pnpm test` -> `pnpm run dist` pipeline (matching CI) verified end to end.

## Deviations from the original spec text, with reasons

1. **pnpm instead of npm as the project's package manager.** Explicit user
   decision (repo-setup phase). Confirmed safe because `generator-joplin`'s
   own `index.js` never calls Yeoman's `installDependencies()` — it only
   writes template files, so nothing about scaffolding or the build itself
   assumes a specific package manager. `package-lock.json` -> `pnpm-lock.yaml`
   follows from this.
2. **`"license": "GPL-3.0"` instead of the generator's default `"MIT"`.**
   The repo's initial commit already had a full GPL-3.0 `LICENSE` file
   checked in before any scaffolding happened; the package.json field was
   corrected to match it, by explicit user decision.
3. **`tsconfig.json` has `skipLibCheck`, `paths` (`@/*`, `api`, `api/*`), and
   an `exclude`** beyond the generator's bare default. Each was added to fix
   a real, verified build break (see Features 02 and the update-mechanism
   finding below) — not speculative hardening.
4. **`index.ts` has four `onStart` steps, not the spec's literal three** —
   `reconcileAllNotes()` is a fourth, explicit step (Feature 06), since a
   one-shot startup scan doesn't semantically belong inside "register a
   handler." The spec itself allows this latitude.
5. **Docs live as ordered per-feature files under `docs/`** (`00`-`07`)
   rather than only in chat, by explicit user decision.

## Framework upgradability (`npm run update` / `yo joplin --update`) — actually tested, not assumed

Ran `yo joplin --node-package-manager npm --update --force --silent`
against an isolated scratch copy of the repo (never touched the real
working tree) and diffed the result. Confirmed:

- **`tsconfig.json` is fully regenerated from the generator's template on
  every update** — `skipLibCheck`, the `paths` entries, and the `exclude`
  array are all silently discarded, reverting to the bare
  `{ outDir, module, target, jsx, allowJs, baseUrl }` default. Running
  `pnpm run dist` immediately after an update reproduces the exact same
  failure this project hit during Feature 02 (`tests/*.test.ts`'s top-level
  `await` breaking ts-loader's whole-program check).
- **`package.json` is merged, not overwritten** — the `"license": "GPL-3.0"`
  fix survives — but `"prepare"` gets reset from `"pnpm run dist"` back to
  `"npm run dist"` on conflict.
- **`plugin.config.json` and `webpack.config.js` were untouched** in this
  test run (identical before/after).

**Practical conclusion:** `npm run update` works and is safe to run for
future framework upgrades, but it is not a zero-touch operation for this
project. After running it, three things must be manually reapplied before
`pnpm run dist` will succeed again:

1. `tsconfig.json`: add back `"skipLibCheck": true`, the `paths` block
   (`@/*`, `api`, `api/*`), and `"exclude": ["node_modules", "dist", "publish", "tests", "vitest.config.ts"]`.
2. `package.json`: change `"prepare"` back to `"pnpm run dist"`.
3. Re-run the full verification pipeline (`tsc --noEmit`, `pnpm test`,
   `pnpm run dist`) before trusting the result.

## Real-world testing finding: app_min_version was blocking install

First install attempt on actual Joplin desktop (3.6.15) showed the plugin
toggled on but inert, with "Please upgrade Joplin to version 3.7 or later
to use this plugin." `src/manifest.json`'s `app_min_version: "3.7"` came
from the generator's template as-is and was never actually verified against
what this plugin's code uses.

Checked before changing it, rather than guessing: searched GitHub commit
history for when each Joplin-side API this plugin depends on was added.
`userDataGet`/`userDataSet` (the plugin's core persistence mechanism)
shipped mid-2023; `showToast` (the newest dependency, used by
`reconcileNoteRemindersSafely`) shipped January 2025 — both well before the
3.6/3.7 range. Nothing in this plugin's actual API usage requires 3.7
specifically; the generator's default just reflects whatever Joplin version
was current when the template was last stamped.

**Fix:** lowered `app_min_version` to `"3.6"` to match the tested install,
by explicit user decision after being offered the alternative (upgrade
Joplin instead). Rebuilt and reverified: `.jpl`'s embedded manifest
confirmed at `3.6`, all 39 tests still pass. This is deviation #6 alongside
the five listed above.

## Deliverable

`publish/com.advancedreminder.joplin.jpl` — install via Joplin's
Options > Plugins > "Install from file". Verified working manifest
(`app_min_version: 3.6`) confirmed inside the built archive.
