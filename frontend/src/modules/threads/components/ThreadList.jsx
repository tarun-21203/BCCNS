import { Link } from "react-router-dom";
import { recordHref } from "../../../shell/links.js";
import { ENTITY_TYPE_LABELS, provenanceLabel } from "../lib/graph.js";

// Text version of the current thread: every record in it, and the
// entities each record shares with the rest of the thread. Same data as
// the graph, readable without it (screen readers, small screens, print).
export default function ThreadList({ thread, onFocus }) {
  const { nodes, edges, focus } = thread;
  const records = nodes.filter((n) => n.type === "record");
  const byRecord = new Map(records.map((r) => [r.id, []]));
  for (const e of edges) {
    if (byRecord.has(e.source)) byRecord.get(e.source).push(e);
  }
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className="tv-list">
      <p className="tv-muted">
        {records.length} record{records.length === 1 ? "" : "s"} in this thread around{" "}
        <strong>{focus.label}</strong>.
      </p>
      <ol>
        {records.map((r) => (
          <li key={r.id} className={r.id === focus.id ? "is-focus" : ""}>
            <div>
              <Link to={recordHref(r.record.id)}>{r.record.title}</Link>
            </div>
            <div className="tv-muted">
              {r.record.source_institution} · {r.record.original_id} ·{" "}
              <a href={r.record.original_url} target="_blank" rel="noreferrer">
                original record ↗
              </a>
            </div>
            <div className="tv-via">
              {byRecord.get(r.id).map((e) => {
                const ent = nodeById.get(e.target);
                const derived = e.provenance.origin === "derived";
                return (
                  <button
                    key={e.id}
                    type="button"
                    className={`tv-chip tv-chip-${ent.type} ${derived ? "is-derived" : ""}`}
                    onClick={() => onFocus(ent.id)}
                    title={`${ENTITY_TYPE_LABELS[ent.type]}. ${provenanceLabel(e.provenance)}`}
                  >
                    {ent.label}
                    {derived && " *"}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
