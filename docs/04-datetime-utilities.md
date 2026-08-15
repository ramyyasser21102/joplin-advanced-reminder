# Feature 04 — Date/Time Utilities

**Status:** Done

## Scope

Small, self-contained conversion helpers for the `<input type="datetime-local">`
field the dialog (Feature 05) will use.

## Files

- `src/utils/dateTime.ts` — `parseLocalDateTime`, `formatLocalDateTime`
- `tests/dateTime.test.ts` (5 tests)

## Dependencies

None. No Joplin dependency.

## Design decisions

- Two functions, not three. "Valid date checking" isn't a separate export —
  `parseLocalDateTime` returns `number | null`, folding the validity check
  into its return contract instead of requiring a separate `isValidDateTime`
  call first.
- `parseLocalDateTime` relies on a real JS gotcha, deliberately: `new
  Date(str)` parses a date-only string ("2026-01-01") as UTC midnight, but a
  full date-*time* string ("2026-01-01T14:30") as local time. Since
  `datetime-local` inputs always produce the full form, this is safe — a
  test locks in the local-time behavior explicitly so a future edit can't
  silently reintroduce a timezone bug.
- `formatLocalDateTime` can't use `toISOString()` (UTC only) — builds the
  string manually from local `Date` getters with zero-padding instead.
- Tests are timezone-independent: expected values are computed via
  `new Date(y, m, d, h, min)` rather than hardcoded epoch numbers, so they
  pass regardless of the machine/CI's timezone.
