# Feature 06 — Plugin Wiring

**Status:** Done

## Scope

Replace the generator's placeholder `onStart` with real bootstrap/wiring.
`index.ts` wires components together, no business logic.

## Files

- `src/index.ts` — bootstrap, four `onStart` steps (see deviation below)
- `src/registerCommands.ts` — registers `MANAGE_COMMAND`, `enabledCondition: 'noteIsTodo'`
- `src/registerToolbar.ts` — one toolbar button bound to `MANAGE_COMMAND`, `ToolbarButtonLocation.NoteToolbar`
- `src/registerEventHandlers.ts` — `onNoteAlarmTrigger` -> `reconcileNoteRemindersSafely`
- `src/reminder/reminderStartupSync.ts` — `reconcileAllNotes()`, the startup catch-up pass
- `src/reminder/reconcileNoteRemindersSafely.ts` — shared try/catch + toast wrapper around `reconcileNoteReminders`
- `tests/registerCommands.test.ts` (3), `tests/registerEventHandlers.test.ts` (1),
  `tests/reminderStartupSync.test.ts` (4), `tests/reconcileNoteRemindersSafely.test.ts` (2)

## Dependencies

- Features 02–05 (store, reconciler, dialog)

## Cross-feature fix: importTodoDueReminder was orphaned

`reminderDialog.ts` (Feature 05) called `loadReminders(noteId)`. Nothing
anywhere called `importTodoDueReminder` (Feature 02) — fully built and
tested, but never wired to anything. Fixed by swapping that one call:
`importTodoDueReminder` already does load + merge-in-any-native-`todo_due` +
conditional-save, a strict superset of `loadReminders`. Without this, a note
with a pre-existing native reminder (set before installing the plugin, or
via Joplin's own UI) would never show up in the dialog.

## Deviation from the spec's literal 3-function example

`index.ts` has four `onStart` steps, not three — `reconcileAllNotes()` is
called explicitly after the other three. A one-shot startup scan doesn't
semantically belong inside "register a handler," so it isn't folded into
`registerEventHandlers`. The spec itself allows this ("the exact functions
can be introduced during implementation").

## Startup catch-up (reconcileAllNotes) — confirmed necessary, not assumed

Checked Joplin's own alarm system before deciding this was needed
(`packages/lib/services/AlarmService.ts`, `AlarmServiceDriverNode.ts`,
`Note.dueNotes()`):

- `Note.dueNotes()`'s SQL is `WHERE ... todo_due > ?` (strictly future) —
  Joplin's own startup routine (`updateAllNotifications`) explicitly
  **excludes** notes whose due time already passed. It garbage-collects
  their stale alarm record and does not re-fire anything for them.
- The plugin-facing `onNoteAlarmTrigger` event traces back to
  `eventManager.emit(EventName.NoteAlarmTrigger, ...)` inside a
  `setTimeout` callback in `AlarmServiceDriverNode.ts` — so it only fires
  for alarms actually scheduled while the app is running, never
  retroactively for a note whose reminder time passed while Joplin was
  closed.
- Conclusion: if the app is closed when a reminder should promote to the
  next one, nothing tells the plugin about it — `todo_due` sits stale until
  the user happens to open the dialog and hit Save. `reconcileAllNotes()`
  on `onStart` closes this gap.

**Design of the scan:** pages through `/notes` (`fields: ['id', 'is_todo']`,
confirmed against Joplin's actual REST API pagination contract —
`{items, has_more}`, `page`/`limit` params, max 100/page — rather than
assumed). Skips non-todo notes. For todo notes, calls `loadReminders` first
and skips if empty — **this is the important guard**: it's what stops the
scan from touching `todo_due` on notes that never used this plugin at all.
Without it, a plain to-do note with its own native due date (never opened in
our dialog) would get its `todo_due` silently cleared to `0` by reconcile,
since an empty stored list means "no future reminder." Only notes with our
own stored reminder data get reconciled.

## Error handling: shared safe wrapper, not a silent catch

`reconcileNoteRemindersSafely` wraps `reconcileNoteReminders` in try/catch;
on failure it `console.error`s and calls `joplin.views.dialogs.showToast`
with `ToastType.Error`, so a failure is visible to the user instead of
vanishing into a console they'll likely never open. Used by both
`registerEventHandlers` (the alarm-trigger handler) and
`reminderStartupSync` (the catch-up scan) — one shared piece, not
duplicated try/catch logic in two places.
