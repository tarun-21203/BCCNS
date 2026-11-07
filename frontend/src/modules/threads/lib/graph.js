// Thread View graph builder (Member 5).
//
// Records are linked only through the normalized entities they are
// described with: record -> person/place/community/subject -> record.
// A connection therefore means "both records are described with this
// entity" and is evidenced by the records themselves. We never create
// record-to-record or person-to-person claims, and never merge entities
// whose names merely look similar (only exact strings, ignoring case and
// extra spaces, are treated as the same entity).

export const ENTITY_FIELDS = {
  communities: "community",
  places: "place",
  people: "person",
  subjects: "subject",
};

export const ENTITY_TYPE_LABELS = {
  community: "Community",
  place: "Place",
  person: "Person",
  subject: "Subject",
  record: "Record",
};

export const ENTITY_TYPE_PLURALS = {
  community: "Communities",
  place: "Places",
  person: "People",
  subject: "Subjects",
  record: "Records",
};

// An entity on more than this share of records (and at least
// GENERIC_MIN_RECORDS of them) is "generic", e.g. "Nova Scotia" on every
// record. It is hidden by default because it would connect everything.
export const GENERIC_SHARE = 0.5;
export const GENERIC_MIN_RECORDS = 5;

const normKey = (s) => String(s).trim().replace(/\s+/g, " ").toLowerCase();

export const entityId = (type, name) => `${type}:${normKey(name)}`;
export const recordNodeId = (id) => `record:${id}`;

// Where a field's values on a record came from.
// Returns { origin: "source" } or { origin: "derived", method, by, reviewed }.
export function fieldProvenance(record, field) {
  const d = record.derived_fields && record.derived_fields[field];
  if (!d) return { origin: "source" };
  return {
    origin: "derived",
    method: d.method || "unknown",
    by: d.by,
    reviewed: d.reviewed === true,
  };
}

export function evidenceOf(record) {
  return {
    record_id: record.id,
    title: record.title,
    source_institution: record.source_institution,
    original_id: record.original_id,
    original_url: record.original_url,
  };
}

// Build the full graph from normalized records.
// Unreviewed derived values are excluded (see docs/DATA_CONTRACT.md).
export function buildGraph(records) {
  const nodes = new Map();
  const edges = [];
  const excluded = []; // unreviewed derived values we deliberately skipped

  for (const record of records) {
    const rId = recordNodeId(record.id);
    nodes.set(rId, { id: rId, type: "record", label: record.title, record, degree: 0 });

    for (const [field, type] of Object.entries(ENTITY_FIELDS)) {
      const values = record[field] || [];
      const prov = fieldProvenance(record, field);
      for (const raw of values) {
        if (!raw || !String(raw).trim()) continue;
        if (prov.origin === "derived" && !prov.reviewed) {
          excluded.push({ recordId: record.id, field, value: raw, method: prov.method });
          continue;
        }
        const eId = entityId(type, raw);
        if (!nodes.has(eId)) {
          nodes.set(eId, {
            id: eId,
            type,
            label: String(raw).trim(),
            recordIds: new Set(),
            degree: 0,
          });
        }
        const node = nodes.get(eId);
        if (node.recordIds.has(record.id)) continue; // same value listed twice
        node.recordIds.add(record.id);
        edges.push({
          id: `${rId}|${eId}`,
          source: rId,
          target: eId,
          field,
          provenance: prov,
          // The evidence for this edge is the record itself.
          evidence: evidenceOf(record),
        });
      }
    }
  }

  for (const e of edges) {
    nodes.get(e.source).degree += 1;
    nodes.get(e.target).degree += 1;
  }

  const total = records.length;
  for (const n of nodes.values()) {
    if (n.type === "record") continue;
    n.recordCount = n.recordIds.size;
    n.generic = n.recordCount >= GENERIC_MIN_RECORDS && n.recordCount / total > GENERIC_SHARE;
  }

  return { nodes, edges, excluded, recordCount: total };
}

// Entities a user can start a thread from, most-connected first.
export function listEntities(graph, { includeGeneric = false } = {}) {
  return [...graph.nodes.values()]
    .filter((n) => n.type !== "record" && (includeGeneric || !n.generic))
    .sort((a, b) => b.recordCount - a.recordCount || a.label.localeCompare(b.label));
}

function adjacency(edges) {
  const adj = new Map();
  for (const e of edges) {
    for (const [a, b] of [
      [e.source, e.target],
      [e.target, e.source],
    ]) {
      if (!adj.has(a)) adj.set(a, []);
      adj.get(a).push(b);
    }
  }
  return adj;
}

// The neighbourhood of one node, two hops out:
//   entity focus: entity -> its records -> the other entities on those records
//   record focus: record -> its entities -> other records sharing them
// Generic entities are dropped unless includeGeneric (or they are the focus).
// `types` limits which entity types are shown. With hideLeaves, entities
// touching only one shown record are dropped, so the view shows what
// actually *connects* records.
export function getThread(
  graph,
  focusId,
  { includeGeneric = false, hideLeaves = false, types = null } = {}
) {
  const focus = graph.nodes.get(focusId);
  if (!focus) return { focus: null, nodes: [], edges: [] };

  const allowed = (n) =>
    n.id === focusId ||
    n.type === "record" ||
    ((includeGeneric || !n.generic) && (!types || types.includes(n.type)));

  const adj = adjacency(graph.edges);
  const keep = new Set([focusId]);
  let frontier = [focusId];
  for (let hop = 0; hop < 2; hop++) {
    const next = [];
    for (const id of frontier) {
      for (const other of adj.get(id) || []) {
        if (keep.has(other) || !allowed(graph.nodes.get(other))) continue;
        keep.add(other);
        next.push(other);
      }
    }
    frontier = next;
  }

  let edges = graph.edges.filter((e) => keep.has(e.source) && keep.has(e.target));

  if (hideLeaves) {
    const deg = new Map();
    for (const e of edges) {
      deg.set(e.source, (deg.get(e.source) || 0) + 1);
      deg.set(e.target, (deg.get(e.target) || 0) + 1);
    }
    for (const id of [...keep]) {
      const n = graph.nodes.get(id);
      if (id !== focusId && n.type !== "record" && (deg.get(id) || 0) < 2) keep.delete(id);
    }
    edges = edges.filter((e) => keep.has(e.source) && keep.has(e.target));
  }

  return { focus, nodes: [...keep].map((id) => graph.nodes.get(id)), edges };
}

// Records connected to `recordId` and the shared entities that connect them.
// Each connection lists both supporting edges (one per record).
export function connectedRecords(graph, recordId, { includeGeneric = false } = {}) {
  const rId = recordNodeId(recordId);
  const edgeIndex = new Map(graph.edges.map((e) => [e.id, e]));
  const byRecord = new Map();
  for (const e of graph.edges) {
    if (e.source !== rId) continue;
    const entity = graph.nodes.get(e.target);
    if (entity.generic && !includeGeneric) continue;
    for (const otherId of entity.recordIds) {
      if (otherId === recordId) continue;
      const otherNode = graph.nodes.get(recordNodeId(otherId));
      if (!byRecord.has(otherId)) byRecord.set(otherId, { record: otherNode.record, via: [] });
      const theirs = edgeIndex.get(`${otherNode.id}|${entity.id}`);
      byRecord.get(otherId).via.push({ entity, edges: [e, theirs] });
    }
  }
  return [...byRecord.values()].sort((a, b) => b.via.length - a.via.length);
}

// Plain-language wording for an edge's origin, for labels and tooltips.
export function provenanceLabel(prov) {
  if (prov.origin === "source") return "Supplied by the source institution";
  const how =
    {
      curated: "curated by the THREADS team",
      llm_extracted: "extracted automatically by THREADS",
      rule_based: "added by a THREADS rule",
    }[prov.method] || "added by THREADS";
  return `Added by THREADS (${how}${prov.reviewed ? ", reviewed" : ", not reviewed"})`;
}
