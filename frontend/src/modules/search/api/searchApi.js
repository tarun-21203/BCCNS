import fixtureRecords from "../fixtures/records.json";

// Calls go through the dev proxy (/api -> backend). If the API cannot be
// reached, we fall back to a copy of data/sample/records.json and report
// `offline: true` so the UI can say so.
const BASE = import.meta.env.VITE_API_BASE || "/api";
const TIMEOUT_MS = 4000;

async function fetchJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { signal: controller.signal });
    if (res.status === 404) return { notFound: true };
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function toQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.set(key, value);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// Returns { records, count, offline }.
export async function getRecords(params) {
  try {
    const data = await fetchJson(`/records${toQuery(params)}`);
    return { records: data.results, count: data.count, offline: false };
  } catch {
    return { records: fixtureRecords, count: fixtureRecords.length, offline: true };
  }
}

// Returns { record, offline }. `record` is null when no such record exists.
export async function getRecord(id) {
  try {
    const data = await fetchJson(`/records/${encodeURIComponent(id)}`);
    return { record: data.notFound ? null : data, offline: false };
  } catch {
    return { record: fixtureRecords.find((r) => r.id === id) || null, offline: true };
  }
}

// Provenance detail (institution URL, harvest method, field mapping) lives in
// the per-source mapping files, not on each record.
export async function getMappings() {
  try {
    const data = await fetchJson("/mappings");
    return data.results;
  } catch {
    return [];
  }
}
