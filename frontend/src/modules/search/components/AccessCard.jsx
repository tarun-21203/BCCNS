import { Link, useLocation } from "react-router-dom";
import { recordHref } from "../../../shell/links.js";
import AccessInfo from "./AccessInfo.jsx";
import Provenance from "./Provenance.jsx";
import { NOT_PROVIDED, isDerived, resourceTypeLabel } from "../lib/labels.js";

const TAG_GROUPS = [
  ["people", "People"],
  ["places", "Places"],
  ["communities", "Communities"],
  ["subjects", "Subjects"],
];

// One result. Shows who holds the material, how it can be reached, and a
// link to the authoritative record. Unknowns are stated, never guessed.
export default function AccessCard({ record: r, mapping, index = 0 }) {
  const location = useLocation();

  return (
    <li className="acard" style={{ "--i": Math.min(index, 8) }}>
      <article aria-labelledby={`card-title-${r.id}`}>
        <div className="ac-head">
          <span className="ac-inst">
            <span className="ac-label">Held by</span> {r.source_institution}
          </span>
          <span className="ac-meta">
            {resourceTypeLabel(r.resource_type)} · {r.date_display || NOT_PROVIDED}
          </span>
        </div>

        <h2 id={`card-title-${r.id}`} className="ac-title">
          {r.title}
        </h2>
        {r.description && <p className="ac-desc">{r.description}</p>}

        <div className="ac-grid">
          <AccessInfo record={r} mapping={mapping} />
        </div>

        {TAG_GROUPS.some(([f]) => r[f]?.length) && (
          <div className="ac-tags-wrap">
            <dl className="ac-tags">
              {TAG_GROUPS.map(([field, label]) =>
                r[field]?.length ? (
                  <div key={field} className="ac-tag-row">
                    <dt>{label}</dt>
                    <dd>
                      {r[field].map((v) => (
                        <span
                          key={v}
                          className={isDerived(r, field) ? "tag tag-derived" : "tag"}
                          title={isDerived(r, field) ? "Added by THREADS, not supplied by the source" : undefined}
                        >
                          {v}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>
            {TAG_GROUPS.some(([f]) => isDerived(r, f) && r[f]?.length) && (
              <p className="ac-derived-note">Dashed tags were added by THREADS, not supplied by the source.</p>
            )}
          </div>
        )}

        <footer className="ac-foot">
          <span className="ac-ref" title="Identifier assigned by the holding institution">
            Original ID: {r.original_id}
          </span>
          <span className="ac-actions">
            <Link className="btn btn-ghost" to={recordHref(r.id)} state={{ from: location.pathname + location.search }}>
              View details
            </Link>
            <a className="btn btn-primary" href={r.original_url} target="_blank" rel="noopener noreferrer">
              Open at {r.source_institution} ↗<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </span>
        </footer>

        <Provenance record={r} mapping={mapping} />
      </article>
    </li>
  );
}
