# THREADS search UI (Member 2)

Search page, filters, Access Cards, provenance and record detail view.
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

If the API is unreachable, the app shows a copy of the sample records
(`src/modules/search/fixtures/records.json`) with an "Offline sample data"
notice.

## Mounting in the shell (Member 5)

```jsx
import { SearchRoutes } from "./modules/search";
<SearchRoutes />
```

`src/App.jsx` is a dev-only wrapper and can be replaced.
