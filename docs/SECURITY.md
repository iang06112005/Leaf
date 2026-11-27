# Security

- Desktop host runs locally via Tauri; filesystem and process APIs are only exposed through typed `invoke` commands.
- Node companion (browser fallback) listens on `127.0.0.1` only and allows CORS from local Vite origins.
- Project paths must be absolute. Relative file paths cannot contain `..`.
- `latexmk` is spawned with structured argv (`shell: false` / no shell). The UI cannot supply a shell string.
- shell-escape is off by default; enabling it shows a warning and a confirm before compile.
- Autosave/Save write only into the opened project tree.
- No accounts, telemetry, or cloud upload.
