# Feature 05 — Reminder Dialog UI

**Status:** Not started

## Scope

Joplin-side dialog controller plus the browser-side dialog script and its
styling.

- create the Joplin dialog
- load reminder state, pass it into the dialog, open the dialog
- read and validate the result; save only when Save is selected
- browser-side: add/remove reminder rows, local form validation, render the
  current list

No scheduling algorithms in the controller. No Joplin persistence calls in
the browser-side script — the main plugin process owns persistence.

## Files

- `src/ui/reminderDialog.ts`
- `src/ui/dialog/dialog.ts`
- `src/ui/dialog/dialog.css`
- `plugin.config.json` (`extraScripts: ["ui/dialog/dialog.ts"]`)

## Dependencies

- Feature 02 (`reminderStore`)
- Feature 03 (`reminderReconciler`)
- Feature 04 (`dateTime` formatting/parsing for the form)
