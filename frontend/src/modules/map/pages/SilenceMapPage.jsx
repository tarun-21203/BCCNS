import { useEffect, useMemo, useState } from "react";
import { getCoverageInputs } from "../api/mapApi.js";
import { buildCoverage } from "../lib/coverage.js";
import CoverageMap from "../components/CoverageMap.jsx";
import CoverageTable from "../components/CoverageTable.jsx";
import CommunityPanel from "../components/CommunityPanel.jsx";
import Legend from "../components/Legend.jsx";

// Silence Map (Member 4). Map view with a table view that works without
// map tiles or network.
export default function SilenceMapPage() {
  const [state, setState] = useState({ loading: true });
  const [view, setView] = useState("map");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getCoverageInputs().then((r) => setState({ loading: false, ...r }));
  }, []);

  const coverage = useMemo(
    () => (state.loading ? null : buildCoverage(state.communities, state.records)),
    [state],
  );

  if (state.loading) return <p>Loading coverage…</p>;

  const citations = [...new Set(coverage.rows.map((r) => r.citation).filter(Boolean))];
  const selectedRow = coverage.rows.find((r) => r.name === selected) || null;

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

      <div className="sm-viewtoggle" role="group" aria-label="View">
        {["map", "table"].map((v) => (
          <button
            key={v}
            type="button"
            className={view === v ? "is-active" : undefined}
            aria-pressed={view === v}
            onClick={() => setView(v)}
          >
            {v === "map" ? "Map" : "Table"}
          </button>
        ))}
      </div>

      <div className="sm-body">
        <div className="sm-main">
          {view === "map" ? (
            <CoverageMap rows={coverage.rows} selected={selected} onSelect={setSelected} />
          ) : (
            <CoverageTable rows={coverage.rows} selected={selected} onSelect={setSelected} />
          )}
          {coverage.excluded.length > 0 && (
            <p className="sm-muted">
              {coverage.excluded.length} record(s) not counted: their community values were added
              by THREADS and have not been reviewed yet.
            </p>
          )}
          <Legend citations={citations} />
        </div>
        <CommunityPanel
          row={selectedRow}
          rows={coverage.rows}
          totalRecords={coverage.totalRecords}
          onClose={() => setSelected(null)}
        />
      </div>
    </section>
  );
}
