import { filterLocally } from "./localSearch.js";
import { resourceTypeLabel } from "./labels.js";

// One entry per filter group. `key` is both the URL parameter and the
// GET /records parameter; `facet` names the list built by buildFacets().
export const GROUPS = [
  { key: "institution", facet: "institutions", label: "Institution" },
  { key: "resource_type", facet: "resourceTypes", label: "Resource type", display: resourceTypeLabel },
  { key: "community", facet: "communities", label: "Community" },
  { key: "place", facet: "places", label: "Place" },
  { key: "people", facet: "people", label: "People" },
  { key: "subject", facet: "subjects", label: "Subject" },
];

export const FILTER_KEYS = [...GROUPS.map((g) => g.key), "from_year", "to_year"];

export function readFilters(params) {
  const f = {};
  FILTER_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) f[k] = v;
  });
  return f;
}

// How many records an option would give if it were chosen now: every other
// active filter (and the search text) still applies, this group's own choice
// is replaced. Uses the same matching rules as the API (see localSearch.js).
export function optionCount(records, filters, q, key, value) {
  const rest = { ...filters, search: q };
  delete rest[key];
  return filterLocally(records, { ...rest, [key]: value }).length;
}

export function optionsFor(records, facetValues, filters, q, group) {
  return facetValues
    .map((value) => ({ value, count: optionCount(records, filters, q, group.key, value) }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function yearBounds(records) {
  const starts = records.map((r) => r.start_date).filter((y) => y != null);
  const ends = records.map((r) => r.end_date).filter((y) => y != null);
  if (!starts.length || !ends.length) return null;
  return {
    min: Math.floor(Math.min(...starts) / 10) * 10,
    max: Math.ceil((Math.max(...ends) + 1) / 10) * 10,
  };
}

// Records overlapping each decade, given every other active filter.
export function decadeBars(records, filters, q, bounds) {
  const rest = { ...filters, search: q };
  delete rest.from_year;
  delete rest.to_year;
  const bars = [];
  for (let start = bounds.min; start < bounds.max; start += 10) {
    const end = start + 9;
    bars.push({
      start,
      end,
      count: filterLocally(records, { ...rest, from_year: start, to_year: end }).length,
    });
  }
  return bars;
}
