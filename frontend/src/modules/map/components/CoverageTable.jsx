import { COVERAGE_LABELS, DIGITIZATION_STATUSES } from "../lib/coverage.js";

// Table view of coverage. Also the fallback when map tiles cannot load.
export default function CoverageTable({ rows, selected, onSelect }) {
  return (
    <div className="sm-tablewrap">
      <table className="sm-table">
        <caption className="sm-visually-hidden">Indexed records per community</caption>
        <thead>
          <tr>
            <th scope="col">Community</th>
            <th scope="col">Indexed records</th>
            <th scope="col">Coverage</th>
            {DIGITIZATION_STATUSES.map((s) => (
              <th scope="col" key={s.key}>{s.label}</th>
            ))}
            <th scope="col">Held by</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className={selected === r.name ? "is-selected" : undefined}>
              <th scope="row">
                <button type="button" className="sm-linkbtn" onClick={() => onSelect(r.name)}>
                  {r.name}
                </button>
              </th>
              <td>{r.count}</td>
              <td>
                <span className={`sm-badge sm-badge--${r.status}`} title={COVERAGE_LABELS[r.status].help}>
                  {COVERAGE_LABELS[r.status].label}
                </span>
              </td>
              {DIGITIZATION_STATUSES.map((s) => (
                <td key={s.key}>{r.byStatus[s.key]}</td>
              ))}
              <td>{Object.keys(r.byInstitution).join(", ") || "None in indexed sources"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
