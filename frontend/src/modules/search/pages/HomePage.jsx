import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCommunities, getRecords } from "../api/searchApi.js";
import { communityStats } from "../lib/communityStats.js";
import CommunityMap from "../components/CommunityMap.jsx";
import HowItWorks from "../components/HowItWorks.jsx";
import TransitionLink from "../components/TransitionLink.jsx";
import { runTransition } from "../lib/transition.js";

// Suggested searches. Each is checked against the sample records: a chip must
// return results, so edit this list if the dataset changes.
const TRY_CHIPS = ["Birchtown", "Africville", "Book of Negroes", "Viola Desmond"];

export default function HomePage() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([getCommunities(), getRecords()]).then(([c, r]) =>
      setData({ communities: c.communities, records: r.records, offline: c.offline || r.offline })
    );
  }, []);

  const statsByName = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.communities.map((c) => [c.name, communityStats(c, data.records)]));
  }, [data]);

  const institutions = data ? new Set(data.records.map((r) => r.source_institution)).size : 0;

  function onSubmit(e) {
    e.preventDefault();
    const q = text.trim();
    runTransition(() => navigate(q ? `results?q=${encodeURIComponent(q)}` : "results"));
  }

  return (
    <>
    <section className="hero">
      <div className="hero-map" role="region" aria-label="Map of indexed Nova Scotia communities">
        {data && <CommunityMap communities={data.communities} statsByName={statsByName} />}
        <div className="hero-scrim" aria-hidden="true" />
      </div>

      <div className="hero-content">
        <p className="eyebrow">
          <span className="eyebrow-rule" /> A national index · Prototype
        </p>
        <h1>
          Every thread has a record.
          <span className="h1-accent"> Every record has a place.</span>
        </h1>
        <p className="hero-intro">
          Search Black history resources held by archives, libraries and universities, from one box.
          See which institution keeps the material, whether it is digitized, and how to reach it.
        </p>

        <form className="hero-search" role="search" onSubmit={onSubmit}>
          <label htmlFor="home-q" className="visually-hidden">Search records</label>
          <input
            id="home-q"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A person, a place, a community, a subject, a year…"
          />
          <button type="submit">Search <span aria-hidden="true">→</span></button>
        </form>

        <div className="chips">
          <span className="chips-label">Try</span>
          {TRY_CHIPS.map((c) => (
            <TransitionLink key={c} className="chip" to={`results?q=${encodeURIComponent(c)}`}>{c}</TransitionLink>
          ))}
        </div>
        <button
          type="button"
          className="scroll-cue"
          onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
        >
          How a thread is traced <span aria-hidden="true">↓</span>
        </button>
      </div>

      <p className="hero-caption">
        {data && (
          <>
            Sample holdings · {data.records.length} records · {institutions} institutions ·{" "}
            {data.communities.length} Nova Scotia communities. This is a demo sample, not a measure of what
            exists.{data.offline && " Offline sample data."}
          </>
        )}
      </p>
    </section>
    {data && <HowItWorks records={data.records} chips={TRY_CHIPS} />}
    </>
  );
}
