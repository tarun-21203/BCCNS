import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getMappings, getRecords } from "../api/searchApi.js";
import AccessCard from "../components/AccessCard.jsx";
import CardSkeleton from "../components/CardSkeleton.jsx";

const SORTS = [
  { value: "", label: "Source order" },
  { value: "date_asc", label: "Date, oldest first" },
  { value: "date_desc", label: "Date, newest first" },
];

// The API returns no relevance score, so "Source order" is the API's own
// order. Records without a start year sort last in either direction.
function sortRecords(records, sort) {
  if (!sort) return records;
  const dir = sort === "date_asc" ? 1 : -1;
  return [...records].sort((a, b) => {
    const x = a.start_date;
    const y = b.start_date;
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (x - y) * dir;
  });
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const community = params.get("community") || "";
  const sort = params.get("sort") || "";

  const [text, setText] = useState(q);
  const [state, setState] = useState({ loading: true });
  const [mappings, setMappings] = useState({});

  useEffect(() => setText(q), [q]);

  useEffect(() => {
    getMappings().then((list) => setMappings(Object.fromEntries(list.map((m) => [m.source_id, m]))));
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

  const records = useMemo(() => (state.records ? sortRecords(state.records, sort) : []), [state.records, sort]);

  // Update one or more URL params, dropping empty ones.
  function update(changes) {
    const next = { ...Object.fromEntries(params), ...changes };
    Object.keys(next).forEach((k) => !next[k] && delete next[k]);
    setParams(next);
  }

  function onSubmit(e) {
    e.preventDefault();
    update({ q: text.trim() });
  }

  return (
    <section className="page results-page">
      <h1 className="visually-hidden">Search results</h1>

      <form className="search-form" role="search" onSubmit={onSubmit}>
        <label htmlFor="q" className="visually-hidden">Search records</label>
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
          <button type="button" onClick={() => update({ community: "" })} aria-label={`Remove community filter ${community}`}>
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

      <div className="results-bar">
        <p className="status" aria-live="polite">
          {state.loading ? (
            "Searching…"
          ) : (
            <>
              {state.count} {state.count === 1 ? "record" : "records"} found in indexed sources
              {q && <> for “{q}”</>}
            </>
          )}
        </p>
        <label className="sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {state.loading ? (
        <ul className="results">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </ul>
      ) : records.length === 0 ? (
        <p className="empty">
          No matching records in the sources indexed so far. This does not mean no historical
          records exist: other institutions and collections are not indexed yet.
        </p>
      ) : (
        <ul className="results">
          {records.map((r, i) => (
            <AccessCard key={r.id} record={r} mapping={mappings[r.source_id]} index={i} />
          ))}
        </ul>
      )}

      <p className="sample-note">
        Prototype index of sample records. Counts describe what is indexed here, not what exists.
      </p>
    </section>
  );
}
