import { Link } from "react-router-dom";
import { recordHref } from "../../../shell/links.js";
import { numberCitations } from "../lib/labels.js";

// The grounded answer, or an explicit "not enough evidence" response.
export default function AnswerPanel({ result }) {
  if (result.status === "answered") return <Answered result={result} />;
  if (result.status === "insufficient_evidence") return <Abstained result={result} />;
  return (
    <section className="ask-panel ask-records-only" role="status">
      <h2>No AI answer</h2>
      <p>{result.message}</p>
    </section>
  );
}

function Answered({ result }) {
  const claims = result.answer.claims;
  const numbers = numberCitations(claims);
  const v = result.verification;

  return (
    <section className="ask-panel ask-answer" aria-label="Answer">
      <div className="ask-panel-head">
        <h2>What the indexed records show</h2>
        <ServedFrom result={result} />
      </div>

      <ul className="ask-claims">
        {claims.map((claim, i) => (
          <li key={i}>
            {claim.text}{" "}
            {[...new Set(claim.citations.map((c) => c.record_id))].map((id) => (
              <a key={id} href={`#cite-${id}`} className="ask-cite-ref" aria-label={`Source ${numbers.get(id).n}`}>
                {numbers.get(id).n}
              </a>
            ))}
          </li>
        ))}
      </ul>

      {result.gaps && <p className="ask-gaps"><strong>Not covered by these records:</strong> {result.gaps}</p>}

      {v && <VerificationBadge v={v} />}

      <h3 className="ask-sources-title">Sources</h3>
      <ol className="ask-sources">
        {[...numbers.values()].map(({ n, citation: c, quotes }) => (
          <li key={c.record_id} id={`cite-${c.record_id}`} value={n}>
            <div className="ask-source-title">{c.record_title}</div>
            <div className="ask-source-meta">
              {c.record_source_institution} · ID {c.record_original_id}
            </div>
            {quotes.map((q) => (
              <blockquote key={q} className="ask-quote">
                <span className="ask-quote-label">From the catalogue record:</span> “{q}”
              </blockquote>
            ))}
            <div className="ask-source-links">
              <Link to={recordHref(c.record_id)}>Access card</Link>
              <a href={c.record_original_url} target="_blank" rel="noreferrer">Original record at {c.record_source_institution} ↗</a>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function VerificationBadge({ v }) {
  const removed = v.claims_removed || [];
  const allKept = removed.length === 0;
  return (
    <details className={`ask-verify${allKept ? "" : " has-removed"}`}>
      <summary>
        ✓ {v.claims_shown} of {v.claims_proposed} statement{v.claims_proposed === 1 ? "" : "s"} verified against the cited records
        {!allKept && ` · ${removed.length} removed`}
      </summary>
      <p>{v.method}</p>
      {removed.length > 0 && (
        <ul>
          {removed.map((r, i) => (
            <li key={i}><s>{r.text || "(empty)"}</s> — {r.reason}</li>
          ))}
        </ul>
      )}
    </details>
  );
}

function Abstained({ result }) {
  return (
    <section className="ask-panel ask-abstain" aria-label="Not enough evidence">
      <div className="ask-panel-head">
        <h2>Not enough evidence in the indexed sources</h2>
        <ServedFrom result={result} />
      </div>
      <p>{result.message}</p>
      {result.gaps && <p className="ask-gaps"><strong>What’s missing:</strong> {result.gaps}</p>}
      {result.suggested_next_steps?.length > 0 && (
        <>
          <h3>What you can do next</h3>
          <ul>{result.suggested_next_steps.map((s) => <li key={s}>{s}</li>)}</ul>
        </>
      )}
    </section>
  );
}

function ServedFrom({ result }) {
  if (result.served_from === "cache") {
    return <span className="ask-served" title={`Saved ${result.cached_at || ""}`}>Saved answer (demo mode)</span>;
  }
  if (result.served_from === "rules") {
    return <span className="ask-served">No matching records, so no AI was used</span>;
  }
  return null;
}
