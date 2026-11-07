import { useEffect, useMemo, useState } from "react";
import { getCoverageInputs } from "../api/mapApi.js";
import { buildCoverage, COVERAGE_LABELS, DIGITIZATION_STATUSES, LIMITED_MAX } from "../lib/coverage.js";

// Silence Map (Member 4). Part 1: coverage table that works without a map
// library or network. The interactive map is layered on top of this.
export default function SilenceMapPage() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    getCoverageInputs().then((r) => setState({ loading: false, ...r }));
  }, []);

  const coverage = useMemo(
    () => (state.loading ? null : buildCoverage(state.communities, state.records)),
    [state],
  );

  if (state.loading) return <p>Loading coverage…</p>;

  const citations = [...new Set(coverage.rows.map((r) => r.citation).filter(Boolean))];

  return (
    <section className="sm">
      <header className="sm-head">
        <h1>Silence Map</h1>
        <p className="sm-lede">
          What the sources indexed in this prototype hold for selected African Nova Scotian
          communities, and where that coverage is limited.
        </p>
      </header>

      {/* Disclaimer must be visible without clicking (project rule 3.4). */}
      <p className="sm-disclaimer" role="note">
        <strong>This measures our current index, not history.</strong> Counts come from{" "}
        {coverage.totalRecords} sample records from the institutions indexed so far. A low or zero
        count means limited indexed coverage. It does not mean a community has little history or
        that no records exist elsewhere.
      </p>

      {state.offline && (
        <p className="notice" role="status">
          Offline sample data: the API could not be reached, so these counts use copies of the
          sample records.
        </p>
      )}

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
            {coverage.rows.map((r) => (
              <tr key={r.name}>
                <th scope="row">{r.name}</th>
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

      {coverage.excluded.length > 0 && (
        <p className="sm-muted">
          {coverage.excluded.length} record(s) not counted: their community values were added by
          THREADS and have not been reviewed yet.
        </p>
      )}

      <footer className="sm-foot">
        <p>
          <strong>Limited indexed coverage</strong> = {LIMITED_MAX} or fewer matching records in the
          indexed sample. Digitization counts show only what each source record states.
        </p>
        {citations.length > 0 && (
          <p>
            Community names: {citations.join("; ")}. Coordinates are approximate.
          </p>
        )}
      </footer>
    </section>
  );
}
