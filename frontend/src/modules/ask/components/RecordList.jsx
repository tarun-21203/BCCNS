import { Link } from "react-router-dom";
import { recordHref } from "../../../shell/links.js";
import { accessLevelLabel, digitizationLabel } from "../lib/labels.js";

// The records retrieved for the question. Source institution, original ID and original URL
// stay visible on every card (docs/INTEGRATION.md).
export default function RecordList({ hits, citedIds }) {
  if (!hits?.length) return null;
  return (
    <section className="ask-records" aria-label="Records searched">
      <h2>Records searched ({hits.length})</h2>
      <ul>
        {hits.map(({ record: r, matched_terms, found_via_bridge, content_note }) => (
          <li key={r.id} className={`ask-record${citedIds.has(r.id) ? " is-cited" : ""}`}>
            <div className="ask-record-head">
              <Link to={recordHref(r.id)} className="ask-record-title">{r.title}</Link>
              <div className="ask-badges">
                {citedIds.has(r.id) && <span className="ask-badge is-cited">Cited</span>}
                {found_via_bridge && (
                  <span className="ask-badge is-bridge" title="Matched only through related or historical terms">
                    Found via Language Bridge
                  </span>
                )}
              </div>
            </div>
            <div className="ask-record-meta">
              <span>{r.source_institution}</span>
              <span>{r.resource_type}</span>
              <span>{r.date_display}</span>
              <span>{digitizationLabel(r.digitization_status)}</span>
            </div>
            {content_note && <p className="ask-content-note" role="note">{content_note}</p>}
            <p className="ask-access">
              <strong>Access:</strong> {r.access_information || "Not provided in the indexed record"}{" "}
              <span className="ask-fine">({accessLevelLabel(r.access_info_level)})</span>
            </p>
            <div className="ask-record-foot">
              <span className="ask-fine">Original ID: {r.original_id}</span>
              {matched_terms?.length > 0 && <span className="ask-fine">Matched: {matched_terms.join(", ")}</span>}
              <a href={r.original_url} target="_blank" rel="noreferrer">Original record ↗</a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
