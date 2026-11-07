import { useEffect, useState } from "react";
import { getRecords } from "../api/searchApi.js";

// Throwaway page for Task 1: proves the API client and fallback work.
// Replaced by the real search page in Task 2.
export default function RecordListPreview() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    getRecords().then((r) => setState({ loading: false, ...r }));
  }, []);

  if (state.loading) return <p>Loading…</p>;
  return (
    <section>
      {state.offline && (
        <p className="notice" role="status">
          Offline sample data: the API could not be reached, so these are copies of the sample
          records.
        </p>
      )}
      <h1>{state.count} records</h1>
      <ul>
        {state.records.map((r) => (
          <li key={r.id}>
            {r.title} <small>({r.source_institution})</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
