# Feature 18 — Notice Actions `[hidden]` CSS Bug

**Status:** Done

## Scope

The notice banner's Confirm/Cancel row stayed visibly stuck after a plain
notice (e.g. "Added 1 reminder." from Accept batch, which never shows a
confirm at all) — showing whatever color the Confirm button last had,
which read as "the confirm button is always red" regardless of what was
actually happening.

## Root cause

`.dialog-notice-actions { display: flex; gap: 8px; }` in `dialog.css` had
no `[hidden]` guard. `showNotice`/`showConfirmNotice` correctly set
`actions.hidden = true` for a plain notice, but the browser's own default
`[hidden] { display: none }` rule lives in the user-agent stylesheet —
and author-origin CSS always outranks UA-origin CSS in the cascade,
*regardless of selector specificity*. So the plain class rule silently won
every time, and the `hidden` attribute had no visual effect at all on that
element.

## Fix

`.dialog-notice-actions:not([hidden]) { display: flex; gap: 8px; }` — the
flex layout now only applies when the element isn't hidden, so JS's
`hidden = true` actually hides it.

## Why the color-tone work (Feature 17) needed this

The Confirm button's tone (`danger`/`success`/`neutral`) was already
wired correctly per confirm call site — Reset → danger, both "Add all"
confirms → success. With the actions row stuck visible, a *stale* Confirm
button (colored from whatever confirm last ran, or its static default)
kept showing next to unrelated notices, which looked identical to "the
tone logic doesn't work" even though it did. This was a rendering bug
masking already-correct logic, not a missing feature.

## Files

- `src/ui/dialog/dialog.css` — one selector change
