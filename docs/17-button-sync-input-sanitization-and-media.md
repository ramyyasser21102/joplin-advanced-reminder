# Feature 17 — Button Consistency, Number Input Sanitization, and Plugin Media

**Status:** Done

## Scope

Four requests: sync danger-button styling, sync "add all"-family button
text, block scientific-notation input in Custom Batch's duration fields,
and investigate the plugin's broken icon / thin tags in Joplin's plugin
catalog plus an outdated README.

## 1. Danger button style sync

Reset (`danger`/`outline`) and Remove preset (`danger`/`ghost`) used
different styles despite the same color — now both `danger`/`outline`.

Also fixed a related bug while touching this: `showConfirmNotice`'s
Confirm button was hardcoded to `danger` regardless of what it was
confirming, so "Add all 6 quick-add presets?" showed an alarming red
Confirm button for a perfectly ordinary additive action. `showConfirmNotice`
now takes a `tone` parameter (`danger` | `success` | `neutral`, default
`neutral`) and every call site passes the tone matching its actual
severity: Reset → `danger`, both "Add all" confirms (quick-add batch,
saved-preset batch) → `success`.

## 2. Button text sync

`"Add all (batch)"` (Quick add) → `"Add all"`, matching Saved Presets'
existing `"Add all"` — the `"(batch)"` suffix was redundant with the
"Quick add" section heading it already sits under.

**Left unchanged, deliberately:** `"Stage reminder"` / `"Accept batch"` /
`"Cancel batch"` in Custom Batch. These describe a genuinely different
two-step flow (stage, then accept-or-cancel) from the other sections'
single-click add — renaming "Accept batch" to "Add all" would blur that
distinction rather than clarify it, and breaks its natural pairing with
"Cancel batch". If this isn't what was meant by "syncing... accept batch",
say so and it can be revisited.

## 3. Number input sanitization

`<input type="number">` natively accepts `e`, `+`, `-`, and `.` as valid
partial input (scientific-notation support) regardless of `min="0"` — so
Custom Batch's duration fields accepted things like `1e10` that don't look
like a plain whole number at all. HTML attributes can't fully suppress
this; the only real fix is stripping at the keystroke.

`batchStaging.ts` now attaches an `input` listener to all six duration
fields that strips anything except `0-9` in real time (paste included,
since paste also fires `input`), capped at 6 digits. The existing
`Number.isFinite(at)` overflow check (Feature 15) stays as a second,
independent layer — this closes the entry point, that catches whatever
still gets through.

## 4. Plugin media

**Icon not rendering / empty tags — root cause found, not a local bug.**
This plugin **is** published and registered in Joplin's central plugin
repository already (confirmed by querying
`raw.githubusercontent.com/joplin/plugins/master/manifests.json` directly)
— but at version 1.0.0, frozen at an old commit from before most of this
feature work, with `keywords: []` and `categories: []` — which exactly
matches the blank "Tags" row in the screenshot. The icon file itself is
fine (verified: correctly-sized square PNGs, and the raw GitHub URLs
Joplin would fetch them from return `200 image/png` for both the pinned
old commit and current `main`) — so the broken icon isn't a missing or
malformed asset, it's tied to that same stale registered entry somehow
not resolving it. **Fixing this requires publishing a new version to
npm** — that's an external, credentialed action only reachable with your
own npm account, so it wasn't done here. What *was* done: `src/manifest.json`
now has real `keywords` (reminder, reminders, alarm, todo, to-do,
productivity, batch, preset, scheduling) and `categories` (`productivity`
— confirmed against the actual canonical list used by every other
registered plugin, not guessed), so whenever a new version does get
published, the richer metadata publishes with it.

**README** rewritten: Features section now covers Quick add, Custom
batch, Saved presets (with descriptions and deletion), Reset vs. Clear
all, duplicate prevention, and input validation — previously only
described the original single-dialog multi-reminder feature. Usage section
walks through all four creation paths. Project Status notes the
published/local version gap.

## Files

- `src/ui/dialog/notice.ts` — `showConfirmNotice` gains a `tone` parameter
- `src/ui/dialog/dialog.ts`, `components/presetPicker.ts` — pass tones at
  each confirm call site
- `src/ui/reminderFormHtml.ts` — Remove preset button style; "Add all"
  label
- `src/ui/dialog/components/batchStaging.ts` — `sanitizeDurationField`,
  `DURATION_UNITS`/`getDurationField` hoisted to remove a third
  duplicated unit-list literal
- `src/manifest.json` — keywords, categories
- `README.md` — Features, Usage, Installation, Project Status
- Tests: extended `reminderFormHtml.test.ts` for the button-text and
  style-sync changes
