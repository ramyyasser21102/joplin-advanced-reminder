<p align="center">
  <img src="https://res.cloudinary.com/dxdkqsgfm/image/upload/v1786769979/advanced-reminder-icon_nvj2qf.png" alt="Advanced Reminder icon" width="96" height="96" />
</p>

<h1 align="center">Advanced Reminder</h1>

<p align="center">
  A Joplin plugin that adds support for multiple reminder times on a single To-Do note.
</p>

Joplin's native To-Do notes only support one reminder (`todo_due`). Advanced
Reminder keeps its own list of reminder times per note and automatically
keeps Joplin's single native alarm in sync with the earliest one still in
the future — so a note can have as many reminders as it needs, and Joplin
still fires an alarm at the right moment every time.

## Features

- Multiple reminder times per To-Do note, managed from a single dialog
- A toolbar button / command ("Manage reminders"), enabled only on To-Do notes
- Automatically imports a note's existing native reminder (`todo_due`) into
  the list the first time you open the dialog on it, so nothing already set
  gets lost
- Keeps Joplin's native alarm (`todo_due`) in sync with the earliest
  upcoming reminder — updates it only when it actually needs to change
- When a reminder fires, automatically promotes the next one in the list,
  including catching up on startup if Joplin was closed when the promotion
  should have happened
- Dialog respects Joplin's light/dark theme

## Requirements

Joplin desktop 3.6 or later.

## Installation

**From Joplin (once published):** Configuration > Plugins, search for
"Advanced Reminder", install.

**Manual install:** download or build `com.advancedreminder.joplin.jpl`
(see [Development](#development) below), then in Joplin go to
Configuration > Plugins > the gear/menu icon > "Install from file", and
select the `.jpl`. Restart Joplin when prompted.

## Usage

1. Open or create a To-Do note.
2. Click the "Manage reminders" toolbar button (or run the command from the
   command palette) — it's only enabled on To-Do notes.
3. Add, edit, or remove reminder times, then Save.
4. Joplin will alert you at the earliest upcoming time; when it fires, the
   next reminder in the list automatically takes over.

## Development

This project uses **pnpm** (not npm or yarn) as its package manager, and
was scaffolded with the official [Joplin plugin
generator](https://github.com/laurent22/joplin/tree/dev/packages/generator-joplin).
See [GENERATOR_DOC.md](./GENERATOR_DOC.md) for generator/build-framework
details, and [docs/](./docs) for this plugin's own architecture and
feature-by-feature implementation notes.

```bash
pnpm install
pnpm test        # run the test suite
pnpm run dist     # build dist/ and publish/*.jpl
```

To test the built plugin without publishing, install the generated
`publish/com.advancedreminder.joplin.jpl` via Joplin's "Install from file",
or point Joplin's Configuration > Plugins > Advanced Settings >
"Development plugins" field at this repository's root for live development
mode.

## Contributing

- Use `pnpm` for all dependency management — don't introduce a
  `package-lock.json` or `yarn.lock`.
- Run `pnpm test` and `pnpm run dist` before submitting a change; both must
  pass cleanly.
- Don't commit personal editor configuration. In particular, this repo
  currently has a tracked `.vscode/settings.json` containing one
  contributor's personal window-color theming (Peacock) — if you're
  working in this repo, delete or gitignore `.vscode/` rather than
  committing your own editor preferences on top of it.
- Follow the existing module-per-responsibility structure (see
  [docs/](./docs) for the architecture): pure logic stays free of any
  `joplin` import where possible, persistence/reconciliation/dialog code
  stay in their own files, and generator-managed files (`api/`,
  `webpack.config.js`) shouldn't be hand-edited.
- `src/manifest.json`'s plugin `id` (`com.advancedreminder.joplin`) is
  permanent once published — Joplin's plugin repository ties it to this
  npm package name and will reject it if it ever appears under a different
  package.

## License

[GPL-3.0](./LICENSE)

## Project Status

Feature-complete for its initial scope (see [docs/00-roadmap.md](./docs/00-roadmap.md)); verified on Joplin desktop 3.6.15.
