# Feature 14 — Preset Entry Chips, Descriptions, and Save-Button Scoping

**Status:** Done

## Scope

Three requests:

1. Move "Save as preset" into the Custom Batch section.
2. Render saved presets like Quick Add — each preset's individual times as
   clickable "After X" chips, plus a batch "Add all" — instead of a
   `<select>` dropdown.
3. An optional description field per preset.

## Files

- `src/types.ts` — `BatchPresetEntry{offsetMs,label}`; `BatchPreset` gains
  `description` and `entries` (replacing `offsetsMs`)
- `src/reminder/batchPresetStore.ts` — `saveBatchPreset(name, description,
  entries)`; `loadBatchPresets` normalizes legacy `{offsetsMs}`-only
  presets so already-saved data doesn't crash rendering
- `src/reminder/presetNameValidation.ts` — `sanitizePresetDescription`
  (trim + length cap, no character allowlist — description is free text,
  safety comes from `escapeHtml` at render time)
- `src/ui/presetNameDialog.ts` — popup fallback now also asks for a
  description; returns `{name, description} | null`
- `src/ui/dialog/components/batchStaging.ts` — hidden field JSON changed
  from `number[]` to `{at,label}[]`, so the exact typed duration label
  (not just the timestamp) survives into `formData`
- `src/ui/reminderFormParser.ts` — `parseBatchStagedTimestamps` →
  `parseBatchStagedItems`, returns `{at,label}[]`
- `src/ui/reminderFormHtml.ts` — Custom Batch gets a second inline field
  (`#batch-preset-description`); Saved Presets rebuilt as one block per
  preset (name, optional description, entry chips, "Add all" chip)
- `src/ui/dialog/components/presetPicker.ts` — rewritten for click
  delegation on the new chip layout (was: `<select>` + one Apply button)
- `src/ui/dialog/dialog-batch.css` — split out of `dialog.css` (again
  approaching the 180-line threshold): duration/staging/saved-preset block
  styles
- Tests: extended `batchPresetStore`, `reminderFormParser`,
  `reminderFormHtml`, `reminderDialogPresets`

## Design decisions

- **"Save as preset" could not be physically relocated.** `setButtons`
  entries render in Joplin's own native bottom bar — there's no API to
  embed one inside arbitrary in-page HTML, and persisting still requires
  closing the dialog (no live channel while it's open, per Feature 05).
  What *did* move: both inputs it reads (name, and now description) live
  entirely inside the Custom Batch section, and the button was renamed
  "Save custom batch as preset" so its scope is unambiguous even though its
  physical position is fixed by the platform.
- **Storing `label` alongside `offsetMs`, not just the offset.** Decomposing
  a raw millisecond count back into "2 days" is ambiguous for years/months
  (they aren't a fixed length) and lossy even for fixed units if the
  original entry came from calendar-correct duration math. Capturing the
  label verbatim at staging time (`formatRelativeDuration(item.duration)`)
  means the "After X" chip always matches what was actually entered — no
  re-decomposition needed when rendering a saved preset later.
- **Legacy presets aren't migrated, just tolerated.** Presets saved before
  this change only have `offsetsMs`. Rather than a migration step,
  `loadBatchPresets` normalizes on read: missing `entries` gets
  reconstructed via a days/hours/minutes/seconds-only decomposition
  (skipping years/months, which can't be recovered from milliseconds
  alone) — good enough to keep old presets clickable instead of crashing
  on a missing array.
- **Per-preset "Add all" mirrors Quick Add's pattern exactly** (confirm via
  `window.confirm`, per-item dedup against the main list, a summary
  `window.alert` naming what was skipped) rather than inventing a new
  interaction — this was already the established pattern for "add several
  reminders at once" from Feature 08.
- **Description has no character allowlist**, unlike names (which do, for
  the dropdown option text). Prose plausibly needs colons, quotes,
  ampersands; restricting that would fight normal usage for no real
  security gain, since `escapeHtml` already neutralizes anything dangerous
  at render time. The only description-side rule is a length cap.
