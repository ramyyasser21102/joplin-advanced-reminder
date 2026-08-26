# Feature 15 — Input Validation Audit and Fixes

**Status:** Done

## Scope

Full audit of every path that creates or applies a `Reminder` or
`BatchPreset` — manual entry, Quick Add, Custom Batch staging, Saved
Presets, and the final parse-and-save step — for dumb or malicious input
(past dates, zero/negative durations, overflow, corrupted stored data).
Full findings are in the audit response; this covers the four fixes
selected from it, plus one more found while testing them.

## Files

- `src/reminder/batchPresetStore.ts` — `deleteBatchPresets`; entry
  validation filter (`isValidEntry`) in `normalizeBatchPreset`; preset id
  generation now collision-resistant
- `src/ui/reminderFormParser.ts` — `parseReminderFormData` takes an
  optional `now`, adds `pastCount`; new `parsePresetIdsToDelete`
- `src/ui/dialog/components/batchStaging.ts` — rejects a duration whose
  computed timestamp isn't finite, before staging it
- `src/ui/reminderFormHtml.ts` — "Remove preset" button per saved preset +
  hidden `#delete-preset-ids` field
- `src/ui/dialog/components/presetPicker.ts` — click-to-mark/unmark a
  preset for deletion, accumulating ids into the hidden field
- `src/ui/reminderDialog.ts` — `delete-presets` `setButtons` entry;
  `pastCount` surfaced in the Save warning message
- Tests: extended `batchPresetStore`, `reminderFormParser`,
  `reminderFormHtml`; new `reminderDialogDeletePresets`

## The four fixes

1. **Delete saved presets.** There was no way to remove a bad preset once
   saved — the actual root cause behind "I have a reminder after 0
   seconds": a preset saved before the zero-duration guard existed, with
   no way to get rid of it. Deletion follows the same staged-then-confirm
   pattern as "Save as preset" (in-page click marks/unmarks, a
   `setButtons` entry executes) since persisting still requires closing
   the dialog — no live channel while it's open, per Feature 05.
2. **Validate preset entries at load, not at each use site.** A corrupted
   or legacy-shaped preset entry (non-finite, zero, or negative
   `offsetMs`, non-string `label`) is filtered out in
   `normalizeBatchPreset` — the one place every preset read passes
   through — rather than trusted individually by every chip-render and
   apply call site.
3. **Reject duration overflow before staging.** An absurdly large
   Custom Batch value (e.g. 999999999 years) overflowed `Date` math to
   `NaN`. `JSON.stringify` happened to turn that into `null` on the
   preset-save path (accidentally safe), but "Accept batch" built a real
   row straight from the `NaN` timestamp, rendering as a blank input that
   silently vanished at Save with zero feedback. Now checked with
   `Number.isFinite(at)` right after computing it, with a clear alert
   instead.
4. **Reject past-dated reminders at Save.** Nothing previously stopped a
   manually-entered `datetime-local` value from being in the past — it
   would save successfully, get silently excluded from `todo_due`
   (`getFutureReminders` already only counts `at > now`), and then sit in
   the list forever as a dead entry that can never fire. `at <= now` rows
   are now dropped and counted as `pastCount`, with a message: "N
   reminder(s) were already in the past and removed."

## One more found while testing

**Preset id collisions.** `id: preset-${Date.now()}` — two presets saved
within the same millisecond got the identical id (this is exactly what
happened in a test: two `saveBatchPreset` calls back to back, same
millisecond, same id). Nothing depended on uniqueness before deletion
existed; deletion filters *by* id, so a collision would now delete the
wrong preset(s). Fixed by appending a random suffix:
`preset-${Date.now()}-${random}` — good enough for local, human-paced
preset creation; not a distributed-systems problem that needs a UUID
library.

## Findings not fixed (documented, not actioned)

- Extremely-far-future dates (year 9999+) — harmless, unbounded, not
  fixed.
- Fractional duration values in Custom Batch ("1.5" days) — silently
  floored to 1, no message. Minor UX gap, not a correctness or security
  issue.
- No upper bound on preset entry count — not a real constraint at any
  human-entered scale against local SQLite-backed settings.
