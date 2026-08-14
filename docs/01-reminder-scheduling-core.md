# Feature 01 — Reminder Scheduling Core

**Status:** Done

## Scope

Pure sort/filter/next-reminder/duplicate-detection logic for reminders. No
Joplin dependency — testable in plain TypeScript.

## Files

- `src/types.ts` — `Reminder`, `AdvancedReminderData`
- `src/reminder/reminderScheduler.ts` — `sortReminders`, `getFutureReminders`,
  `getNextReminder`, `isDuplicateReminder`
- `tests/reminderScheduler.test.ts`

## Dependencies

None.
