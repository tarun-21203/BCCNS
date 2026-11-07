import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRecord } from "../api/searchApi.js";

// Temporary minimal record page so links to /search/records/:id resolve.
// Replaced by the full record detail view (Task 6).
export default function RecordPage() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    getRecord(id).then((r) => setState({ loading: false, ...r }));
  }, [id]);

  if (state.loading) return <section className="page"><p className="status">Loading…</p></section>;
  if (!state.record) {
    return (
      <section className="page">
        <p className="empty">No record with id “{id}” in the indexed sources.</p>
        <Link to="/search/results">Back to search</Link>
      </section>
    );
  }
  const r = state.record;
  return (
    <section className="page">
      <h1>{r.title}</h1>
      <p>{r.source_institution} · {r.original_id}</p>
      <p><a href={r.original_url} target="_blank" rel="noreferrer">Open the original record ↗</a></p>
      <Link to="/search/results">Back to search</Link>
    </section>
  );
}
