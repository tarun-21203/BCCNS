import { GROUPS } from "../lib/filters.js";

// Removable chips for every active filter, plus a clear-all.
export default function ActiveFilters({ filters, onRemove, onClear }) {
  const chips = GROUPS.filter((g) => filters[g.key]).map((g) => ({
    keys: [g.key],
    text: `${g.label}: ${(g.display || ((v) => v))(filters[g.key])}`,
  }));
  if (filters.from_year || filters.to_year) {
    chips.push({ keys: ["from_year", "to_year"], text: `Years: ${filters.from_year || "…"}–${filters.to_year || "…"}` });
  }
  if (!chips.length) return null;
  return (
    <ul className="chips-active" aria-label="Active filters">
      {chips.map((c) => (
        <li key={c.keys[0]} className="chip-active">
          {c.text}
          <button type="button" onClick={() => onRemove(c.keys)} aria-label={`Remove filter ${c.text}`}>×</button>
        </li>
      ))}
      {chips.length > 1 && (
        <li><button type="button" className="fclear" onClick={onClear}>Clear all</button></li>
      )}
    </ul>
  );
}
