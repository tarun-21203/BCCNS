// The API has no facets endpoint, so filter options are built from records.
const collect = (records, pick) => {
  const set = new Set();
  records.forEach((r) => pick(r).forEach((v) => v && set.add(v)));
  return [...set].sort((a, b) => a.localeCompare(b));
};

export function buildFacets(records) {
  return {
    people: collect(records, (r) => r.people || []),
    places: collect(records, (r) => r.places || []),
    communities: collect(records, (r) => r.communities || []),
    subjects: collect(records, (r) => r.subjects || []),
    institutions: collect(records, (r) => [r.source_institution]),
    resourceTypes: collect(records, (r) => [r.resource_type]),
  };
}
