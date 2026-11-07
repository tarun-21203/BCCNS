# Silence Map (Member 4)

Shows what the sources indexed in this prototype hold for selected African
Nova Scotian communities, and where that indexed coverage is limited.
Mounted by the shell at `/map`.

**It measures our index, not history.** A low or zero count means limited
indexed coverage, never that a community is undocumented. The disclaimer is
shown on the page itself, not in a footnote.

- `lib/coverage.js` computes per-community counts from the normalized records:
  exact name match on `communities`, digitization split, institutions holding
  records, and a coverage label (`found`, `limited`, `known`, `unknown`).
  Community values added by THREADS but not reviewed are not counted.
  `LIMITED_MAX` sets the "Limited indexed coverage" threshold.
- `api/mapApi.js` reads `GET /api/records` and `GET /api/communities`; falls
  back to `fixtures/` (copies of `data/sample/records.json` and
  `data/sample/communities.json`) when offline.
- `components/CoverageMap.jsx` (Leaflet + OpenStreetMap tiles) and
  `components/CoverageTable.jsx` (works without tiles/network) share one
  selection. `components/CommunityPanel.jsx` shows the selected community's
  digitization split, holding institutions and records, each linking to its
  Access Card (`recordHref`) and its original record; it also links to Thread
  View (`threadHref`). `components/Legend.jsx` defines the coverage labels.
- Community names come from the Government of Nova Scotia dataset
  "African Nova Scotian Family Names by Region"; the citation is read from
  each community entry and shown on the page.

Check the coverage builder against the sample data (from the repo root):

    node frontend/src/modules/map/lib/coverage.check.mjs

If `data/sample/*.json` changes, re-copy the files into `fixtures/`.
