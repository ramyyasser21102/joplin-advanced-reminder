# Feature 09 — Batching, Saved Presets, and Duplicate Prevention

**Status:** Done

## Scope

Redesign of the reminder dialog into grouped, reusable components, plus three
batch-creation capabilities and a dedup guarantee that spans all of them.

- reusable server-side HTML components (button, button group, reminder list)
  and reusable client-side DOM components (batch staging, saved-preset
  picker), replacing the single-file inline markup from Feature 08
- "Add reminder" renamed to "Create reminder", visually and structurally
  distinct from the "Add all (batch)" preset button (different group,
  different color)
- three batch paths: preset "add all", an ad-hoc stage/accept/cancel batch,
  and named saved presets (persisted per-plugin-install via
  `joplin.settings`, reusable across notes)
- duplicate prevention on every creation path — single, preset, both batch
  types, and saved-preset apply

## Files

- `src/types.ts` — `BatchPreset`
- `src/constants.ts` — `BATCH_PRESETS_SETTING_KEY`
- `src/reminder/batchPresetStore.ts` — register/load/save presets via
  `joplin.settings`
- `src/ui/components/button.ts`, `buttonGroup.ts`, `reminderList.ts` —
  server-side HTML builders
- `src/ui/reminderFormHtml.ts` — composition root: Quick add / Custom batch /
  Saved presets / Reminders groups
- `src/ui/dialog/dedupCheck.ts` — client-side duplicate check against
  whatever's currently rendered in the form
- `src/ui/dialog/components/batchStaging.ts` — ad-hoc batch stage/accept/cancel
- `src/ui/dialog/components/presetPicker.ts` — saved-preset apply
- `src/ui/dialog/dialog.ts` — wiring only, now also handling per-item dedup
  messaging for the preset and "add all" paths
- `src/ui/presetNameDialog.ts` — small text-input dialog for naming a new
  preset
- `src/ui/reminderDialog.ts` — loads presets, adds the "Save as preset"
  button, branches on its result, and is the authoritative dedup net at Save
- `src/ui/reminderFormParser.ts` — dedupes the final submitted list, returns
  `duplicateCount`
- `src/ui/dialog/dialog.css` — grouped sections, button variants
- `src/ui/dialog/dialog-theme.css` — dark/light overrides, split out once
  `dialog.css` approached the 180-line modularize threshold
- Tests: `button`, `buttonGroup`, `reminderList`, `batchPresetStore`,
  extended `reminderFormParser`, `reminderFormHtml`, `reminderDialog`

## Design decisions

- **Duplicate = same resolved `at` (minute resolution) within a note.**
  Reuses the existing, already-tested `isDuplicateReminder` as-is — no new
  definition, no note-text comparison (a `Reminder` has no text field, and
  reminders are already scoped per-note by the data model).
- **Two dedup layers, not one.** Every UI path that adds a row (single click,
  preset, "add all", ad-hoc accept, saved-preset apply) checks immediately
  against whatever's currently in the form via `dedupCheck.ts`, for instant
  feedback naming what got skipped. `reminderFormParser.ts` then dedupes the
  final submitted list again at Save — the one choke point every path
  necessarily funnels through, so a bug in any client-side check can't
  actually let a duplicate through.
- **Per-item blocking in batches**, confirmed with the user: a batch creates
  every non-duplicate item and reports what it skipped, rather than failing
  the whole batch over one collision.
- **Ad-hoc "Accept batch" / "Cancel batch" buttons are the confirmation
  step**, not an additional native `confirm()` on top — the two buttons
  themselves are the accept/reject gate the spec asked for.
- **Saved presets store relative offsets, not absolute times**, confirmed
  with the user, so applying "Bedtime prep" later means "now + each offset,"
  not one-time-only saved timestamps. Same shape as the built-in quick
  presets, just user-named and persisted.
- **"Save as preset" is a `setButtons` entry, not an in-page button.**
  `JoplinViewsDialogs` has no live channel while a dialog is open (Feature
  05) and any button click closes the dialog — so persisting a preset can't
  happen without ending the current edit session. Confirmed with the user:
  clicking it closes the reminder dialog, opens a small second dialog to
  name the preset, and does **not** save the current rows to the note —
  saving reminders and saving a preset are separate actions.
- **No new dependency, no framework.** "Reusable components" here means
  small HTML-string builder functions (server side) and small DOM-wiring
  functions (client side) — consistent with the rest of the codebase's
  vanilla TypeScript, not a justification to pull in a UI framework for a
  modal dialog.
