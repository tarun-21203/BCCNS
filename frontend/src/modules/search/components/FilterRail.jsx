import { useMemo, useState } from "react";
import { GROUPS, decadeBars, optionsFor, yearBounds } from "../lib/filters.js";
import { buildFacets } from "../lib/facets.js";
import YearRange from "./YearRange.jsx";

const INITIAL = 6;

function Group({ group, options, selected, onChange }) {
  const [all, setAll] = useState(false);
  const shown = all ? options : options.filter((o, i) => i < INITIAL || o.value === selected);
  const label = group.display || ((v) => v);
  return (
    <details className="fgroup" open={options.length <= 8 || Boolean(selected)}>
      <summary>
        <span>{group.label}</span>
        {selected && <span className="fgroup-dot" aria-label="filter active" />}
      </summary>
      <ul className="opt-list">
        {shown.map((o) => {
          const on = selected === o.value;
          return (
            <li key={o.value}>
              <button type="button" className={`opt${on ? " on" : ""}`} aria-pressed={on}
                disabled={o.count === 0 && !on}
                onClick={() => onChange(group.key, on ? "" : o.value)}>
                <span className="opt-label">{label(o.value)}</span>
                <span className="opt-count">{o.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {options.length > INITIAL && (
        <button type="button" className="fmore" onClick={() => setAll((v) => !v)}>
          {all ? "Show fewer" : `Show all ${options.length}`}
        </button>
      )}
    </details>
  );
}

// Filter panel: used as the desktop side rail and inside the mobile drawer.
// `catalogue` is every indexed record; counts say what each choice would give.
export default function FilterRail({ catalogue, filters, q, onChange, onYears, onClear, activeCount }) {
  const facets = useMemo(() => buildFacets(catalogue), [catalogue]);
  const groups = useMemo(
    () => GROUPS.map((g) => ({ group: g, options: optionsFor(catalogue, facets[g.facet], filters, q, g) })),
    [catalogue, facets, filters, q]
  );
  const bounds = useMemo(() => yearBounds(catalogue), [catalogue]);
  const bars = useMemo(() => (bounds ? decadeBars(catalogue, filters, q, bounds) : []), [catalogue, filters, q, bounds]);

  return (
    <div className="frail">
      <div className="frail-head">
        <h2>Filters</h2>
        {activeCount > 0 && (
          <button type="button" className="fclear" onClick={onClear}>Clear all</button>
        )}
      </div>
      {groups.map(({ group, options }) => (
        <Group key={group.key} group={group} options={options} selected={filters[group.key]} onChange={onChange} />
      ))}
      {bounds && (
        <details className="fgroup" open>
          <summary><span>Years</span>{(filters.from_year || filters.to_year) && <span className="fgroup-dot" aria-label="filter active" />}</summary>
          <YearRange bounds={bounds} bars={bars} from={filters.from_year} to={filters.to_year} onCommit={onYears} />
        </details>
      )}
      <p className="frail-note">Counts show what each choice would return from the indexed sources.</p>
    </div>
  );
}
