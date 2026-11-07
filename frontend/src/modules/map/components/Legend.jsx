import { COVERAGE_LABELS, LIMITED_MAX } from "../lib/coverage.js";

// Legend for the map and table. Labels and definitions come from the shared
// data contract; the threshold comes from LIMITED_MAX.
export default function Legend({ citations }) {
  return (
    <section className="sm-legend" aria-label="Legend">
      <h2>Legend</h2>
      <ul>
        {Object.entries(COVERAGE_LABELS).map(([key, l]) => (
          <li key={key}>
            <span className={`sm-swatch sm-swatch--round sm-badge--${key}`} aria-hidden="true" />
            <strong>{l.label}</strong>
            {key === "limited" ? ` (${LIMITED_MAX} or fewer records)` : ""}: {l.help}
          </li>
        ))}
        <li>
          <span className="sm-swatch sm-swatch--round sm-swatch--hollow" aria-hidden="true" />
          <strong>Hollow marker</strong>: no records in the indexed sources yet.
        </li>
        <li>
          <strong>Marker size</strong> grows with the number of indexed records.
        </li>
      </ul>
      <p className="sm-muted">
        Digitization counts show only what each source record states. Community values added by
        THREADS are counted only after a person has reviewed them.
      </p>
      {citations.length > 0 && (
        <p className="sm-muted">
          Community names: {citations.join("; ")}. Map locations are approximate.
        </p>
      )}
    </section>
  );
}
