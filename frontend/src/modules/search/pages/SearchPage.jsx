import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMappings, getRecords } from "../api/searchApi.js";
import AccessCard from "../components/AccessCard.jsx";
import ActiveFilters from "../components/ActiveFilters.jsx";
import CardSkeleton from "../components/CardSkeleton.jsx";
import FilterRail from "../components/FilterRail.jsx";
import TransitionLink from "../components/TransitionLink.jsx";
import { FILTER_KEYS, readFilters } from "../lib/filters.js";

const SORTS = [
  { value: "", label: "Source order" },
  { value: "date_asc", label: "Date, oldest first" },
  { value: "date_desc", label: "Date, newest first" },
];

// With search text, results come back ranked by how well they match (GET /ai/records), so the
// default order is "Best match"; without text it is the API's own source order.
// Records without a start year sort last in either direction.
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

// Which related or older catalogue terms the search also used (Language Bridge).
function BridgeNote({ bridge }) {
  const matched = bridge?.matched || [];
  if (!matched.length) return null;
  return (
    <p className="bridge-note" role="note">
      Also searched{" "}
      {matched.map((m, i) => (
        <span key={m.concept_id}>
          {i > 0 && "; "}
          <strong>{m.also_searched.join(", ")}</strong> for “{m.matched_term}”
        </span>
      ))}
      . <span className="bridge-draft">Terminology map is a draft for community review.</span>
    </p>
  );
}

// Hand the same words to Ask the archive (Member 3), which answers from the records with citations.
function AskLink({ q }) {
  return (
    <p className="ask-handoff">
      Have a question about this?{" "}
      <Link to={`/ask?q=${encodeURIComponent(q)}`}>Ask the archive <span aria-hidden="true">→</span></Link>
    </p>
  );
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const sort = params.get("sort") || "";
  const filters = useMemo(() => readFilters(params), [params]);
  const filterKey = JSON.stringify(filters);
  const activeCount = Object.keys(filters).filter((k) => k !== "to_year").length || (filters.to_year ? 1 : 0);

  const [text, setText] = useState(q);
  const [state, setState] = useState({ loading: true });
  const [catalogue, setCatalogue] = useState([]);
  const [mappings, setMappings] = useState({});
  const [drawer, setDrawer] = useState(false);
  const toggleRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => setText(q), [q]);

  useEffect(() => {
    getMappings().then((list) => setMappings(Object.fromEntries(list.map((m) => [m.source_id, m]))));
    getRecords().then((r) => setCatalogue(r.records));
  }, []);

  useEffect(() => {
    let stale = false;
    setState((s) => ({ ...s, loading: true }));
    getRecords({ search: q, ...filters }).then((result) => {
      if (!stale) setState({ loading: false, ...result });
    });
    return () => {
      stale = true;
    };
    // filterKey stands in for the filters object, which is rebuilt on every URL change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filterKey]);

  // Mobile drawer: Escape closes, background scroll is locked, focus moves in and back out.
  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const toggle = toggleRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      toggle?.focus();
    };
  }, [drawer]);

  const records = useMemo(() => (state.records ? sortRecords(state.records, sort) : []), [state.records, sort]);

  // Update URL params, dropping empty ones.
  function update(changes) {
    const next = { ...Object.fromEntries(params), ...changes };
    Object.keys(next).forEach((k) => !next[k] && delete next[k]);
    setParams(next);
  }
  const setFilter = (key, value) => update({ [key]: value });
  const setYears = (from_year, to_year) => update({ from_year, to_year });
  const removeFilters = (keys) => update(Object.fromEntries(keys.map((k) => [k, ""])));
  const clearFilters = () => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, ""])));

  function onSubmit(e) {
    e.preventDefault();
    update({ q: text.trim() });
  }

  // With search text, the rail counts within the text matches (already word-matched and
  // Language-Bridge-expanded), so the counts agree with the results list.
  const rail = (
    <FilterRail
      catalogue={state.textMatches || catalogue}
      filters={filters}
      q={state.textMatches ? "" : q}
      onChange={setFilter}
      onYears={setYears}
      onClear={clearFilters}
      activeCount={Object.keys(filters).length}
    />
  );

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

      <div className="results-layout">
        <aside className="filter-side" aria-label="Filters">{catalogue.length > 0 && rail}</aside>

        <div className="results-main">
          {state.offline && (
            <p className="notice" role="status">
              Offline sample data: the API could not be reached, so these results come from a copy of
              the sample records.
            </p>
          )}

          <ActiveFilters filters={filters} onRemove={removeFilters} onClear={clearFilters} />

          {!state.loading && <BridgeNote bridge={state.bridge} />}

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
            <div className="results-tools">
              <button ref={toggleRef} type="button" className="filter-toggle" onClick={() => setDrawer(true)}
                aria-haspopup="dialog">
                Filters{Object.keys(filters).length > 0 && <span className="filter-count">{activeCount}</span>}
              </button>
              <label className="sort">
                <span>Sort</span>
                <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{!s.value && q ? "Best match" : s.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {state.loading ? (
            <ul className="results">
              {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </ul>
          ) : records.length === 0 ? (
            <div className="empty">
              <p>
                No matching records in the sources indexed so far. This does not mean no historical
                records exist: other institutions and collections are not indexed yet.
              </p>
              {Object.keys(filters).length > 0 && (
                <button type="button" className="btn btn-ghost" onClick={clearFilters}>Clear filters</button>
              )}
              {q && <AskLink q={q} />}
            </div>
          ) : (
            <ul className="results">
              {records.map((r, i) => (
                <AccessCard key={r.id} record={r} mapping={mappings[r.source_id]} index={i} />
              ))}
            </ul>
          )}

          {q && records.length > 0 && <AskLink q={q} />}

          <p className="sample-note">
            Prototype index of sample records. Counts describe what is indexed here, not what exists.{" "}
            <TransitionLink to="/search/institutions" className="note-link">Which institutions are indexed?</TransitionLink>
          </p>
        </div>
      </div>

      {drawer && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
          <div className="drawer-panel">
            <div className="drawer-top">
              <button ref={closeRef} type="button" className="btn btn-ghost" onClick={() => setDrawer(false)}>
                Close
              </button>
            </div>
            <div className="drawer-body">{rail}</div>
            <div className="drawer-foot">
              <button type="button" className="btn btn-primary" onClick={() => setDrawer(false)}>
                Show {state.loading ? "" : state.count} {state.count === 1 ? "record" : "records"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
