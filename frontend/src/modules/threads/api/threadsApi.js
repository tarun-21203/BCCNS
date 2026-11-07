import fixtureRecords from "../fixtures/records.json";

// Thread View reads the same normalized records as Search, via /api/records.
// It builds the graph client-side from shared entities, so it does not need
// a separate relationships endpoint. If the API cannot be reached we fall
// back to a copy of data/sample/records.json and report `offline: true`.
const BASE = import.meta.env.VITE_API_BASE || "/api";
const TIMEOUT_MS = 4000;

export async function getAllRecords() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/records`, { signal: controller.signal });
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    const data = await res.json();
    return { records: data.results, offline: false };
  } catch {
    return { records: fixtureRecords, offline: true };
  } finally {
    clearTimeout(timer);
  }
}
