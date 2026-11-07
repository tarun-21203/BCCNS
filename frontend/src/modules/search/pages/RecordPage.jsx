import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getMappings, getRecord, getRecords } from "../api/searchApi.js";
import { threadHref } from "../../../shell/links.js";
import AccessInfo from "../components/AccessInfo.jsx";
import Provenance from "../components/Provenance.jsx";
import RelatedRecords from "../components/RelatedRecords.jsx";
import { NOT_PROVIDED, isDerived, resourceTypeLabel } from "../lib/labels.js";
import { relatedRecords } from "../lib/related.js";

const TAG_GROUPS = [
  ["people", "People", "people"],
  ["places", "Places", "place"],
  ["communities", "Communities", "community"],
  ["subjects", "Subjects", "subject"],
];

const NewTab = () => <span className="visually-hidden"> (opens in a new tab)</span>;

function yearsText(r) {
  const { start_date: s, end_date: e } = r;
  if (s == null && e == null) return "Not stated";
  const span = s === e || e == null ? `${s}` : s == null ? `${e}` : `${s}–${e}`;
  return r.date_approximate ? `${span} (approximate)` : span;
}

export default function RecordPage() {
  const { id } = useParams();
  const location = useLocation();
  const headingRef = useRef(null);
  const [state, setState] = useState({ loading: true });
  const [all, setAll] = useState([]);
  const [mappings, setMappings] = useState({});

  useEffect(() => {
    let stale = false;
    setState({ loading: true });
    getRecord(id).then((r) => !stale && setState({ loading: false, ...r }));
    return () => {
      stale = true;
    };
  }, [id]);

  useEffect(() => {
    getRecords().then((r) => setAll(r.records));
    getMappings().then((list) => setMappings(Object.fromEntries(list.map((m) => [m.source_id, m]))));
  }, []);

  const record = state.record;
  const related = useMemo(() => (record ? relatedRecords(record, all) : []), [record, all]);

  // Name the page for screen readers and the browser tab, and move focus to the
  // heading so keyboard and screen-reader users start at the top of the new page.
  useEffect(() => {
    if (state.loading) return undefined;
    const before = document.title;
    document.title = record ? `${record.title} – THREADS` : "Record not found – THREADS";
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    return () => {
      document.title = before;
    };
  }, [state.loading, record]);

  const back = location.state?.from || "/search/results";

  if (state.loading) {
    return (
      <section className="page record-page" aria-busy="true">
        <p className="status">Loading record…</p>
        <ul className="results"><li className="acard acard-skeleton" aria-hidden="true"><span className="sk sk-lg" /><span className="sk" /><span className="sk sk-md" /></li></ul>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="page record-page">
        <h1 ref={headingRef} tabIndex={-1}>Record not found</h1>
        <p className="empty">There is no record “{id}” in the sources indexed so far.</p>
        <Link className="btn btn-primary" to="/search/results">Search the index</Link>
      </section>
    );
  }

  const r = record;
  const mapping = mappings[r.source_id];
  const hasTags = TAG_GROUPS.some(([f]) => r[f]?.length);
  const anyDerived = TAG_GROUPS.some(([f]) => isDerived(r, f) && r[f]?.length);

  return (
    <article className="page record-page" aria-labelledby="rec-title">
      <Link className="back-link" to={back}><span aria-hidden="true">←</span> Back to results</Link>

      {state.offline && (
        <p className="notice" role="status">Offline sample data: showing a copy of this record.</p>
      )}

      <header className="rec-head">
        <p className="rec-inst"><span className="ac-label">Held by</span> {r.source_institution}</p>
        <h1 id="rec-title" ref={headingRef} tabIndex={-1}>{r.title}</h1>
        <p className="rec-meta">
          {resourceTypeLabel(r.resource_type)} · {r.date_display || NOT_PROVIDED}
        </p>
      </header>

      <div className="rec-layout">
        <div className="rec-main">
          {r.description && (
            <section aria-labelledby="about-h">
              <h2 id="about-h">About this record</h2>
              <p className="rec-desc">{r.description}</p>
            </section>
          )}

          {r.content_note && (
            <aside className="rec-note" role="note">
              <strong>Content note.</strong> {r.content_note}
            </aside>
          )}

          <section aria-labelledby="details-h">
            <h2 id="details-h">Details</h2>
            <dl className="rec-facts">
              <div><dt>Resource type</dt><dd>{resourceTypeLabel(r.resource_type)}</dd></div>
              <div><dt>Date as written by the source</dt><dd>{r.date_display || NOT_PROVIDED}</dd></div>
              <div><dt>Years used for filtering</dt><dd>{yearsText(r)}</dd></div>
              <div><dt>Original ID</dt><dd className="prov-mono">{r.original_id}</dd></div>
            </dl>
          </section>

          {hasTags && (
            <section aria-labelledby="tags-h">
              <h2 id="tags-h">People, places, communities and subjects</h2>
              <dl className="ac-tags rec-tags">
                {TAG_GROUPS.map(([field, label, param]) =>
                  r[field]?.length ? (
                    <div key={field} className="ac-tag-row">
                      <dt>{label}</dt>
                      <dd>
                        {r[field].map((v) => (
                          <Link key={v} to={`/search/results?${param}=${encodeURIComponent(v)}`}
                            className={isDerived(r, field) ? "tag tag-derived tag-link" : "tag tag-link"}
                            title={isDerived(r, field) ? "Added by THREADS, not supplied by the source" : undefined}>
                            {v}
                          </Link>
                        ))}
                      </dd>
                    </div>
                  ) : null
                )}
              </dl>
              <p className="ac-derived-note">
                Each tag opens a search for it.{anyDerived && " Dashed tags were added by THREADS, not supplied by the source."}
              </p>
            </section>
          )}

          {(r.original_terms?.length > 0 || r.search_terms?.length > 0) && (
            <section aria-labelledby="terms-h">
              <h2 id="terms-h">Terminology</h2>
              {r.original_terms?.length > 0 && (
                <>
                  <p className="rec-hint">
                    Catalogue wording, kept exactly as the source wrote it so the record can be found. Historical
                    catalogues may use outdated or harmful language.
                  </p>
                  <ul className="term-list">
                    {r.original_terms.map((t) => <li key={t} className="tag">{t}</li>)}
                  </ul>
                </>
              )}
              {r.search_terms?.length > 0 && (
                <>
                  <p className="rec-hint">
                    Search aids added by THREADS. This is a draft for community review, not an authoritative vocabulary.
                  </p>
                  <ul className="term-list">
                    {r.search_terms.map((t) => <li key={t} className="tag tag-derived">{t}</li>)}
                  </ul>
                </>
              )}
            </section>
          )}
        </div>

        <aside className="rec-side" aria-label="Reach the original">
          <div className="acard rec-panel">
            <h2 className="rec-panel-h">Reach the original</h2>
            <div className="ac-grid rec-stack">
              <AccessInfo record={r} mapping={mapping} />
            </div>
            <a className="btn btn-primary rec-open" href={r.original_url} target="_blank" rel="noopener noreferrer">
              Open at {r.source_institution} ↗<NewTab />
            </a>
            <Link className="btn btn-ghost rec-open" to={threadHref(`record:${r.id}`)}>
              See its connections in Thread View
            </Link>
          </div>
        </aside>
      </div>

      <section className="rec-prov" aria-labelledby="prov-h">
        <h2 id="prov-h">Provenance</h2>
        <Provenance record={r} mapping={mapping} open />
      </section>

      <RelatedRecords items={related} />
    </article>
  );
}
