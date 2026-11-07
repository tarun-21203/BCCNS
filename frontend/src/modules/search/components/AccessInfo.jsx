import DigitizationBadge from "./DigitizationBadge.jsx";
import { NO_ACCESS_INFO, accessBadge } from "../lib/labels.js";

// Digitization status and access wording, shared by the Access Card and the
// record page. Returns two blocks; the parent supplies the grid.
export default function AccessInfo({ record: r, mapping }) {
  const hasAccessText = r.access_information && r.access_info_level !== "unknown";
  const institutionLink = mapping?.institution_access?.source_url || mapping?.institution_url;
  return (
    <>
      <div className="ac-block">
        <span className="ac-label">Digitization</span>
        <DigitizationBadge status={r.digitization_status} />
      </div>
      <div className="ac-block ac-access">
        <span className="ac-label">How to access</span>
        {hasAccessText ? (
          <>
            <p className="ac-access-text">{r.access_information}</p>
            <span className={`ac-badge ac-badge-${r.access_info_level}`}>{accessBadge(r.access_info_level)}</span>
          </>
        ) : (
          <p className="ac-access-text ac-unknown">{NO_ACCESS_INFO}</p>
        )}
        {r.access_info_level !== "record" && institutionLink && (
          <a className="ac-inline-link" href={institutionLink} target="_blank" rel="noopener noreferrer">
            Visit {r.source_institution} ↗<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </>
  );
}
