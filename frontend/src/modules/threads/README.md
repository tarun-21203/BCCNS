# Thread View (Member 5)

Shows how indexed records connect through the people, places, communities
and subjects they are described with. Mounted by the shell at `/threads`.

- `lib/graph.js` builds the graph from normalized records (record -> entity ->
  record). No record-to-record or identity claims; exact-name matches only.
  Edges carry their evidence record and whether the value came from the
  source or was added by THREADS (`derived_fields`). Unreviewed derived
  values are excluded. Entities on most records ("Nova Scotia") are hidden
  by default.
- `api/threadsApi.js` reads `GET /api/records`; falls back to
  `fixtures/records.json` (copy of `data/sample/records.json`) when offline.
  It does not use `/entities/{id}/relationships`.
- Deep link: `/threads?focus=community:africville` (see `threadHref` in
  `src/shell/links.js`).

Check the graph builder against the sample data (from the repo root):

    node frontend/src/modules/threads/lib/graph.check.mjs

If `data/sample/records.json` changes, re-copy it into `fixtures/`.
