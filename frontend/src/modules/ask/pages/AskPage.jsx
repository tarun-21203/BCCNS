import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { askQuestion } from "../api/askApi.js";
import AnswerPanel from "../components/AnswerPanel.jsx";
import QueryUnderstanding from "../components/QueryUnderstanding.jsx";
import RecordList from "../components/RecordList.jsx";

const EXAMPLES = [
  "What records document the Africville relocation?",
  "Which records list Black Loyalists who settled at Birchtown?",
  "Are there recordings of African Nova Scotian songs?",
  "What was Viola Desmond's favourite song?",
];

export default function AskPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [question, setQuestion] = useState(initial);
  const [state, setState] = useState({ loading: false, result: null });
  const requestId = useRef(0);

  async function run(q) {
    const text = q.trim();
    if (text.length < 2) return;
    setParams({ q: text }, { replace: true });
    const id = ++requestId.current;
    setState({ loading: true, result: null });
    const result = await askQuestion(text);
    if (id === requestId.current) setState({ loading: false, result });
  }

  // Support links like /ask?q=... from other modules.
  useEffect(() => {
    if (initial) run(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = state.result;
  const citedIds = new Set(
    (result?.answer?.claims || []).flatMap((c) => c.citations.map((x) => x.record_id))
  );

  return (
    <section className="ask">
      <header className="ask-intro">
        <h1>Ask the archive</h1>
        <p>
          Ask a question in your own words. Answers use <strong>only</strong> the catalogue records indexed by
          THREADS, cite every statement, and say so when the records don’t contain enough evidence.
        </p>
      </header>

      <form className="ask-form" onSubmit={(e) => { e.preventDefault(); run(question); }}>
        <label htmlFor="ask-q" className="visually-hidden">Your question</label>
        <input
          id="ask-q"
          type="search"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What records document the Africville relocation?"
          maxLength={500}
          autoComplete="off"
        />
        <button type="submit" disabled={state.loading || question.trim().length < 2}>
          {state.loading ? "Searching…" : "Ask"}
        </button>
      </form>

      {!result && !state.loading && (
        <div className="ask-examples">
          <span className="ask-label">Try</span>
          {EXAMPLES.map((q) => (
            <button key={q} type="button" onClick={() => { setQuestion(q); run(q); }}>{q}</button>
          ))}
        </div>
      )}

      {state.loading && (
        <p className="ask-loading" role="status">Searching the indexed records and checking every citation…</p>
      )}

      {result && (
        <>
          {result.offline && <p className="notice" role="status">Offline: the THREADS API could not be reached.</p>}
          <QueryUnderstanding understood={result.understood} bridge={result.language_bridge} />
          <AnswerPanel result={result} />
          <RecordList hits={result.records} citedIds={citedIds} />
          <p className="ask-disclaimer">{result.disclaimer}</p>
        </>
      )}
    </section>
  );
}
