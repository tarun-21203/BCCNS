import { Link } from "react-router-dom";
import { recordHref, threadHref } from "../../../shell/links.js";
import { COVERAGE_LABELS, DIGITIZATION_STATUSES } from "../lib/coverage.js";

const STATUS_LABEL = Object.fromEntries(DIGITIZATION_STATUSES.map((s) => [s.key, s.label]));

// Same key format as Thread View's entityId("community", name).
const communityNodeId = (name) => `community:${String(name).trim().replace(/\s+/g, " ").toLowerCase()}`;

function DigitizationBar({ byStatus, count }) {
  if (count === 0) return null;
  return (
    <div className="sm-bar" role="img" aria-label={DIGITIZATION_STATUSES.map((s) => `${s.label}: ${byStatus[s.key]}`).join(", ")}>
      {DIGITIZATION_STATUSES.filter((s) => byStatus[s.key] > 0).map((s) => (
        <span
          key={s.key}
          className={`sm-bar-seg sm-dig--${s.key}`}
          style={{ flexGrow: byStatus[s.key] }}
          title={`${s.label}: ${byStatus[s.key]}`}
        />
      ))}
    </div>
  );
}

function Overview({ rows, totalRecords }) {
  const institutions = new Set(rows.flatMap((r) => Object.keys(r.byInstitution)));
  const limited = rows.filter((r) => r.status === "limited").map((r) => r.name);
  return (
    <aside className="sm-panel" aria-label="Coverage overview">
      <h2>Overview</h2>
      <p>
        {rows.length} communities, {totalRecords} indexed sample records from {institutions.size}{" "}
        institution{institutions.size === 1 ? "" : "s"}.
      </p>
      {limited.length > 0 && (
        <p>
          <strong>Limited indexed coverage:</strong> {limited.join(", ")}. These are candidates for
          further indexing, not places with less history.
        </p>
      )}
      <p className="sm-muted">Select a community on the map or in the table to see its records.</p>
    </aside>
  );
}

export default function CommunityPanel({ row, rows, totalRecords, onClose }) {
  if (!row) return <Overview rows={rows} totalRecords={totalRecords} />;

  const label = COVERAGE_LABELS[row.status];
  const institutions = Object.entries(row.byInstitution).sort((a, b) => b[1] - a[1]);

  return (
    <aside className="sm-panel" aria-label={`Indexed coverage for ${row.name}`}>
      <div className="sm-panel-head">
        <h2>{row.name}</h2>
        <button type="button" className="sm-close" onClick={onClose} aria-label="Back to overview">
          ×
        </button>
      </div>
      <p>
        <span className={`sm-badge sm-badge--${row.status}`}>{label.label}</span>
      </p>
      <p className="sm-muted">{label.help}</p>

      <p className="sm-count">
        <strong>{row.count}</strong> indexed record{row.count === 1 ? "" : "s"}
      </p>

      {row.count > 0 && (
        <>
          <h3>Digitization (as stated by each source)</h3>
          <DigitizationBar byStatus={row.byStatus} count={row.count} />
          <ul className="sm-kv">
            {DIGITIZATION_STATUSES.map((s) => (
              <li key={s.key}>
                <span className={`sm-swatch sm-dig--${s.key}`} aria-hidden="true" />
                {s.label}: {row.byStatus[s.key]}
              </li>
            ))}
          </ul>

          <h3>Held by</h3>
          <ul className="sm-kv">
            {institutions.map(([name, n]) => (
              <li key={name}>
                {name}: {n}
              </li>
            ))}
          </ul>

          <h3>Records</h3>
          <ul className="sm-records">
            {row.records.map((r) => (
              <li key={r.id}>
                <Link to={recordHref(r.id)}>{r.title}</Link>
                <div className="sm-muted">
                  {r.source_institution} · {STATUS_LABEL[r.digitization_status] || "Unknown"}
                  {r.date_display ? ` · ${r.date_display}` : ""}
                </div>
                <a href={r.original_url} target="_blank" rel="noopener noreferrer" className="sm-ext">
                  Original record at {r.source_institution}
                  <span className="sm-visually-hidden"> (opens in a new tab)</span> ↗
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {row.count === 0 && (
        <p>
          No records for {row.name} in the sources indexed so far. Records may be held by
          institutions we have not indexed yet.
        </p>
      )}

      {row.count > 0 && (
        <p>
          <Link to={threadHref(communityNodeId(row.name))}>See connections in Thread View →</Link>
        </p>
      )}

      <p className="sm-muted">
        {row.region && <>Region (per the Nova Scotia dataset): {row.region}. </>}
        Map location is {row.coordinatesApproximate ? "approximate" : "as listed"}
        {row.coordinatesSource ? <>; source: {row.coordinatesSource}</> : ""}.
      </p>
    </aside>
  );
}
