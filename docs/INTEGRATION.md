# Integration conventions (frontend)

Owner: Member 5. One React + Vite app in `frontend/` hosts every module.

## Plugging a module into the shell

1. Put all module code in `frontend/src/modules/<name>/`.
2. Export one routes component from `frontend/src/modules/<name>/index.jsx`,
   e.g. `export function MapRoutes() { ... }`. Use relative routes inside it.
3. Register it in `frontend/src/shell/modules.jsx` (replace the placeholder
   `element`). That file is the only shared file you need to touch.

| Path         | Module          | Owner    |
| ------------ | --------------- | -------- |
| `/search/*`  | Search + Access Cards | Member 2 |
| `/ask/*`     | Ask the archive (AI)  | Member 3 |
| `/map/*`     | Silence Map           | Member 4 |
| `/threads/*` | Thread View           | Member 5 |

## Rules

- Call the backend through `/api/...` (Vite proxies it to `localhost:8000`).
  Keep an offline fallback to `data/sample` copies so the demo survives
  without the API.
- Link to a record's Access Card with `recordHref(id)` from
  `src/shell/modules.jsx`, not a hard-coded path.
- Don't edit another module's folder. Shared styles: `src/styles.css`
  (tokens), `src/shell/shell.css` (shell only).
- Keep source institution, original ID and original URL visible wherever a
  record is shown.

## Run

See `frontend/README.md` and `docs/RUN.md`.
