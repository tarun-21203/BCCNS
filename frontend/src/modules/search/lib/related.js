import { isDerived } from "./labels.js";

const FIELDS = [
  ["communities", "community"],
  ["places", "place"],
  ["people", "person"],
  ["subjects", "subject"],
];

const norm = (v) => String(v).trim().toLowerCase();

// Records described with the same people, places, communities or subjects.
// A match means both records carry the same tag; it is not a claim that they
// are historically related, and names are only matched when identical.
// A value on more than half of all records ("Nova Scotia") says little about
// a record, so it is ignored.
export function relatedRecords(record, all, limit = 4) {
  const half = all.length / 2;
  const isCommon = (field, value) =>
    all.filter((r) => (r[field] || []).some((v) => norm(v) === norm(value))).length > half;

  const out = [];
  for (const other of all) {
    if (other.id === record.id) continue;
    const shared = [];
    for (const [field, kind] of FIELDS) {
      for (const value of record[field] || []) {
        if (!(other[field] || []).some((v) => norm(v) === norm(value))) continue;
        if (isCommon(field, value)) continue;
        shared.push({ field, kind, value, derived: isDerived(record, field) || isDerived(other, field) });
      }
    }
    if (shared.length) out.push({ record: other, shared });
  }
  return out
    .sort((a, b) => b.shared.length - a.shared.length || a.record.title.localeCompare(b.record.title))
    .slice(0, limit);
}
