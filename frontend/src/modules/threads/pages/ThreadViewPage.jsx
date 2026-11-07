import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllRecords } from "../api/threadsApi.js";
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_PLURALS, buildGraph, getThread, listEntities } from "../lib/graph.js";
import ThreadGraph from "../components/ThreadGraph.jsx";
import ThreadList from "../components/ThreadList.jsx";
import EvidencePanel from "../components/EvidencePanel.jsx";
import "../threads.css";

const DEFAULT_FOCUS = "community:africville";
const ENTITY_TYPES = ["community", "place", "person", "subject"];

export default function ThreadViewPage() {
  const [data, setData] = useState({ loading: true });
  const [params, setParams] = useSearchParams();
  const [includeGeneric, setIncludeGeneric] = useState(false);
  const [hideLeaves, setHideLeaves] = useState(true);
  const [types, setTypes] = useState(ENTITY_TYPES);
  const [view, setView] = useState("graph");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAllRecords().then((r) => setData({ loading: false, ...r }));
  }, []);

  const graph = useMemo(() => (data.records ? buildGraph(data.records) : null), [data.records]);
  const entities = useMemo(
    () => (graph ? listEntities(graph, { includeGeneric: true }) : []),
    [graph]
  );

  const requested = params.get("focus");
  const focusId =
    graph && requested && graph.nodes.has(requested)
      ? requested
      : graph && graph.nodes.has(DEFAULT_FOCUS)
        ? DEFAULT_FOCUS
        : entities[0]?.id;

  const thread = useMemo(
    () =>
      graph && focusId
        ? getThread(graph, focusId, { includeGeneric, hideLeaves, types })
        : null,
    [graph, focusId, includeGeneric, hideLeaves, types]
  );

  const setFocus = (id) => {
    setParams({ focus: id });
    setSelected({ kind: "node", id });
  };

  if (data.loading) return <p>Loading records…</p>;

  return (
    <section className="tv">
      <header className="tv-head">
        <h1>Thread View</h1>
        <p className="tv-lede">
          Follow how indexed records from different institutions connect through the people,
          places, communities and subjects they are described with.
        </p>
      </header>

      {data.offline && (
        <p className="notice" role="status">
          Offline sample data: the API could not be reached, so this view uses a copy of the
          sample records.
        </p>
      )}

      <p className="tv-meaning">
        <strong>What a line means:</strong> a record is described with that person, place,
        community or subject in its catalogue entry or in our curated tags. Two records joined
        through the same entity share that description; it is not a claim that they are
        historically related. People are only joined when the source gives the identical name.
      </p>

      {requested && graph && !graph.nodes.has(requested) && (
        <p className="notice" role="status">
          “{requested}” is not in the indexed records. Showing {graph.nodes.get(focusId)?.label}{" "}
          instead.
        </p>
      )}

      <div className="tv-controls">
        <label>
          Start from{" "}
          <select value={focusId || ""} onChange={(e) => setFocus(e.target.value)}>
            {ENTITY_TYPES.map((t) => (
              <optgroup key={t} label={ENTITY_TYPE_PLURALS[t]}>
                {entities
                  .filter((n) => n.type === t)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.recordCount})
                    </option>
                  ))}
              </optgroup>
            ))}
            {focusId?.startsWith("record:") && (
              <optgroup label="Record">
                <option value={focusId}>{graph.nodes.get(focusId).label}</option>
              </optgroup>
            )}
          </select>
        </label>

        <fieldset className="tv-types">
          <legend>Show</legend>
          {ENTITY_TYPES.map((t) => (
            <label key={t}>
              <input
                type="checkbox"
                checked={types.includes(t)}
                onChange={(e) =>
                  setTypes((prev) =>
                    e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)
                  )
                }
              />{" "}
              {ENTITY_TYPE_PLURALS[t]}
            </label>
          ))}
        </fieldset>

        <label>
          <input
            type="checkbox"
            checked={hideLeaves}
            onChange={(e) => setHideLeaves(e.target.checked)}
          />{" "}
          Only show what links records
        </label>
        <label>
          <input
            type="checkbox"
            checked={includeGeneric}
            onChange={(e) => setIncludeGeneric(e.target.checked)}
          />{" "}
          Include very common terms ({entities.filter((n) => n.generic).map((n) => n.label).join(", ") || "none"})
        </label>

        <div className="tv-viewtoggle" role="tablist" aria-label="View">
          {["graph", "list"].map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={view === v ? "is-active" : ""}
              onClick={() => setView(v)}
            >
              {v === "graph" ? "Graph" : "List"}
            </button>
          ))}
        </div>
      </div>

      {!thread || !thread.focus ? (
        <p>No entities found in the indexed records.</p>
      ) : (
        <div className="tv-body">
          <div className="tv-main">
            {view === "graph" ? (
              <>
                <ThreadGraph
                  thread={thread}
                  selected={selected}
                  onSelectNode={(n) => setSelected({ kind: "node", id: n.id })}
                  onSelectEdge={(e) => setSelected({ kind: "edge", id: e.id })}
                />
                <Legend />
              </>
            ) : (
              <ThreadList thread={thread} onFocus={setFocus} />
            )}
            <p className="tv-muted tv-scope">
              Built from {graph.recordCount} indexed sample records. Connections reflect how
              these records are catalogued, not every link that exists in history or in other
              collections.
            </p>
          </div>
          <EvidencePanel
            graph={graph}
            selected={selected}
            onFocus={setFocus}
            includeGeneric={includeGeneric}
          />
        </div>
      )}
    </section>
  );
}

function Legend() {
  return (
    <ul className="tv-legend" aria-label="Legend">
      <li><svg width="16" height="16"><rect x="2" y="2" width="12" height="12" rx="2" className="tv-record tv-shape" /></svg> Record</li>
      <li><svg width="16" height="16"><circle cx="8" cy="8" r="6" className="tv-community tv-shape" /></svg> Community</li>
      <li><svg width="16" height="16"><circle cx="8" cy="8" r="6" className="tv-place tv-shape" /></svg> Place</li>
      <li><svg width="16" height="16"><polygon points="8,1 15,8 8,15 1,8" className="tv-person tv-shape" /></svg> Person</li>
      <li><svg width="16" height="16"><circle cx="8" cy="8" r="5" className="tv-subject tv-shape" /></svg> Subject</li>
      <li><svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" className="tv-legend-source" /></svg> From source record</li>
      <li><svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" className="tv-legend-derived" /></svg> Added by THREADS (curated)</li>
    </ul>
  );
}
