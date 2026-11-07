import { Link } from "react-router-dom";
import { recordHref } from "../../../shell/links.js";
import {
  ENTITY_TYPE_LABELS,
  connectedRecords,
  provenanceLabel,
  recordNodeId,
} from "../lib/graph.js";

function EvidenceRecord({ ev }) {
  return (
    <div className="tv-evidence">
      <div className="tv-evidence-title">{ev.title}</div>
      <dl>
        <dt>Held by</dt>
        <dd>{ev.source_institution}</dd>
        <dt>Original ID</dt>
        <dd>{ev.original_id}</dd>
      </dl>
      <div className="tv-evidence-links">
        <a href={ev.original_url} target="_blank" rel="noreferrer">
          View original record ↗
        </a>
        <Link to={recordHref(ev.record_id)}>Access Card</Link>
      </div>
    </div>
  );
}

function ProvenanceTag({ prov }) {
  return (
    <span className={`tv-prov ${prov.origin === "derived" ? "is-derived" : "is-source"}`}>
      {prov.origin === "derived" ? "Added by THREADS" : "From source"}
      <span className="tv-prov-detail">: {provenanceLabel(prov)}</span>
    </span>
  );
}

export default function EvidencePanel({ graph, selected, onFocus, includeGeneric }) {
  if (!selected) {
    return (
      <aside className="tv-panel">
        <h2>Evidence</h2>
        <p className="tv-muted">
          Select a line to see the record that supports it. Select a record to see what it
          connects to, or a person, place, community or subject to follow its thread.
        </p>
      </aside>
    );
  }

  if (selected.kind === "edge") {
    const e = graph.edges.find((x) => x.id === selected.id);
    const entity = graph.nodes.get(e.target);
    return (
      <aside className="tv-panel">
        <h2>Why this connection</h2>
        <p>
          The record below is described with the {ENTITY_TYPE_LABELS[entity.type].toLowerCase()}{" "}
          <strong>{entity.label}</strong>.
        </p>
        <ProvenanceTag prov={e.provenance} />
        <EvidenceRecord ev={e.evidence} />
      </aside>
    );
  }

  const node = graph.nodes.get(selected.id);

  if (node.type === "record") {
    const r = node.record;
    const links = connectedRecords(graph, r.id, { includeGeneric });
    return (
      <aside className="tv-panel">
        <h2>Record</h2>
        <EvidenceRecord
          ev={{
            record_id: r.id,
            title: r.title,
            source_institution: r.source_institution,
            original_id: r.original_id,
            original_url: r.original_url,
          }}
        />
        <button type="button" className="tv-btn" onClick={() => onFocus(recordNodeId(r.id))}>
          Centre thread on this record
        </button>
        <h3>Shares descriptions with {links.length} other record{links.length === 1 ? "" : "s"}</h3>
        {links.length === 0 ? (
          <p className="tv-muted">No other indexed record shares its people, places, communities or subjects.</p>
        ) : (
          <ul className="tv-conn-list">
            {links.map(({ record, via }) => (
              <li key={record.id}>
                <Link to={recordHref(record.id)}>{record.title}</Link>{" "}
                <span className="tv-muted">({record.source_institution})</span>
                <div className="tv-via">
                  both described with:{" "}
                  {via.map(({ entity, edges }, i) => (
                    <span key={entity.id}>
                      {i > 0 && ", "}
                      <button type="button" className="tv-chip" onClick={() => onFocus(entity.id)}>
                        {entity.label}
                      </button>
                      {edges.some((x) => x.provenance.origin === "derived") && (
                        <span className="tv-derived-mark" title="At least one side of this link was added by THREADS, not the source">
                          *
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    );
  }

  const recs = [...node.recordIds].map((id) => graph.nodes.get(recordNodeId(id)).record);
  const institutions = new Set(recs.map((r) => r.source_institution));
  return (
    <aside className="tv-panel">
      <h2>
        {ENTITY_TYPE_LABELS[node.type]}: {node.label}
      </h2>
      <p>
        Appears on {recs.length} indexed record{recs.length === 1 ? "" : "s"} from{" "}
        {institutions.size} institution{institutions.size === 1 ? "" : "s"}.
      </p>
      {node.generic && (
        <p className="notice">
          This term appears on most indexed records, so it is hidden from threads by default.
        </p>
      )}
      <button type="button" className="tv-btn" onClick={() => onFocus(node.id)}>
        Follow this thread
      </button>
      <ul className="tv-conn-list">
        {recs.map((r) => (
          <li key={r.id}>
            <Link to={recordHref(r.id)}>{r.title}</Link>{" "}
            <span className="tv-muted">({r.source_institution})</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
