# Feature 03 — Reminder Reconciliation

**Status:** Done

## Scope

Coordinate persisted reminder state with Joplin's native `todo_due`.

- find the earliest future reminder in the persisted list
- compare with `note.todo_due`
- update Joplin only when necessary
- handle promotion of the next reminder after an alarm fires

## Files

- `src/reminder/reminderReconciler.ts`
- `tests/reminderReconciler.test.ts` (mocked Joplin boundary)

## Dependencies

- Feature 01 (`getNextReminder`)
- Feature 02 (`reminderStore` load/save)

## Design decisions

- `reconcileNoteReminders(noteId, now = Date.now())` is read-only against our
  own persisted reminder list — it never deletes or mutates stored reminders,
  even ones already in the past. Each call just re-filters the unchanged list
  against the current `now`. A fired reminder simply stops qualifying as
  "future"; it isn't removed. This avoids silently losing the user's
  configured history.
- When no future reminder remains, `todo_due` is cleared to `0` (Joplin's
  "unset" convention, same as `reminderStore.importTodoDueReminder`) rather
  than left pointing at a stale past time.
- `now` is a parameter, not read internally via `Date.now()` — this module
  has no timer or polling loop of its own. It's purely reactive.

## Confirmed trigger points (for Feature 06 to wire up)

Checked `api/JoplinWorkspace.d.ts` rather than assuming a polling design:

- `joplin.workspace.onNoteAlarmTrigger` — Joplin pushes `{ noteId }` exactly
  when a native to-do alarm fires. This is the "promotion" trigger; no timer
  needed.
- Right after the dialog's Save action (edit-driven).
- Possibly once on plugin startup, as a missed-alarm catch-up pass — not yet
  decided, deferred to Feature 06.

Deliberately not wired to `onNoteChange` (fires on *any* note property
change, including our own `todo_due` writes) — would risk redundant/cascading
reconcile calls off our own writes.
