# Feature 08 — Quick & Batch Reminder Presets

**Status:** Done

## Scope

Relative-time shortcuts for the existing reminder dialog, so a user isn't
required to type an absolute date/time for common cases.

- a row of preset buttons ("5 min", "10 min", "30 min", "1 hour", "1 day",
  "1 week") — clicking one appends a new reminder row prefilled with
  `now + offset`
- a single "add batch" button that stages all presets at once, gated by a
  confirmation prompt
- no changes to persistence, reconciliation, or scheduling — this only
  changes how rows get *into* the existing form before Save is pressed

## Files

- `src/reminder/quickReminderPresets.ts` — `QUICK_REMINDER_PRESETS` (label +
  offset-in-ms pairs), the single source of truth for both the individual
  buttons and the batch set
- `src/ui/reminderFormHtml.ts` — renders the preset button row
- `src/ui/dialog/reminderRow.ts` — `buildReminderRow` takes an optional
  prefilled `value`
- `src/ui/dialog/dialog.ts` — wires preset button clicks and the batch button
- `src/ui/dialog/dialog.css` — preset button row styling
- `tests/reminderFormHtml.test.ts` — extended for the preset button markup

## Dependencies

- Feature 04 (`formatLocalDateTime`, reused as-is — no new date utility)
- Feature 05 (dialog architecture)

## Design decisions

- **One preset list, two consumers.** Both the individual buttons and the
  batch button read from the same `QUICK_REMINDER_PRESETS` array — no
  separate "batch preset list" to keep in sync.
- **No new dialog, no new command, no new IPC.** Presets append rows to the
  form that's already open, using the same `buildReminderRow` /
  `nextReminderFieldName` mechanism "Add Reminder" already uses. This keeps
  the "no live channel" constraint from Feature 05 irrelevant — nothing here
  needs to talk to the main process mid-dialog.
- **Confirmation uses `window.confirm`, not `showMessageBox`.** Feature 05
  established that `JoplinViewsDialogs` has no `postMessage`/`onMessage`, so
  the main-process-only `showMessageBox` isn't reachable while the dialog is
  open. `window.confirm` runs in the dialog's own webview and needs no IPC.
  Only the batch button is gated — individual preset clicks are a single
  cheap, reversible action (Remove already exists per row).
- **Fixed preset list, not user-configurable.** No settings schema, no
  settings UI, for six hardcoded values. Add a settings-backed list later if
  someone actually asks for different offsets.
- **No new date-math utility.** The offset is `Date.now() + offsetMs`, fed
  straight into the existing `formatLocalDateTime`. A dedicated
  `addOffsetToLocalDateTime` helper would be a one-line wrapper around a
  one-line expression — not worth a new export.
