import { Link } from "react-router-dom";
import { recordHref } from "../../../shell/links.js";
import DigitizationBadge from "./DigitizationBadge.jsx";
import {
  NOT_PROVIDED,
  NO_ACCESS_INFO,
  accessBadge,
  isDerived,
  resourceTypeLabel,
} from "../lib/labels.js";

const TAG_GROUPS = [
  ["people", "People"],
  ["places", "Places"],
  ["communities", "Communities"],
  ["subjects", "Subjects"],
];

// One result. Shows who holds the material, how it can be reached, and a
// link to the authoritative record. Unknowns are stated, never guessed.
export default function AccessCard({ record: r, mapping, index = 0 }) {
  const hasAccessText = r.access_information && r.access_info_level !== "unknown";
  const institutionLink = mapping?.institution_access?.source_url || mapping?.institution_url;

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
          <div className="ac-block">
            <span className="ac-label">Digitization</span>
            <DigitizationBadge status={r.digitization_status} />
          </div>
          <div className="ac-block ac-access">
            <span className="ac-label">How to access</span>
            {hasAccessText ? (
              <>
                <p className="ac-access-text">{r.access_information}</p>
                <span className={`ac-badge ac-badge-${r.access_info_level}`}>
                  {accessBadge(r.access_info_level)}
                </span>
              </>
            ) : (
              <p className="ac-access-text ac-unknown">{NO_ACCESS_INFO}</p>
            )}
            {r.access_info_level !== "record" && institutionLink && (
              <a className="ac-inline-link" href={institutionLink} target="_blank" rel="noopener noreferrer">
                Visit {r.source_institution} ↗
              </a>
            )}
          </div>
        </div>

        {TAG_GROUPS.some(([f]) => r[f]?.length) && (
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
            {["people", "places", "communities", "subjects"].some((f) => isDerived(r, f) && r[f]?.length) && (
              <p className="ac-derived-note">Dashed tags were added by THREADS, not supplied by the source.</p>
            )}
          </dl>
        )}

        <footer className="ac-foot">
          <span className="ac-ref" title="Identifier assigned by the holding institution">
            Original ID: {r.original_id}
          </span>
          <span className="ac-actions">
            <Link className="btn btn-ghost" to={recordHref(r.id)}>
              View details
            </Link>
            <a className="btn btn-primary" href={r.original_url} target="_blank" rel="noopener noreferrer">
              Open at {r.source_institution} ↗
            </a>
          </span>
        </footer>
      </article>
    </li>
  );
}
