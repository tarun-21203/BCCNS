import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getRecords } from "../api/searchApi.js";
import ResultRow from "../components/ResultRow.jsx";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const community = params.get("community") || "";

  const [text, setText] = useState(q);
  const [catalogue, setCatalogue] = useState(null);
  const [state, setState] = useState({ loading: true });

  // Keep the box in sync when the URL changes (back/forward, shared link).
  useEffect(() => setText(q), [q]);

  // Unfiltered totals, for the sample-data banner.
  useEffect(() => {
    getRecords().then(({ records }) =>
      setCatalogue({
        total: records.length,
        institutions: new Set(records.map((r) => r.source_institution)).size,
      })
    );
  }, []);

  useEffect(() => {
    let stale = false;
    setState((s) => ({ ...s, loading: true }));
    getRecords({ search: q, community }).then((result) => {
      if (!stale) setState({ loading: false, ...result });
    });
    return () => {
      stale = true;
    };
  }, [q, community]);

  function onSubmit(e) {
    e.preventDefault();
    const next = text.trim();
    const nextParams = {};
    if (next) nextParams.q = next;
    if (community) nextParams.community = community;
    setParams(nextParams);
  }

  return (
    <section className="page">
      {catalogue && (
        <p className="banner">
          Prototype: searching {catalogue.total} sample records from {catalogue.institutions}{" "}
          institutions. This is a demo sample, not a measure of what exists.
        </p>
      )}

      <form className="search-form" role="search" onSubmit={onSubmit}>
        <label htmlFor="q" className="visually-hidden">
          Search records
        </label>
        <input
          id="q"
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search a community, person, place or topic"
        />
        <button type="submit">Search</button>
      </form>

      {community && (
        <p className="active-filter">
          Community: <strong>{community}</strong>{" "}
          <button type="button" onClick={() => setParams(q ? { q } : {})} aria-label={`Remove community filter ${community}`}>
            ×
          </button>
        </p>
      )}

      {state.offline && (
        <p className="notice" role="status">
          Offline sample data: the API could not be reached, so these results come from a copy of
          the sample records.
        </p>
      )}

      <div aria-live="polite">
        {state.loading ? (
          <p className="status">Searching…</p>
        ) : (
          <>
            <p className="status">
              {state.count} {state.count === 1 ? "record" : "records"} found in indexed sources
              {q && <> for “{q}”</>}
            </p>
            {state.count === 0 ? (
              <p className="empty">
                No matching records in the sources indexed so far. This does not mean no historical
                records exist: other institutions and collections are not indexed yet.
              </p>
            ) : (
              <ul className="results">
                {state.records.map((r) => (
                  <ResultRow key={r.id} record={r} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
