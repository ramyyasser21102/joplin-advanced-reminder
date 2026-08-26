# Feature 13 — Relative-Duration Input for Custom Batch

**Status:** Done

## Scope

Replaced the Custom Batch section's absolute `datetime-local` picker with six
labeled number inputs — years, months, days, hours, minutes, seconds.
Staging computes the resulting absolute time once (calendar-correct), but
displays the staged item using the duration the user actually typed:
`After 2 days`, `After 1 year, 3 months`, etc., not the resolved date.

## Files

- `src/utils/relativeDuration.ts` — `RelativeDuration`, `addRelativeDuration`
  (calendar-correct via `Date` setters), `formatRelativeDuration`,
  `isZeroDuration`
- `src/ui/reminderFormHtml.ts` — `DURATION_UNITS` + `buildDurationInputsHtml`
  replace the single datetime-local input
- `src/ui/dialog/components/batchStaging.ts` — staged items are now
  `{ at, duration }` pairs; `at` drives dedup/promotion (unchanged
  mechanics), `duration` drives the display label
- `tests/relativeDuration.test.ts` (new), extended `reminderFormHtml.test.ts`

## Design decisions

- **Calendar-correct addition, not flat millisecond math.** Years and
  months don't have a fixed length, so `addRelativeDuration` advances a
  `Date`'s year/month/day/hour/minute/second components via their setters
  rather than multiplying by an assumed "365 days/year, 30 days/month."
  This is the standard native-`Date` approach and needed no new dependency —
  a duration library would be solving a problem `Date.setMonth` etc.
  already solve correctly for this case.
- **The absolute timestamp is computed once, at staging time, and frozen.**
  If a user stages "2 days" and waits before clicking Accept, the reminder
  stays pinned to "2 days from when they staged it," not recomputed against
  a later `now`. This matches how the previous datetime-local-based staging
  behaved (a fixed point once entered) and avoids surprising drift.
- **Display label comes from the stored duration, not from re-diffing the
  timestamp against a live "now."** Re-deriving "days/hours until" from the
  frozen absolute timestamp would make the label silently shrink every time
  the staging list re-renders — the request was for a fixed label reflecting
  what was actually typed, so both the timestamp and its original duration
  components are kept side by side in memory (`StagedItem = { at, duration }`).
- **Validation:** staging with every field at zero is rejected ("Enter at
  least one year/month/day/hour/minute/second before staging") rather than
  silently treating it as "now" — a zero-length duration isn't a
  meaningful reminder.
- **Downstream mechanics are unchanged.** Dedup (`isTimestampAlreadyListed`),
  promotion into real reminder rows on Accept, and the hidden
  `batchStagedTimestamps` field consumed by "Save as preset" all still key
  off the computed absolute `at` — only where that number comes from, and
  how the staged item is labeled, changed.

## Clear all — investigated, no code defect found

Re-audited `clearAllReminders` → `saveReminders(noteId, [])` →
`reconcileNoteReminders` line by line against the report that a note can
still show an upcoming reminder after confirming Clear all. The logic is
correct: `reconcileNoteReminders` re-reads the (now empty) list immediately
after the save, computes `targetTodoDue = 0`, and writes it whenever the
note's current `todo_due` differs. There's no skip condition, race, or
stale-read path in this code that would leave a non-zero `todo_due` behind.

Two non-code explanations are most likely, and can't be verified from here:
1. **The rebuilt `.jpl` wasn't reinstalled** — Joplin doesn't hot-reload
   plugin code, so a stale build would still show the old (buggy)
   behavior. Worth double-checking given this has come up before.
2. **Joplin's own alarm-scheduling has already armed a native OS
   notification** for the old `todo_due` before it was cleared — the
   plugin API has no method to cancel an already-scheduled native alarm
   (only `onNoteAlarmTrigger`, a passive listener), so if Joplin's alarm
   service doesn't re-poll immediately after the data change, a
   previously-armed notification could still fire once even though the
   underlying `todo_due` is correctly 0 afterward.

If it still reproduces after confirming a fresh install, the next useful
data point is whether restarting Joplin entirely makes the stale reminder
go away — that would confirm (2) as the cause, which is a platform
limitation rather than something fixable from the plugin's data API.
