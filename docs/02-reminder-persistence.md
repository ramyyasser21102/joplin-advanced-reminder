# Feature 02 — Reminder Persistence

**Status:** Done

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

## Resolved: userDataGet not-found behavior

Checked against Joplin's actual implementation (`packages/lib/models/utils/userData.ts`,
`getItemUserData` / `getUserData`), not just the `.d.ts` comment. It resolves
`undefined` when the key was never set — it never rejects for a missing key,
only for real errors (unsupported item type, corrupted stored JSON). The
`.d.ts` signature (`Promise<T>`) is slightly loose here; `reminderStore.ts`
treats the result as possibly `undefined` regardless.

Also confirmed: `userDataGet`/`Set`/`Delete` auto-namespace by `this.plugin.id`
internally, so `USER_DATA_KEY` only needs to be unique within this plugin, not
globally.

## Build-scope fix required for this feature

Adding `tests/reminderStore.test.ts` (which uses a top-level `await import()`
after `vi.mock`) and `vitest.config.ts` (default-imports `path`) surfaced a
pre-existing issue: `webpack.config.js`'s `ts-loader` rule has no
`onlyCompileBundledFiles` option, so it type-checks TypeScript's whole
program as scoped by `tsconfig.json`, not just the files webpack actually
bundles. With no `include`/`exclude` in `tsconfig.json`, that scope silently
swept in `tests/` and root-level config files too, and their syntax needs a
newer module target than the plugin's own `es2015`/`commonjs` target
supports. Fixed by adding `"exclude": ["node_modules", "dist", "publish", "tests", "vitest.config.ts"]`
to `tsconfig.json` — scopes the webpack/tsc program to what actually ships,
without touching `webpack.config.js` or watering down the test file. Vitest
itself transpiles test files independently via esbuild, so this exclude
doesn't affect `pnpm test`.
