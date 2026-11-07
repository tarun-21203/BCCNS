import { ACCESS_LEVEL_LABELS } from "../lib/labels.js";
import { fieldLabel, formatHarvested, harvestLabel, methodLabel } from "../lib/provenance.js";

const NewTab = () => <span className="visually-hidden"> (opens in a new tab)</span>;

// "Where did this come from?" Everything shown is read from the record and its
// per-source mapping file; a missing value is stated, never filled in.
export default function Provenance({ record: r, mapping: m, open = false }) {
  const derived = Object.entries(r.derived_fields || {});
  const mappingRows = Object.entries(m?.fields || {});
  const termsUrl = m?.licence_or_terms_url;

  return (
    <details className="prov" open={open || undefined}>
      <summary>
        <svg className="prov-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M5 3l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="prov-title">Record provenance</span>
        <span className="prov-sub">where this record came from</span>
      </summary>

      <div className="prov-body">
        <h3 className="prov-h">Trace to the source</h3>
        <dl className="prov-trace">
          <div className="prov-step">
            <dt>Held by</dt>
            <dd>
              {r.source_institution}
              {m?.institution_url && (
                <> · <a href={m.institution_url} target="_blank" rel="noopener noreferrer">Institution website<NewTab /> ↗</a></>
              )}
            </dd>
          </div>
          <div className="prov-step">
            <dt>Original ID</dt>
            <dd className="prov-mono">{r.original_id}</dd>
          </div>
          <div className="prov-step">
            <dt>Authoritative record</dt>
            <dd>
              <a href={r.original_url} target="_blank" rel="noopener noreferrer" className="prov-url">
                {r.original_url}<NewTab />
              </a>
            </dd>
          </div>
          <div className="prov-step">
            <dt>Metadata collected</dt>
            <dd>
              {formatHarvested(r.harvested_at)}
              <span className="prov-aside">{harvestLabel(m?.harvest_method)}</span>
            </dd>
          </div>
          <div className="prov-step">
            <dt>Mapped into THREADS with</dt>
            <dd className="prov-mono">{r.field_mapping || "Not recorded"}</dd>
          </div>
        </dl>

        {mappingRows.length > 0 && (
          <>
            <h3 className="prov-h">How this source's fields map to ours</h3>
            <table className="prov-table">
              <thead>
                <tr><th scope="col">Source field</th><th scope="col">THREADS field</th></tr>
              </thead>
              <tbody>
                {mappingRows.map(([ours, theirs]) => (
                  <tr key={ours}><td>{theirs}</td><td>{fieldLabel(ours)}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h3 className="prov-h">Added by THREADS</h3>
        {derived.length === 0 ? (
          <p className="prov-p">Every field on this record comes directly from the source.</p>
        ) : (
          <table className="prov-table">
            <thead>
              <tr><th scope="col">Field</th><th scope="col">How it was added</th><th scope="col">Human review</th></tr>
            </thead>
            <tbody>
              {derived.map(([field, d]) => (
                <tr key={field}>
                  <td>{fieldLabel(field)}</td>
                  <td>{methodLabel(d.method)}{d.by && d.by !== "team" ? ` (${d.by})` : ""}</td>
                  <td>
                    <span className={`review ${d.reviewed ? "review-yes" : "review-no"}`}>
                      <span aria-hidden="true">{d.reviewed ? "✓" : "○"}</span>{" "}
                      {d.reviewed ? "Reviewed by a person" : "Not yet reviewed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h3 className="prov-h">Access information</h3>
        <p className="prov-p">{ACCESS_LEVEL_LABELS[r.access_info_level] || ACCESS_LEVEL_LABELS.unknown}.</p>
        {r.access_info_level === "institution" && m?.institution_access?.summary && (
          <p className="prov-p prov-quote">
            “{m.institution_access.summary}”{" "}
            {m.institution_access.source_url && (
              <a href={m.institution_access.source_url} target="_blank" rel="noopener noreferrer">
                Source of this policy<NewTab /> ↗
              </a>
            )}
          </p>
        )}

        <h3 className="prov-h">Terms of use</h3>
        <p className="prov-p">
          {termsUrl ? (
            <a href={termsUrl} target="_blank" rel="noopener noreferrer">Terms for this source<NewTab /> ↗</a>
          ) : (
            "No terms-of-use link is recorded for this source yet."
          )}
        </p>

        <p className="prov-foot">
          THREADS stores descriptive metadata and a link. It does not hold or copy the original material,
          and the institution above remains its authority.
        </p>
      </div>
    </details>
  );
}
