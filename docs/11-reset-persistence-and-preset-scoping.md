# Feature 11 — Reset Persistence and Custom-Batch-Only Preset Saving

**Status:** Done

## Scope

Two reported bugs:

1. Resetting/clearing a note's reminders didn't stick — the next time the
   dialog opened, a cleared reminder could reappear, and Joplin's native
   next-alarm (`todo_due`) would reflect it.
2. "Save as preset" saved whatever was in the main **Reminders** list,
   not what was staged in **Custom batch** — so naming and saving a custom
   batch specifically wasn't possible; it always captured the wrong data.

## Files

- `src/reminder/reminderStore.ts` — `importTodoDueReminder` rewritten
- `src/constants.ts` — `BATCH_STAGED_FIELD_NAME`
- `src/ui/dialog/components/batchStaging.ts` — syncs a hidden form field
  with the staged timestamps array
- `src/ui/reminderFormParser.ts` — `parseBatchStagedTimestamps`
- `src/ui/reminderDialog.ts` — `saveCurrentListAsPreset` reads the staged
  field instead of the main reminders list
- `src/ui/reminderFormHtml.ts` — updated Custom Batch description
- Tests: `reminderStore`, `reminderFormParser`, `reminderDialog`

## Design decisions

- **Root cause of the reset bug: `[]` was ambiguous.** `importTodoDueReminder`
  used `existingReminders.length === 0` (via `loadReminders`, which folds a
  never-saved note and an explicitly-emptied one into the same `[]`) to
  decide whether to pull the note's native `todo_due` in as a "new"
  reminder. After Reset + Save, the note's stored list *is* `[]` — indistinguishable
  from a note that has never used this plugin — so the next dialog open
  re-imported whatever `todo_due` currently held (which may be stale, or set
  by an unrelated native Joplin edit) right back into the list, undoing the
  reset.
- **Fix: check for the presence of saved data, not its length.** The
  rewritten `importTodoDueReminder` reads the raw `userDataGet` result
  directly. If any `AdvancedReminderData` was ever saved for the note
  (`!== undefined && !== null`), it's authoritative — including an explicit
  empty list — and `todo_due` is never re-imported again. The one-time
  bridge-import only runs for a note this plugin has genuinely never
  touched. This also means: once a note is managed by this plugin, editing
  its due date through Joplin's own native alarm UI no longer gets folded
  back in on next open — the advanced reminder list is the sole source of
  truth from that point on, matching the request that the native alarm
  should reflect *this* list, not the other way around.
- **Native-alarm reconciliation on every mutating action isn't reachable.**
  The request asked for `todo_due` to "re-check the alarms list on each
  batch/single create/remove/update event" — but every one of those events
  happens client-side, inside the open dialog, with no live channel back to
  the main process (the same constraint documented since Feature 05).
  `reconcileNoteReminders` already runs on every Save, which is the only
  point where a change can reach the main process at all; given that, the
  reset bug above was the actual mechanism making it look like reconciliation
  wasn't happening. No new reconciliation trigger was added — none is
  reachable — but the stale-revival bug that produced the symptom is fixed.
- **Preset scoping needed staged items to exist in `formData` at all.**
  Staged custom-batch items previously lived only in a client-side JS array
  and were rendered as plain (non-input) divs — invisible to `formData` when
  the dialog closes. `saveCurrentListAsPreset` had no choice but to fall
  back to the main Reminders list, which is what the user was seeing.
  Fixed by syncing a single hidden `<input name="batchStagedTimestamps">`
  (JSON-encoded array) alongside the staged list's visible rendering — reusing
  the existing single-form / single-close data-capture mechanism rather than
  adding any new IPC.
- **"Save as preset" now ignores the Reminders list entirely.** If nothing
  is staged in Custom Batch, it shows "Stage at least one reminder in
  'Custom batch' before saving it as a preset" rather than silently falling
  back to the main list — a deliberate scope restriction, not a fallback,
  per the explicit request that it should be Custom-Batch-only.
