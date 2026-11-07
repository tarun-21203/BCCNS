import fixtureRecords from "@data/sample/records.json";
import fixtureCommunities from "@data/sample/communities.json";
import { filterLocally } from "../lib/localSearch.js";

// Offline copies come straight from the shared data/ and mappings/ folders, so they
// always match what the API serves (see vite.config.js for the @data / @mappings aliases).
const fixtureMappings = Object.values(import.meta.glob("@mappings/*.json", { eager: true, import: "default" })).sort(
  (a, b) => a.source_id.localeCompare(b.source_id)
);

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

// Unfiltered records and the mapping list are needed on most pages. Keep them for a
// minute so moving between pages does not refetch; peek*() lets a page render
// from them immediately.
const TTL_MS = 60_000;
let allCache = null;
let mappingsCache = null;
const isUnfiltered = (params) => !params || Object.values(params).every((v) => v === "" || v == null);
const fresh = (c) => c && Date.now() - c.at < TTL_MS;
export const peekAllRecords = () => (fresh(allCache) ? allCache.value.records : null);
export const peekMappings = () => (fresh(mappingsCache) ? mappingsCache.value : null);

// Returns { records, count, offline }.
export async function getRecords(params) {
  if (isUnfiltered(params) && fresh(allCache)) return allCache.value;
  const result = await fetchRecords(params);
  if (isUnfiltered(params) && !result.offline) allCache = { at: Date.now(), value: result };
  return result;
}

async function fetchRecords(params) {
  try {
    const data = await fetchJson(`/records${toQuery(params)}`);
    return { records: data.results, count: data.count, offline: false };
  } catch {
    const records = filterLocally(fixtureRecords, params);
    return { records, count: records.length, offline: true };
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
export async function getMappingsWithStatus() {
  if (fresh(mappingsCache)) return { mappings: mappingsCache.value, offline: false };
  try {
    const data = await fetchJson("/mappings");
    mappingsCache = { at: Date.now(), value: data.results };
    return { mappings: data.results, offline: false };
  } catch {
    return { mappings: fixtureMappings, offline: true };
  }
}

// Just the list, for callers that do not need to know whether it is the offline copy.
export async function getMappings() {
  return (await getMappingsWithStatus()).mappings;
}

// Communities with approximate coordinates (GET /communities). Returns
// { communities, offline }. Record counts are computed from records, not
// taken from the indexed_count field, so they always match what search finds.
export async function getCommunities() {
  try {
    const data = await fetchJson("/communities");
    return { communities: data.results, offline: false };
  } catch {
    return { communities: fixtureCommunities, offline: true };
  }
}
