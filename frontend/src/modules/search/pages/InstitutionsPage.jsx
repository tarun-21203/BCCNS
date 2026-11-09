import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCommunities, getMappingsWithStatus, getRecords } from "../api/searchApi.js";
import InstitutionCard from "../components/InstitutionCard.jsx";
import CardSkeleton from "../components/CardSkeleton.jsx";
import { buildSources, plural } from "../lib/institutions.js";

export default function InstitutionsPage() {
  const { hash } = useLocation();
  const headingRef = useRef(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let stale = false;
    Promise.all([getMappingsWithStatus(), getRecords(), getCommunities()]).then(([m, r, c]) => {
      if (stale) return;
      setData({
        mappings: m.mappings,
        records: r.records,
        communities: c.communities,
        offline: m.offline || r.offline || c.offline,
      });
    });
    return () => {
      stale = true;
    };
  }, []);

  const sources = useMemo(() => (data ? buildSources(data.mappings, data.records) : []), [data]);
  const communitySources = useMemo(
    () => (data ? [...new Set(data.communities.map((c) => c.source).filter(Boolean))] : []),
    [data]
  );

  useEffect(() => {
    const before = document.title;
    document.title = "Indexed institutions – THREADS";
    return () => {
      document.title = before;
    };
  }, []);

  // Land on the right card for links like /search/institutions#lac, otherwise on the heading.
  useEffect(() => {
    if (!data) return;
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) {
      target.scrollIntoView({ block: "start" });
      target.querySelector("h2")?.setAttribute("tabindex", "-1");
      target.querySelector("h2")?.focus({ preventScroll: true });
    } else {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [data, hash]);

  const total = data?.records.length ?? 0;

  return (
    <section className="page inst-page" aria-labelledby="inst-h1">
      <header className="inst-intro">
        <p className="eyebrow"><span className="eyebrow-rule" /> Sources</p>
        <h1 id="inst-h1" ref={headingRef} tabIndex={-1}>Indexed institutions</h1>
        <p className="inst-lede">
          THREADS indexes descriptions of records and links back to the institution that holds each one. It does
          not hold or copy the collections. These are the sources in this prototype.
        </p>
        {data && (
          <p className="banner inst-sample" role="note">
            <strong>A small sample.</strong> {plural(total, "record", "records")} from {plural(sources.length, "institution", "institutions")}, collected by hand from public
            catalogue pages. It is not a list of every institution or collection, and a source with few records
            here does not mean it holds little.
          </p>
        )}
        {data?.offline && (
          <p className="notice" role="status">
            Offline sample data: the API could not be reached, so this page uses copies of the sample records and
            source files.
          </p>
        )}
      </header>

      {!data ? (
        <ul className="results"><CardSkeleton /><CardSkeleton /></ul>
      ) : (
        <>
          <ul className="results">
            {sources.map((s) => <InstitutionCard key={s.id} source={s} />)}
          </ul>

          <section className="inst-more" aria-labelledby="more-h">
            <h2 id="more-h">Not indexed yet</h2>
            <p className="prov-p">
              Other museums, archives, libraries, universities and community collections are not part of this
              prototype. A new source is added with one mapping file that says which of its fields mean what, and
              no new code.
            </p>
          </section>

          {communitySources.length > 0 && (
            <section className="inst-more" aria-labelledby="ref-h">
              <h2 id="ref-h">Reference data</h2>
              <p className="prov-p">
                Community names on the maps come from reference data, not from archival records. Map positions are
                approximate.
              </p>
              <ul className="prov-p ref-list">
                {communitySources.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  );
}
