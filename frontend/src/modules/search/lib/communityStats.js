import { digitizationLabel } from "./labels.js";

// Everything shown for a community comes from the indexed records themselves.
export function communityStats(community, records) {
  const name = community.name.toLowerCase();
  const matches = records.filter((r) => (r.communities || []).some((c) => c.toLowerCase() === name));
  const institutions = [...new Set(matches.map((r) => r.source_institution))];
  const byStatus = {};
  matches.forEach((r) => {
    byStatus[r.digitization_status] = (byStatus[r.digitization_status] || 0) + 1;
  });
  const digitization = Object.entries(byStatus).map(([status, n]) => `${n} ${digitizationLabel(status).toLowerCase()}`);
  return { records: matches, count: matches.length, institutions, digitization };
}
