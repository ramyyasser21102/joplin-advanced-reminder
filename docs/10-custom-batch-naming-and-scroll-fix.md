# Feature 10 — Custom Batch Naming, Sanitization, and Dialog Scroll Fix

**Status:** Done

## Scope

Follow-up pass on Feature 09 addressing three reported gaps:

1. The dialog didn't scroll when its content overflowed the fixed 90vw/80vh
   canvas — rows past the visible area were just clipped, with no scrollbar.
2. The client-side duplicate check silently never fired for preset/batch
   adds — a real bug, not a semantic gap.
3. The "Custom batch" section had no way to name a batch inline; naming only
   happened after closing the dialog via the footer "Save as preset"
   button, and a saved name was interpolated into the presets `<option>`
   list without HTML-escaping.

## Files

- `src/ui/dialog/dialog.css` — `html`/`body`/`form` switched from
  percentage-based heights to `100vh` + `overflow-y: auto` on `form`
- `src/ui/dialog/dialog-buttons.css` — split out of `dialog.css` (button/
  variant rules) once the file approached the 180-line threshold again
- `src/utils/dateTime.ts` — `roundToMinute`
- `src/ui/dialog/dialog.ts`, `src/ui/dialog/components/presetPicker.ts` —
  use `roundToMinute` before the dedup check and before building the row
- `src/utils/html.ts` — `escapeHtml`
- `src/reminder/presetNameValidation.ts` — `sanitizePresetName`,
  `PRESET_NAME_MAX_LENGTH`
- `src/ui/reminderFormHtml.ts` — inline `#batch-preset-name` field in the
  Custom Batch group; `escapeHtml` applied to preset names in the saved
  presets `<option>` list
- `src/ui/reminderDialog.ts` — `resolvePresetName` reads the inline field
  first, sanitizes it, and only falls back to the naming popup
  (`presetNameDialog.ts`) when the inline field was left blank
- `src/ui/presetNameDialog.ts` — popup path now runs the same
  `sanitizePresetName` check, with an explicit message on invalid input
  (previously: silent trim + non-empty check only)
- Tests: `dateTime`, `html`, `presetNameValidation`, extended
  `reminderFormHtml`, `reminderDialog`

## Design decisions

- **The dedup "bug" was a resolution mismatch, not a missing check.**
  `Reminder.at` and every `datetime-local` value are minute-precision (no
  seconds field), but candidates computed as `Date.now() + offsetMs` carry
  live seconds/milliseconds. Comparing an unrounded candidate against
  minute-rounded listed values meant an exact repeat click essentially never
  matched — the duplicate check was running, just against numbers that could
  never be equal. `roundToMinute` performs the same format→parse round-trip
  `formatLocalDateTime` already applies to a value before it's ever stored,
  so the check and the eventual stored value now agree.
- **Scroll fix uses `100vh`, not `100%`.** Percentage heights require an
  unbroken chain of ancestors with explicitly defined heights; if anything
  in Joplin's dialog rendering breaks that chain, `height: 100%` silently
  resolves to `auto` and no scrolling occurs — which is what the screenshot
  showed happening. `vh` units are always relative to the viewport
  regardless of the ancestor chain, sidestepping the issue entirely.
  `overflow: hidden` on `html`/`body` keeps `form` as the single scroll
  container, avoiding a double scrollbar.
- **Inline name field lives in the Custom Batch group, not a new dialog.**
  Since all dialog inputs share one `<form name="reminders">`, adding a
  plain `<input name="batchPresetName">` there means its value already
  rides along in `formData` on every close, including a `save-preset`
  click — no new IPC, no new dialog trip needed to read it.
  `reminderFormParser.ts` already ignores any field name that isn't
  prefixed `reminder-`, so this doesn't interfere with reminder parsing.
- **Fallback, not replacement.** If the inline field is left blank,
  `resolvePresetName` still opens the existing naming popup — nobody who
  used the old flow loses it; the inline field is just a faster path when
  the user already knows they're building a reusable batch.
- **Validation rejects rather than silently mutates.** `sanitizePresetName`
  returns `null` for empty, over-length, or disallowed-character input
  instead of truncating or stripping — the caller then tells the user why,
  rather than saving something they didn't type. Two independent layers:
  rejection at save time (`sanitizePresetName`) and escaping at render time
  (`escapeHtml`), so a name that somehow got persisted invalid (a future
  code path, manual settings edit) still can't break the generated HTML.
- **Persistence-on-reopen required no new code.** `openReminderDialog`
  already calls `loadBatchPresets()` on every open and threads the result
  into `buildReminderFormHtml` (Feature 09) — saved presets showing up
  after an app restart was already correct; the gap was specifically the
  lack of an inline naming affordance and its sanitization.
