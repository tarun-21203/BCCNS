import { useEffect, useMemo, useState } from "react";
import { getCoverageInputs } from "../api/mapApi.js";
import { buildCoverage, LIMITED_MAX } from "../lib/coverage.js";
import CoverageMap from "../components/CoverageMap.jsx";
import CoverageTable from "../components/CoverageTable.jsx";

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

      {view === "map" ? (
        <CoverageMap rows={coverage.rows} selected={selected} onSelect={setSelected} />
      ) : (
        <CoverageTable rows={coverage.rows} selected={selected} onSelect={setSelected} />
      )}

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
