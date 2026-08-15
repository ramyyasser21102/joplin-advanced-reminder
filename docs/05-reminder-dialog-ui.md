# Feature 05 — Reminder Dialog UI

**Status:** Done

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

- `src/ui/reminderDialog.ts` — orchestration only: load, build HTML, open, parse result, save, reconcile
- `src/ui/reminderFormHtml.ts` — `buildReminderFormHtml` (server-side HTML generation)
- `src/ui/reminderFormParser.ts` — `parseReminderFormData` (formData -> `Reminder[]`)
- `src/ui/dialog/dialog.ts` — browser-side event wiring only
- `src/ui/dialog/reminderRow.ts` — browser-side DOM row construction
- `src/ui/dialog/dialog.css`
- `src/constants.ts` — added `REMINDER_FIELD_PREFIX`
- `plugin.config.json` (`extraScripts: ["ui/dialog/dialog.ts"]`)
- `tests/reminderFormParser.test.ts` (5 tests), `tests/reminderFormHtml.test.ts` (3 tests) —
  the two pure, Joplin-independent pieces. DOM-side files (`dialog.ts`,
  `reminderRow.ts`) aren't unit tested — would need jsdom for genuinely
  small DOM-manipulation code, not worth the added test infra.

## Dependencies

- Feature 02 (`reminderStore`)
- Feature 03 (`reminderReconciler`)
- Feature 04 (`dateTime` formatting/parsing for the form)

## API mechanics confirmed before implementing (not assumed)

- **No live channel.** `JoplinViewsDialogs` (unlike `JoplinViewsPanels`) has
  no `postMessage`/`onMessage`. `open(handle)` blocks and resolves once, with
  `{ id, formData }` scraped from whatever's in the DOM `<form>` at that
  instant. Confirmed against Joplin's own demo plugin
  (`packages/app-cli/tests/support/plugins/dialog`), which shows `formData`
  keyed as `formData[formName][fieldName]`.
- Considered switching to a Panel for live validation (it does have
  `postMessage`), but a Panel is a persistent sidebar/tab widget, not a
  modal popup — a materially different UI than what was asked for. Stuck
  with the Dialog.
- Because `formData` is a plain object, two fields can't share a `name`
  (last one silently overwrites). Each reminder row gets a unique,
  **never-reused** suffix (an incrementing counter stored in
  `#reminder-list`'s `data-next-id`), so removing a row never requires
  renumbering the rest.
- `setButtons` (Save/Cancel) is main-process-only — the webview cannot
  disable Save. So client-side validation is cosmetic only (an `.empty`
  CSS class on blur); the real, authoritative validation happens in
  `reminderDialog.ts` after `open()` resolves, via `parseLocalDateTime`.
  Invalid/empty rows are dropped rather than blocking submission — and
  `reminderDialog.ts` calls `showMessageBox` afterward if anything was
  actually dropped, so it's not silent.
- "Add Reminder"/"Remove Reminder" are plain in-page `<button
  type="button">`s wired up in `dialog.ts`, not `setButtons` entries —
  any dialog-chrome button click closes the whole dialog.
- Theme matching is approximate: the plugin API only exposes
  `joplin.shouldUseDarkColors(): Promise<boolean>`, not Joplin's actual
  color palette or custom themes. `dialog.css` has a light/dark class pair
  applied to the form based on that flag.
- Confirmed the compiled `extraScripts` output path by reading
  `webpack.config.js`'s `resolveExtraScriptPath`/`CopyPlugin` config
  directly rather than guessing: `src/ui/dialog/dialog.ts` compiles to
  `dist/ui/dialog/dialog.js`; `dialog.css` is copied verbatim to
  `dist/ui/dialog/dialog.css` (CopyPlugin excludes only `.ts`/`.tsx`).
  Verified both end up in the built `.jpl` at `ui/dialog/dialog.js` and
  `ui/dialog/dialog.css`.
