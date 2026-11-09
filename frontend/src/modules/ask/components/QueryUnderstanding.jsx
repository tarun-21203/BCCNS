import { chipKindLabel } from "../lib/labels.js";

// Shows exactly what was searched: filters parsed from the question and Language Bridge terms.
export default function QueryUnderstanding({ understood, bridge }) {
  const chips = understood?.chips || [];
  const matches = bridge?.matched || [];
  if (!chips.length && !matches.length) return null;

  return (
    <section className="ask-understood" aria-label="How THREADS read your question">
      {chips.length > 0 && (
        <div className="ask-chips">
          <span className="ask-label">Searched for</span>
          {chips.map((c) => (
            <span key={`${c.kind}-${c.label}`} className={`ask-chip${c.applied_as_filter ? " is-filter" : ""}`}
                  title={c.applied_as_filter ? "Applied as a filter" : "Used to rank results"}>
              <span className="ask-chip-kind">{chipKindLabel(c.kind)}</span> {c.label}
            </span>
          ))}
        </div>
      )}

      {matches.length > 0 && (
        <div className="ask-bridge">
          <span className="ask-label">Language Bridge</span>
          <ul>
            {matches.map((m) => {
              const historical = new Set(m.historical_terms || []);
              const modern = m.also_searched.filter((t) => !historical.has(t));
              const older = m.also_searched.filter((t) => historical.has(t));
              return (
                <li key={m.concept_id}>
                  “{m.matched_term}” also searched{" "}
                  {modern.length > 0 && <span>{modern.join(", ")}</span>}
                  {modern.length > 0 && older.length > 0 && " and "}
                  {older.length > 0 && (
                    <span className="ask-historical" title="Terms used in older catalogue descriptions">
                      older catalogue terms: {older.join(", ")}
                    </span>
                  )}
                  {m.note && <span className="ask-bridge-note"> — {m.note}</span>}
                </li>
              );
            })}
          </ul>
          <p className="ask-fine">Terminology map is a draft for community review, not an authoritative vocabulary.</p>
        </div>
      )}
    </section>
  );
}
