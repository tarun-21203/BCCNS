import { useEffect, useMemo, useRef, useState } from "react";
import TransitionLink from "./TransitionLink.jsx";
import AccessCard from "./AccessCard.jsx";
import { getMappings } from "../api/searchApi.js";
import { filterLocally } from "../lib/localSearch.js";

const STEPS = [
  {
    num: "I",
    title: "Search by name, place or topic",
    text: "A person, a community, a place, a subject or a year. You do not need to know which institution holds the material first.",
  },
  {
    num: "II",
    title: "Read the Access Cards",
    text: "Each card says who holds the record, whether it is digitized, and how to reach it, as the source describes it.",
  },
  {
    num: "III",
    title: "Follow the thread to the source",
    text: "Open the record's page and its provenance, then continue to the institution that holds the original.",
  },
];

const ANNOTATIONS = [
  { key: "inst", label: "Who holds it", note: "The institution is the authority for the record." },
  { key: "dig", label: "Digitization", note: "Digitized, partly, not, or unknown, as the source states it." },
  { key: "access", label: "How to access", note: "The source's own wording, labelled record-specific or general policy." },
  { key: "link", label: "The original record", note: "Opens the record at the institution that holds it." },
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Types each word in turn. Under reduced motion it just cycles whole words.
function useTypewriter(words, enabled) {
  const reduced = useMemo(prefersReducedMotion, []);
  const [s, setS] = useState({ w: 0, n: 0 });
  const word = words.length ? words[s.w % words.length] : "";

  useEffect(() => {
    if (!enabled || !words.length) return undefined;
    if (reduced) {
      const t = setTimeout(() => setS((p) => ({ w: p.w + 1, n: 0 })), 2600);
      return () => clearTimeout(t);
    }
    const typing = s.n < word.length;
    const t = setTimeout(
      () => setS((p) => (typing ? { ...p, n: p.n + 1 } : { w: p.w + 1, n: 0 })),
      typing ? 80 : 1900
    );
    return () => clearTimeout(t);
  }, [s, word, enabled, words, reduced]);

  return { word, text: reduced ? word : word.slice(0, s.n), complete: reduced || s.n >= word.length };
}

function SearchDemo({ records, words, active }) {
  const { word, text, complete } = useTypewriter(words, active);
  const found = useMemo(() => (word ? filterLocally(records, { search: word }) : []), [records, word]);
  const institutions = [...new Set(found.map((r) => r.source_institution))];

  return (
    <div className="how-demo how-demo-search">
      <div className="how-search" aria-hidden="true">
        <span className="how-search-icon">⌕</span>
        <span className="how-typed">
          {text}
          <i className="caret" />
        </span>
      </div>
      <p className="how-result" aria-live="off">
        {complete ? (
          <>
            <strong>{found.length}</strong> {found.length === 1 ? "record" : "records"} found in indexed sources
            {institutions.length > 0 && <> · held by {institutions.join(", ")}</>}
          </>
        ) : (
          " "
        )}
      </p>
      <div className="chips">
        <span className="chips-label">Try</span>
        {words.map((w) => (
          <TransitionLink key={w} className="chip" to={`results?q=${encodeURIComponent(w)}`}>{w}</TransitionLink>
        ))}
      </div>
    </div>
  );
}

function CardDemo({ record, mapping }) {
  const [hl, setHl] = useState("");
  return (
    <div className="how-demo how-demo-card">
      <ul className="results how-card" data-hl={hl}>
        <AccessCard record={record} mapping={mapping} index={0} />
      </ul>
      <ul className="how-notes" aria-label="What each part of the card tells you">
        {ANNOTATIONS.map((a) => (
          <li key={a.key}>
            <button
              type="button"
              onMouseEnter={() => setHl(a.key)}
              onMouseLeave={() => setHl("")}
              onFocus={() => setHl(a.key)}
              onBlur={() => setHl("")}
            >
              <strong>{a.label}</strong>
              <span>{a.note}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChainDemo({ record }) {
  const harvested = record.harvested_at
    ? new Date(record.harvested_at).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" })
    : null;
  const nodes = [
    { label: "Record in THREADS", main: record.title, sub: "We store the description and the link only" },
    { label: "Held by", main: record.source_institution, sub: `Original ID: ${record.original_id}` },
    { label: "Original record", main: "Open at the source ↗", href: record.original_url, sub: harvested ? `Metadata collected ${harvested}` : null },
  ];
  return (
    <div className="how-demo how-chain" key={record.id}>
      {nodes.map((n, i) => (
        <div className="chain-node" style={{ "--i": i }} key={n.label}>
          <span className="ac-label">{n.label}</span>
          {n.href ? (
            <a className="btn btn-primary" href={n.href} target="_blank" rel="noopener noreferrer">{n.main}</a>
          ) : (
            <strong>{n.main}</strong>
          )}
          {n.sub && <small>{n.sub}</small>}
        </div>
      ))}
    </div>
  );
}

export default function HowItWorks({ records, chips }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [active, setActive] = useState(0);
  const [mappings, setMappings] = useState({});

  useEffect(() => {
    getMappings().then((list) => setMappings(Object.fromEntries(list.map((m) => [m.source_id, m]))));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A record whose access wording comes from the record itself makes the best example.
  const featured = useMemo(
    () => records.find((r) => r.access_info_level === "record" && r.digitization_status === "digitized") || records[0],
    [records]
  );
  if (!featured) return null;

  function onKeyDown(e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : STEPS.length - 1)) % STEPS.length;
    setActive(next);
    document.getElementById(`how-tab-${next}`)?.focus();
  }

  return (
    <section id="how" ref={ref} className={`how${inView ? " in-view" : ""}`} aria-labelledby="how-h">
      <div className="how-inner">
        <p className="eyebrow" data-reveal>
          <span className="eyebrow-rule" /> How a thread is traced
        </p>
        <h2 id="how-h" data-reveal>Three steps, and you are at the door.</h2>

        <div className="how-steps" role="tablist" aria-label="How THREADS works" onKeyDown={onKeyDown}>
          {STEPS.map((s, i) => (
            <button
              key={s.num}
              id={`how-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={active === i}
              aria-controls="how-panel"
              tabIndex={active === i ? 0 : -1}
              className={`how-step${active === i ? " active" : ""}`}
              style={{ "--i": i }}
              data-reveal
              onClick={() => setActive(i)}
            >
              <span className="how-rail">
                <span className="how-num">{s.num}</span>
                <span className="how-line" />
              </span>
              <span className="how-title">{s.title}</span>
              <span className="how-text">{s.text}</span>
            </button>
          ))}
        </div>

        <div id="how-panel" role="tabpanel" aria-labelledby={`how-tab-${active}`} className="how-panel" data-reveal>
          <p className="ac-label how-panel-label">Live preview · real indexed records</p>
          {active === 0 && <SearchDemo records={records} words={chips} active={inView} />}
          {active === 1 && <CardDemo record={featured} mapping={mappings[featured.source_id]} />}
          {active === 2 && <ChainDemo record={featured} />}
        </div>
      </div>
    </section>
  );
}
