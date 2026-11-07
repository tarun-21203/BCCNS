import { useMemo } from "react";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import { ENTITY_TYPE_LABELS, provenanceLabel } from "../lib/graph.js";

const W = 820;
const H = 540;

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// Static force layout: computed once per thread (no animation), so the
// picture is stable for the demo and for screenshots.
function layout(nodes, edges, focusId) {
  const simNodes = nodes.map((n) => ({
    id: n.id,
    ...(n.id === focusId ? { fx: W / 2, fy: H / 2 } : {}),
  }));
  const simLinks = edges.map((e) => ({ source: e.source, target: e.target }));
  const sim = forceSimulation(simNodes)
    .force("link", forceLink(simLinks).id((d) => d.id).distance(120).strength(0.6))
    .force("charge", forceManyBody().strength(-700))
    .force("collide", forceCollide(55))
    .force("x", forceX(W / 2).strength(0.05))
    .force("y", forceY(H / 2).strength(0.08))
    .stop();
  for (let i = 0; i < 400; i++) sim.tick();
  const pos = new Map(simNodes.map((n) => [n.id, { x: n.x, y: n.y }]));

  // Fit the view to the drawing (labels need extra room sideways), but
  // never zoom in so far that a three-node thread looks enormous.
  const xs = simNodes.map((n) => n.x);
  const ys = simNodes.map((n) => n.y);
  const PX = 90;
  const PY = 45;
  let minX = Math.min(...xs) - PX;
  let maxX = Math.max(...xs) + PX;
  let minY = Math.min(...ys) - PY;
  let maxY = Math.max(...ys) + PY;
  const MIN_W = 520;
  const MIN_H = 340;
  if (maxX - minX < MIN_W) {
    const c = (minX + maxX) / 2;
    minX = c - MIN_W / 2;
    maxX = c + MIN_W / 2;
  }
  if (maxY - minY < MIN_H) {
    const c = (minY + maxY) / 2;
    minY = c - MIN_H / 2;
    maxY = c + MIN_H / 2;
  }
  return { pos, viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}` };
}

function NodeShape({ node, isFocus }) {
  const r = isFocus ? 16 : 11;
  switch (node.type) {
    case "record":
      return <rect x={-10} y={-10} width={20} height={20} rx={3} className="tv-shape" />;
    case "person":
      return (
        <polygon
          points={`0,${-r} ${r},0 0,${r} ${-r},0`}
          className="tv-shape"
        />
      );
    case "subject":
      return <circle r={isFocus ? 13 : 8} className="tv-shape" />;
    default:
      return <circle r={r} className="tv-shape" />;
  }
}

export default function ThreadGraph({ thread, selected, onSelectNode, onSelectEdge }) {
  const { focus, nodes, edges } = thread;
  const { pos, viewBox } = useMemo(
    () => layout(nodes, edges, focus.id),
    [nodes, edges, focus.id]
  );

  const activate = (fn) => (ev) => {
    if (ev.type === "click" || ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      fn();
    }
  };

  return (
    <svg
      className="tv-graph"
      viewBox={viewBox}
      role="group"
      aria-label={`Connections around ${focus.label}`}
    >
      <g>
        {edges.map((e) => {
          const a = pos.get(e.source);
          const b = pos.get(e.target);
          const isSel = selected?.kind === "edge" && selected.id === e.id;
          const derived = e.provenance.origin === "derived";
          const label = `${e.evidence.title} — ${ENTITY_TYPE_LABELS[
            nodeType(e.target)
          ].toLowerCase()}. ${provenanceLabel(e.provenance)}`;
          return (
            <g
              key={e.id}
              className={`tv-edge ${derived ? "is-derived" : "is-source"} ${isSel ? "is-selected" : ""}`}
              onClick={activate(() => onSelectEdge(e))}
              onKeyDown={activate(() => onSelectEdge(e))}
              tabIndex={0}
              role="button"
              aria-label={`Connection: ${label}`}
            >
              <title>{label}</title>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="tv-edge-hit" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="tv-edge-line" />
            </g>
          );
        })}
      </g>
      <g>
        {nodes.map((n) => {
          const p = pos.get(n.id);
          const isFocus = n.id === focus.id;
          const isSel = selected?.kind === "node" && selected.id === n.id;
          const text = n.type === "record" ? truncate(n.label, 26) : truncate(n.label, 22);
          return (
            <g
              key={n.id}
              transform={`translate(${p.x},${p.y})`}
              className={`tv-node tv-${n.type} ${isFocus ? "is-focus" : ""} ${isSel ? "is-selected" : ""} ${n.generic ? "is-generic" : ""}`}
              onClick={activate(() => onSelectNode(n))}
              onKeyDown={activate(() => onSelectNode(n))}
              tabIndex={0}
              role="button"
              aria-label={`${ENTITY_TYPE_LABELS[n.type]}: ${n.label}`}
            >
              <title>{`${ENTITY_TYPE_LABELS[n.type]}: ${n.label}`}</title>
              <NodeShape node={n} isFocus={isFocus} />
              <text y={isFocus ? 30 : 24} textAnchor="middle" className="tv-label">
                {text}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function nodeType(id) {
  return id.slice(0, id.indexOf(":"));
}
