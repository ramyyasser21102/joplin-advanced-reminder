# Feature 12 — Three-Tier Clearing and a Button/Field Variant System

**Status:** Done

## Scope

1. Three distinct "clear" actions, scoped correctly:
   - **Cancel batch** (Custom batch) — already existed; clears only the
     in-progress staged items in that section.
   - **Reset** (Reminders) — new/restored; clears the in-progress rows in
     the main list, client-side only, before Save is ever pressed.
   - **Clear all** (bottom bar) — new; immediately deletes every reminder
     already saved for the note and reconciles `todo_due` to 0, regardless
     of whatever's in the open form.
2. A systematic button variant system (`color` × `style`, shadcn-style) and
   a matching unified field style for text/datetime-local inputs and
   `<select>`, replacing the ad hoc per-id CSS overrides that had
   accumulated (`#add-batch-reminders` orange, `#reset-reminders` red, etc.).

## Files

- `src/ui/components/button.ts` — `ButtonColor` (primary/secondary/danger/
  success/regular) × `ButtonStyle` (filled/outline/ghost), independent axes
- `src/ui/dialog/dialog-buttons.css` — 5 color classes each set
  `--btn-color`/`--btn-color-hover`; 3 style classes consume those
  variables
- `src/ui/dialog/dialog.css` — unified `input[type="text"]`,
  `input[type="datetime-local"]`, `select` styling with a shared focus ring
- `src/ui/dialog/dialog-theme.css` — dark-theme field colors, generalized
  from datetime-local-only to all three field types; ghost/outline hover
  tint for dark mode
- `src/ui/reminderFormHtml.ts` — every button call site now specifies
  `color`/`style`; restored the Reset button in the Reminders group
- `src/ui/dialog/dialog.ts` — restored the client-side Reset handler
- `src/ui/reminderDialog.ts` — `clear-all` added to `setButtons`;
  `clearAllReminders` confirms via `showMessageBox`, then
  `saveReminders(noteId, [])` + `reconcileNoteReminders`
- Tests split: `reminderDialog.test.ts` (core lifecycle),
  `reminderDialogPresets.test.ts` (save-as-preset), `reminderDialogClearAll.test.ts`
  (new) — split because the combined file crossed the repo's 200-line
  ceiling

## Design decisions

- **Two independent variant axes, not one enum per combination.** 5 colors
  × 3 styles as separate CSS classes composed together (`btn btn-danger
  btn-outline`) — implemented via CSS custom properties (`--btn-color`,
  `--btn-color-hover`) that each color class sets and each style class
  consumes. Adding a 6th color or a 4th style is one small class, not N new
  ones.
- **Reset vs Clear all is a persistence boundary, not a wording choice.**
  Reset is a plain in-page button — no confirmation needed beyond a light
  `window.confirm`, since it only ever discards unsaved, in-progress DOM
  state. Clear all is a `setButtons` entry precisely because it must reach
  the main process to delete persisted data — the same constraint
  documented since Feature 05 (no live channel while the dialog is open;
  any button click closes it). It intentionally ignores whatever's in the
  open form; it isn't a "save the form, but empty" action, it's "delete
  what's in storage," full stop.
- **`Clear all` reuses the Feature 11 fix, doesn't bypass it.** It calls
  `saveReminders(noteId, [])`, not `deleteReminders` — writing an explicit
  empty list keeps the note correctly marked as "managed by this plugin,"
  so `importTodoDueReminder` won't treat it as untouched and re-import a
  stray `todo_due` on the next open.
- **Color choices for existing buttons:** Create reminder stays `primary`
  (the one unambiguous "do the main thing" action). Add all / Accept batch
  became `success` (a creation/bulk-confirm action, distinct hue from
  Create reminder so the two can't be confused, per the earlier explicit
  requirement). Cancel batch is `secondary`/`ghost` (low-stakes — nothing
  persisted yet). Reset is `danger`/`outline` (destructive-looking but
  recoverable, hence outline rather than filled). Utility actions (preset
  buttons, Stage reminder, Apply preset) are `regular`/`outline`.
- **Field styling reuses the outline button's visual language** (same
  padding, border, radius) plus a focus ring in the primary color, so a
  text input and an outline button read as one design system rather than
  two unrelated styles — directly addressing "sync styling between buttons
  and inputs."
