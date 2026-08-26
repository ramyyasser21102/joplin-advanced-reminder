# Feature 16 — Error Message Overhaul

**Status:** Done

## Scope

Full pass on every user-facing message in the plugin: reworded for clarity,
and — for the client-side ones — replaced native `window.alert`/
`window.confirm` with a styled in-dialog notice banner matching the rest of
the design system.

## The two tiers, and what changed in each

**Main-process (`showMessageBox`)** — fires after the reminder dialog has
already closed (Save-as-preset validation, Clear all / Delete presets
confirms, the final Save summary). This is Joplin's own native OS dialog;
the `"(In plugin: Advanced Reminder)"` prefix and its chrome can't be
touched. What *could* change: the wording, and what the message knows.
- Every message reworded to name the section involved and the next action,
  not just state a rule.
- **Clear all** now loads the note's actual reminder count first: shows
  "This note has no saved reminders to clear" (no pointless confirm) when
  there's nothing to delete, or "Delete all N saved reminders..." with the
  real count otherwise — previously a generic "every saved reminder"
  regardless of how many there were.
- **The final Save summary** is now a heading line plus one bulleted line
  per issue (`\n`-separated) instead of several sentences run together —
  readable when 2-3 things happened in one save.
- The duplicated invalid-name message (`presetNameDialog.ts` and
  `reminderDialog.ts` had independently maintained the same string) is now
  one exported constant, `INVALID_PRESET_NAME_MESSAGE`.

**Client-side (`window.alert`/`window.confirm`)** — rendered inside the
still-open dialog's own webview, so fully reachable by our CSS. Replaced
with `src/ui/dialog/notice.ts`: a sticky banner at the top of the
scrollable form, styled with the same color system as the buttons
(error/success/neutral).
- `showNotice(message, tone)` — non-blocking, replaces `window.alert`.
  Dismissible, and gets overwritten by the next notice rather than
  stacking.
- `showConfirmNotice(message): Promise<boolean>` — replaces
  `window.confirm`. Every call site that used a native confirm
  (`dialog.ts`'s Reset and "Add all" quick-presets, `presetPicker.ts`'s
  "Add all" per saved preset) is now `async` and `await`s this instead of
  branching on a synchronous return value.
- The "Add all from preset" confirm now names the preset
  (`Add all 3 times from "Bedtime prep" to this note?`) instead of a
  generic count — needed threading `preset.name` through as a
  `data-preset-name` attribute (HTML-escaped, since it renders inside an
  attribute and later as banner text).

## Files

- `src/ui/dialog/notice.ts` (new) — `showNotice`, `showConfirmNotice`,
  `initDialogNotice`
- `src/ui/reminderFormHtml.ts` — `#dialog-notice` markup, first child of
  the form so it's always the sticky top element; `data-preset-name` added
  to each preset's "Add all" button
- `src/ui/dialog/dialog.ts`, `components/presetPicker.ts`,
  `components/batchStaging.ts` — every alert/confirm call site rewired
- `src/reminder/presetNameValidation.ts` — `INVALID_PRESET_NAME_MESSAGE`
  (deduplicated from two files)
- `src/ui/reminderDialog.ts` — reworded messages; `clearAllReminders` now
  reads `loadReminders` first; multi-line final summary
- `src/ui/dialog/dialog.css` — `.dialog-notice` and its tone variants
- Tests: extended `reminderFormHtml`, `reminderDialog`,
  `reminderDialogDeletePresets`, `reminderDialogPresets`,
  `reminderDialogClearAll` (new no-reminders-to-clear case)

## Design decisions

- **Confirms became `Promise<boolean>`, not a new synchronous API.**
  `window.confirm` blocks the JS thread natively; a custom in-page
  confirm can't reproduce that without freezing the whole page, so the
  only honest replacement is async. Every affected click handler became
  `async`, which is fine — DOM event listeners don't need to return
  synchronously.
- **One `#dialog-notice` element handles both alerts and confirms**, not
  two separate components — a confirm is just a notice with its actions
  row unhidden. Keeps one sticky-positioned element instead of two
  competing for the same visual slot at the top of the form.
- **An abandoned confirm resolves `false`, not left hanging.** If a new
  notice/confirm arrives while a previous confirm's promise is still
  unresolved (its buttons never clicked), `settleAnyPendingConfirm`
  resolves it as cancelled first — otherwise that promise would await
  forever once its buttons are gone from the DOM.
- **Main-process messages get better words, not a new mechanism.**
  Building an equivalent in-page system doesn't apply — these fire after
  the dialog is already gone, so there's no DOM left to style. Improving
  what's controllable (wording, and feeding in real counts) was the
  actual lever available.
