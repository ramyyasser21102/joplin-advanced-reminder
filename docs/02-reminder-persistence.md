# Feature 02 — Reminder Persistence

**Status:** In progress

## Scope

Persistence adapter between Advanced Reminder and the Joplin API. Owns all
`joplin.data.userData*` calls for the reminder list. No dialog code, no UI
formatting decisions.

- load reminder metadata
- save reminder metadata
- delete reminder metadata
- import an existing `todo_due` value into the stored reminder list

## Files

- `src/constants.ts` — `USER_DATA_KEY`, `MANAGE_COMMAND`
- `src/reminder/reminderStore.ts`
- `tests/reminderStore.test.ts` (mocked Joplin boundary, not live Joplin)

## Dependencies

- Feature 01 (`Reminder`, `AdvancedReminderData` types; `isDuplicateReminder`
  for merging an imported `todo_due` into the existing list)

## API surface confirmed from `api/JoplinData.d.ts`

```ts
userDataGet<T>(itemType: ModelType, itemId: string, key: string): Promise<T>;
userDataSet<T>(itemType: ModelType, itemId: string, key: string, value: T): Promise<void>;
userDataDelete(itemType: ModelType, itemId: string, key: string): Promise<void>;
```

`ModelType` is not importable from the `.d.ts` file itself (its declared
source, `../../../BaseModel`, doesn't exist in the generator's template —
see the api/ upstream-gap note from repo setup). It **is** available as a
real runtime enum from `api/types.ts` (`ModelType.Note = 1`), so
`reminderStore.ts` should import it from there.

## Open question (blocking implementation)

`userDataGet`'s behavior when the key has never been set is undocumented in
the `.d.ts` comment. Need to confirm against Joplin's actual implementation
(not guess) whether it resolves `undefined`/`null` or rejects, before writing
`loadReminders` — a wrong assumption here means either an unhandled rejection
on every note that's never had a reminder, or a silently-swallowed real
error if we guess wrong and catch too broadly.
