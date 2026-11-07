import { useEffect, useState } from "react";

// Dual-handle year range over a decade histogram. The draft updates while you
// drag; the URL (and so the search) updates when you let go.
export default function YearRange({ bounds, bars, from, to, onCommit }) {
  const { min, max } = bounds;
  const [draft, setDraft] = useState({ from: from || min, to: to || max });

  useEffect(() => setDraft({ from: from || min, to: to || max }), [from, to, min, max]);

  const clamp = (v) => Math.min(max, Math.max(min, Number(v) || min));

  function commit(next = draft) {
    let f = clamp(next.from);
    let t = clamp(next.to);
    if (f > t) [f, t] = [t, f];
    const full = f <= min && t >= max;
    onCommit(full ? "" : String(f), full ? "" : String(t));
  }

  const f = Number(draft.from);
  const t = Number(draft.to);
  const pct = (v) => ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 100;
  const peak = Math.max(1, ...bars.map((b) => b.count));
  const active = (b) => b.end >= f && b.start <= t;

  return (
    <div className="yr">
      <div className="yr-bars" aria-hidden="true">
        {bars.map((b) => (
          <span key={b.start} className={`yr-bar${active(b) ? " on" : ""}`} title={`${b.start}s: ${b.count}`}
            style={{ height: `${8 + (b.count / peak) * 40}px` }} />
        ))}
      </div>
      <div className="yr-sliders">
        <span className="yr-track" />
        <span className="yr-fill" style={{ left: `${pct(f)}%`, width: `${Math.max(0, pct(t) - pct(f))}%` }} />
        <input type="range" min={min} max={max} step={1} value={Math.min(f, t)} aria-label="Earliest year"
          style={{ zIndex: Math.min(f, t) > (min + max) / 2 ? 3 : 1 }}
          onChange={(e) => setDraft((d) => ({ ...d, from: Math.min(Number(e.target.value), Number(d.to)) }))}
          onPointerUp={() => commit()} onKeyUp={() => commit()} />
        <input type="range" min={min} max={max} step={1} value={Math.max(f, t)} aria-label="Latest year"
          style={{ zIndex: 2 }}
          onChange={(e) => setDraft((d) => ({ ...d, to: Math.max(Number(e.target.value), Number(d.from)) }))}
          onPointerUp={() => commit()} onKeyUp={() => commit()} />
      </div>
      <div className="yr-inputs">
        <label>
          <span className="ac-label">From</span>
          <input type="number" min={min} max={max} value={draft.from}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            onBlur={() => commit()} onKeyDown={(e) => e.key === "Enter" && commit()} />
        </label>
        <label>
          <span className="ac-label">To</span>
          <input type="number" min={min} max={max} value={draft.to}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            onBlur={() => commit()} onKeyDown={(e) => e.key === "Enter" && commit()} />
        </label>
      </div>
      {(from || to) && (
        <p className="yr-note">Records with no stated year are left out while a date range is set.</p>
      )}
    </div>
  );
}
