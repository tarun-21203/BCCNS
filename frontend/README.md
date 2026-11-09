# THREADS search UI (Member 2)

Search, filters, Access Cards, provenance, record pages and the institutions page.
React + Vite. All module code lives in `src/modules/search/`.

## Run

Start the API first (see `docs/RUN.md`), then:

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Requests to `/api/*` are proxied to
`http://localhost:8000` (set `VITE_API_TARGET` to change it).

If the API is unreachable, the module falls back to the shared sample data in
`data/sample/` and `mappings/` (imported directly, see `vite.config.js`) and shows
an "Offline sample data" notice. It keeps no copies of its own.

## Routes

The shell (`src/shell/modules.jsx`) mounts `<SearchRoutes />` at `/search/*`:

| Path | Page |
| --- | --- |
| `/search` | Map dashboard |
| `/search/results` | Search, filters, Access Cards |
| `/search/records/:id` | Record page |
| `/search/institutions` | Indexed institutions |
