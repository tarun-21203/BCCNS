import TransitionLink from "./TransitionLink.jsx";
import { DIGITIZATION_ORDER, digitizationSummary, plural } from "../lib/institutions.js";
import { digitizationLabel } from "../lib/labels.js";
import { harvestLabel } from "../lib/provenance.js";

const NewTab = () => <span className="visually-hidden"> (opens in a new tab)</span>;
const ext = { target: "_blank", rel: "noopener noreferrer" };

// One indexed institution: who it is, how its metadata reached us, what we hold,
// and what it says about access. Missing values are stated, never filled in.
export default function InstitutionCard({ source }) {
  const { id, name, mapping: m, stats } = source;
  const browse = `/search/results?institution=${encodeURIComponent(name)}`;
  const total = stats.count;

  return (
    <li className="acard inst-card" id={id} data-morph>
      <article aria-labelledby={`inst-${id}`}>
        <header className="inst-head">
          <div>
            <p className="ac-label">Source · <span className="prov-mono">{id}</span></p>
            <h2 id={`inst-${id}`} className="ac-title">{name}</h2>
          </div>
          {m?.institution_url && (
            <a className="btn btn-ghost" href={m.institution_url} {...ext}>
              Visit website ↗<NewTab />
            </a>
          )}
        </header>

        <dl className="inst-facts">
          <div>
            <dt>Records indexed</dt>
            <dd className="inst-big">{total}</dd>
          </div>
          <div>
            <dt>Years covered</dt>
            <dd>{stats.years ? `${stats.years.min}–${stats.years.max}` : "Not stated"}</dd>
          </div>
          <div>
            <dt>How the metadata was collected</dt>
            <dd>{m ? harvestLabel(m.harvest_method) : "Not recorded"}</dd>
          </div>
          <div>
            <dt>Mapping file</dt>
            <dd className="prov-mono">{m ? `mappings/${id}.json` : "None found for this source"}</dd>
          </div>
        </dl>

        {total > 0 ? (
          <>
            <h3 className="prov-h">Digitization of the records we index</h3>
            <div className="dig-bar" aria-hidden="true">
              {DIGITIZATION_ORDER.filter((k) => stats.digitization[k] > 0).map((k) => (
                <span key={k} className={`dig-seg seg-${k}`} style={{ flexGrow: stats.digitization[k] }} />
              ))}
            </div>
            <ul className="dig-legend" aria-label={`Digitization: ${digitizationSummary(stats.digitization)}`}>
              {DIGITIZATION_ORDER.filter((k) => stats.digitization[k] > 0).map((k) => (
                <li key={k} className={`dig dig-${k}`}>
                  <span className="dig-icon" aria-hidden="true" />
                  <strong>{stats.digitization[k]}</strong> {digitizationLabel(k)}
                </li>
              ))}
            </ul>

            <div className="inst-cols">
              <div>
                <h3 className="prov-h">Resource types</h3>
                <ul className="term-list">
                  {stats.types.map(([t, n]) => <li key={t} className="tag">{t} <small>({n})</small></li>)}
                </ul>
              </div>
              {stats.communities.length > 0 && (
                <div>
                  <h3 className="prov-h">Communities these records touch</h3>
                  <ul className="term-list">
                    {stats.communities.map(([c, n]) => (
                      <li key={c}>
                        <TransitionLink className="tag tag-link tag-derived"
                          to={`/search/results?institution=${encodeURIComponent(name)}&community=${encodeURIComponent(c)}`}>
                          {c} <small>({n})</small>
                        </TransitionLink>
                      </li>
                    ))}
                  </ul>
                  <p className="ac-derived-note">Community tags were added by THREADS, not supplied by the source.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="empty">No records are indexed from this source yet.</p>
        )}

        <h3 className="prov-h">Access, in the institution's words</h3>
        {m?.institution_access?.summary ? (
          <p className="prov-p prov-quote">
            “{m.institution_access.summary}”{" "}
            {m.institution_access.source_url && (
              <a href={m.institution_access.source_url} {...ext}>Where this comes from<NewTab /> ↗</a>
            )}
          </p>
        ) : (
          <p className="prov-p">No general access policy is recorded for this source.</p>
        )}
        <p className="prov-p">
          {m?.licence_or_terms_url ? (
            <a href={m.licence_or_terms_url} {...ext}>Terms of use for this source<NewTab /> ↗</a>
          ) : (
            "No terms-of-use link is recorded for this source yet."
          )}
        </p>

        <footer className="ac-foot">
          <span className="ac-ref">The original records stay with {name}.</span>
          <span className="ac-actions">
            <TransitionLink className="btn btn-primary" to={browse} aria-disabled={total === 0}>
              Browse {plural(total, "record", "records")}
            </TransitionLink>
          </span>
        </footer>
      </article>
    </li>
  );
}
