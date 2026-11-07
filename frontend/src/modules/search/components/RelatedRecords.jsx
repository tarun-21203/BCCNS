import { recordHref } from "../../../shell/links.js";
import TransitionLink from "./TransitionLink.jsx";

export default function RelatedRecords({ items, from }) {
  return (
    <section className="rec-related" aria-labelledby="related-h">
      <h2 id="related-h">Described the same way</h2>
      <p className="rec-hint">
        These records share a person, place, community or subject with this one. A shared tag means both
        records are described with it. It does not mean they are historically related.
      </p>
      {items.length === 0 ? (
        <p className="empty">No other indexed record shares a specific tag with this one.</p>
      ) : (
        <ul className="rel-list">
          {items.map(({ record: r, shared }) => (
            <li key={r.id} className="rel-item" data-morph>
              <TransitionLink morph className="rel-title" to={recordHref(r.id)} state={{ from, record: r }} data-morph-title>{r.title}</TransitionLink>
              <span className="rel-inst" data-morph-inst>{r.source_institution}</span>
              <span className="rel-shared">
                <span className="ac-label">Shares</span>
                {shared.map((s) => (
                  <span key={`${s.field}:${s.value}`} className={s.derived ? "tag tag-derived" : "tag"}
                    title={s.derived ? "Added by THREADS, not supplied by the source" : undefined}>
                    {s.value} <small>({s.kind})</small>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
