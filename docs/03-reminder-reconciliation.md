# Feature 03 — Reminder Reconciliation

**Status:** Not started

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
