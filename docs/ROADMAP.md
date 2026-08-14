# Advanced Reminder — Roadmap

Feature-sized milestones for the remaining implementation work, in dependency order.
Repository scaffolding (generator setup, pnpm, CI, test runner) is already complete.

## Feature 0 — Reminder Scheduling Core (done)

- `src/types.ts`
- `src/reminder/reminderScheduler.ts`
- `tests/reminderScheduler.test.ts`

Pure sort/filter/next-reminder/duplicate-detection logic. No Joplin dependency.

## Feature 1 — Reminder Persistence

- `src/constants.ts`
- `src/reminder/reminderStore.ts`
- `tests/reminderStore.test.ts`

Load/save/delete reminder metadata via Joplin's user-data API, import an existing
`todo_due` value. Owns all persistence; no dialog/UI code.

## Feature 2 — Reminder Reconciliation

- `src/reminder/reminderReconciler.ts`
- `tests/reminderReconciler.test.ts`

Finds the earliest future reminder from the persisted list, compares against
`note.todo_due`, updates Joplin only when needed; handles promotion after an
alarm fires. Depends on Feature 1.

## Feature 3 — Date/Time Utilities

- `src/utils/dateTime.ts`

Local datetime <-> timestamp conversion, valid-date checking. Small,
self-contained; needed by Feature 4.

## Feature 4 — Reminder Dialog UI

- `src/ui/reminderDialog.ts`
- `src/ui/dialog/dialog.ts`
- `src/ui/dialog/dialog.css`
- `plugin.config.json` (`extraScripts`)

Joplin-side dialog controller (create/open/read/validate/save) plus the
browser-side add/remove/render script and its CSS. Depends on Features 1-3.

## Feature 5 — Plugin Wiring

- `src/index.ts`

Replace the generator placeholder with `registerCommands` / `registerToolbar`
/ `registerEventHandlers`, wiring Features 1-4 together. Stays small —
bootstrap only, no logic. Depends on everything above.

## Feature 6 — Release Readiness

Full completion-checklist re-verification, `.jpl` inspection, final
tree/deliverables writeup, confirm `npm run update` upgrade path still works.
Depends on Feature 5.
