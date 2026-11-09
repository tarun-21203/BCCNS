import fixtureRecords from "../fixtures/records.json";
import fixtureCommunities from "../fixtures/communities.json";

// The Silence Map reads the same normalized records as Search and Thread View.
// Per-community counts are computed client-side from /api/records (see
// lib/coverage.js), so they cannot drift from the index. /api/communities
// supplies names, coordinates and their citation.
// If the API cannot be reached we fall back to copies of data/sample/* and
// report `offline: true`.
const BASE = import.meta.env.VITE_API_BASE || "/api";
const TIMEOUT_MS = 4000;

async function getJson(path, signal) {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) throw new Error(`API responded ${res.status} for ${path}`);
  return res.json();
}

export async function getCoverageInputs() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const [records, communities] = await Promise.all([
      getJson("/records", controller.signal),
      getJson("/communities", controller.signal),
    ]);
    return { records: records.results, communities: communities.results, offline: false };
  } catch {
    return { records: fixtureRecords, communities: fixtureCommunities, offline: true };
  } finally {
    clearTimeout(timer);
  }
}
