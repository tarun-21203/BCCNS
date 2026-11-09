// Offline fallback search. Mirrors the matching rules of GET /records in
// backend/app/main.py so results offline behave like results online:
// free text is one case-insensitive substring across the text fields, list
// filters are exact case-insensitive matches, and all filters combine with AND.

const lower = (list = []) => list.map((v) => v.toLowerCase());

function textHaystack(r) {
  return [
    r.title || "",
    r.description || "",
    ...(r.people || []),
    ...(r.places || []),
    ...(r.communities || []),
    ...(r.subjects || []),
    ...(r.original_terms || []),
    ...(r.search_terms || []),
  ]
    .join(" ")
    .toLowerCase();
}

export function filterLocally(records, p = {}) {
  return records.filter((r) => {
    if (p.search && !textHaystack(r).includes(p.search.toLowerCase())) return false;
    if (p.people && !lower(r.people).includes(p.people.toLowerCase())) return false;
    if (p.place && !lower(r.places).includes(p.place.toLowerCase())) return false;
    if (p.community && !lower(r.communities).includes(p.community.toLowerCase())) return false;
    if (p.subject && !lower(r.subjects).includes(p.subject.toLowerCase())) return false;
    if (p.institution && (r.source_institution || "").toLowerCase() !== p.institution.toLowerCase()) return false;
    if (p.resource_type && r.resource_type !== p.resource_type) return false;
    if (p.from_year !== undefined && p.from_year !== "" && (r.end_date ?? 0) < Number(p.from_year)) return false;
    if (p.to_year !== undefined && p.to_year !== "" && (r.start_date ?? 9999) > Number(p.to_year)) return false;
    return true;
  });
}
