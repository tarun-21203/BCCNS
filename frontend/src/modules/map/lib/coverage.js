// Coverage of the indexed sample sources, per community.
//
// Everything here describes OUR INDEX, not history. A low count means the
// sources indexed in this prototype hold few matching records; it never means
// a community is undocumented.

// Labels from the shared contract (docs/DATA_CONTRACT.md, "Coverage").
export const COVERAGE_LABELS = {
  found: {
    label: "Found in indexed sources",
    help: "The sources indexed in this prototype hold records described with this community.",
  },
  limited: {
    label: "Limited indexed coverage",
    help: "Few or no matching records in the sources indexed so far. Records may exist elsewhere.",
  },
  known: {
    label: "Not yet indexed / known collection",
    help: "A relevant collection is known to the project but has not been processed yet.",
  },
  unknown: {
    label: "Unknown",
    help: "We do not have enough information to make a claim.",
  },
};

// 0..LIMITED_MAX matching records => "Limited indexed coverage".
export const LIMITED_MAX = 2;

export const DIGITIZATION_STATUSES = [
  { key: "digitized", label: "Digitized" },
  { key: "partially_digitized", label: "Partially digitized" },
  { key: "not_digitized", label: "Not digitized" },
  { key: "unknown", label: "Unknown" },
];

// A record's `communities` may only drive the map if they came from the
// source, or were derived by the team and reviewed by a person.
export function communitiesUsable(record) {
  const d = record.derived_fields?.communities;
  return !d || d.reviewed === true;
}

const norm = (s) => String(s).trim().toLowerCase();

// Returns one entry per community, in the order given, plus records that were
// skipped because their community values are unreviewed.
export function buildCoverage(communities, records) {
  const usable = records.filter(communitiesUsable);
  const excluded = records.filter((r) => !communitiesUsable(r));

  const rows = communities.map((c) => {
    // Exact (case-insensitive) name match only; no fuzzy matching.
    const matched = usable.filter((r) => (r.communities || []).some((n) => norm(n) === norm(c.name)));

    const byStatus = Object.fromEntries(DIGITIZATION_STATUSES.map((s) => [s.key, 0]));
    const byInstitution = {};
    for (const r of matched) {
      const status = byStatus[r.digitization_status] !== undefined ? r.digitization_status : "unknown";
      byStatus[status] += 1;
      byInstitution[r.source_institution] = (byInstitution[r.source_institution] || 0) + 1;
    }

    let status;
    if (c.known_collections?.length && matched.length === 0) status = "known";
    else if (matched.length > LIMITED_MAX) status = "found";
    else status = "limited";

    return {
      name: c.name,
      latitude: c.latitude ?? null,
      longitude: c.longitude ?? null,
      coordinatesApproximate: c.coordinates_approximate !== false,
      citation: c.source || null,
      region: c.region || null,
      coordinatesSource: c.coordinates_source || null,
      knownCollections: c.known_collections || [],
      count: matched.length,
      records: matched,
      byStatus,
      byInstitution,
      status,
    };
  });

  return { rows, excluded, totalRecords: records.length };
}
