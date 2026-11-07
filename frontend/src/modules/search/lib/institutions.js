import { digitizationLabel, resourceTypeLabel } from "./labels.js";

export const DIGITIZATION_ORDER = ["digitized", "partially_digitized", "not_digitized", "unknown"];

const tally = (values) => {
  const counts = new Map();
  values.forEach((v) => v && counts.set(v, (counts.get(v) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
};

// Everything shown about an institution is counted from the indexed records.
export function sourceStats(records) {
  const digitization = Object.fromEntries(DIGITIZATION_ORDER.map((k) => [k, 0]));
  records.forEach((r) => {
    const key = r.digitization_status in digitization ? r.digitization_status : "unknown";
    digitization[key] += 1;
  });
  const starts = records.map((r) => r.start_date).filter((y) => y != null);
  const ends = records.map((r) => r.end_date).filter((y) => y != null);
  return {
    count: records.length,
    digitization,
    types: tally(records.map((r) => r.resource_type)).map(([t, n]) => [resourceTypeLabel(t), n]),
    communities: tally(records.flatMap((r) => r.communities || [])),
    years: starts.length && ends.length ? { min: Math.min(...starts), max: Math.max(...ends) } : null,
  };
}

// One entry per source. Sources come from the mapping files; a source that has
// records but no mapping file is still listed, and says so.
export function buildSources(mappings, records) {
  const bySource = new Map();
  records.forEach((r) => {
    if (!bySource.has(r.source_id)) bySource.set(r.source_id, { name: r.source_institution, records: [] });
    bySource.get(r.source_id).records.push(r);
  });
  const sources = mappings.map((m) => ({
    id: m.source_id,
    name: m.source_institution,
    mapping: m,
    stats: sourceStats(bySource.get(m.source_id)?.records || []),
  }));
  bySource.forEach((v, id) => {
    if (!mappings.some((m) => m.source_id === id)) sources.push({ id, name: v.name, mapping: null, stats: sourceStats(v.records) });
  });
  return sources.sort((a, b) => b.stats.count - a.stats.count || a.name.localeCompare(b.name));
}

export const digitizationSummary = (digitization) =>
  DIGITIZATION_ORDER.filter((k) => digitization[k] > 0)
    .map((k) => `${digitization[k]} ${digitizationLabel(k).toLowerCase()}`)
    .join(", ");

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
