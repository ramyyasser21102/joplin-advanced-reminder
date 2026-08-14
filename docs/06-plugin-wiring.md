# Feature 06 — Plugin Wiring

**Status:** Not started

## Scope

Replace the generator's placeholder `onStart` with real bootstrap/wiring:

```ts
joplin.plugins.register({
    onStart: async () => {
        await registerCommands();
        await registerToolbar();
        await registerEventHandlers();
    },
});
```

`index.ts` wires components together. It does not contain business logic —
stays small, bootstrap only.

## Files

- `src/index.ts`

## Dependencies

- Features 02–05 (store, reconciler, dialog)
