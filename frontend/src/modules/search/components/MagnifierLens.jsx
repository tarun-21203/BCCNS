import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { TILE_URL } from "../lib/mapConfig.js";

const RADIUS = 104;
const BORDER = 3; // keep in step with .lens border-width in search.css
const MIN_LENS_ZOOM = 10; // close enough to pull neighbouring communities apart
const MAX_LENS_ZOOM = 13;
const MIN_GAP = 44; // px between two pins before their labels would collide
const SNAP = 52; // px: how near a community the cursor must be before the lens is drawn towards it

function pinElement(community, stats) {
  const el = document.createElement("div");
  const dot = document.createElement("span");
  const empty = !stats || stats.count === 0;
  dot.className = empty ? "lp-dot zero" : "lp-dot";
  const label = document.createElement("span");
  label.className = "lp-label";
  label.textContent = community.name;
  const small = document.createElement("small");
  small.textContent = empty ? "none indexed" : `${stats.count} ${stats.count === 1 ? "record" : "records"}`;
  label.appendChild(small);
  el.append(dot, label);
  return el;
}

// At this magnification a few pixels of cursor movement is a large jump inside the lens, so
// near a community (or a tight group of them) the lens eases towards the group's centre. The pull
// is zero at SNAP px away and full on top of it, so it never jumps. The lens itself still sits
// under the cursor.
function magnet(map, communities, point, cursor) {
  let nearest = null;
  let best = Infinity;
  const pts = communities.map((c) => map.latLngToContainerPoint([c.latitude, c.longitude]));
  pts.forEach((pt, i) => {
    const d = pt.distanceTo(point);
    if (d < best) {
      best = d;
      nearest = i;
    }
  });
  if (nearest === null || best >= SNAP) return cursor;
  const group = communities.filter((_, i) => pts[i].distanceTo(pts[nearest]) < 24);
  const lat = group.reduce((n, c) => n + c.latitude, 0) / group.length;
  const lng = group.reduce((n, c) => n + c.longitude, 0) / group.length;
  const w = 1 - best / SNAP;
  const pull = w * w * (3 - 2 * w);
  return L.latLng(cursor.lat + (lat - cursor.lat) * pull, cursor.lng + (lng - cursor.lng) * pull);
}

// Start at the base zoom and go closer (up to MAX_LENS_ZOOM) until no two communities inside the
// lens are too close together to read.
function pickZoom(map, communities, center, base) {
  for (let z = base; z < MAX_LENS_ZOOM; z += 1) {
    const middle = map.project(center, z);
    const inside = communities
      .map((c) => map.project([c.latitude, c.longitude], z))
      .filter((pt) => pt.distanceTo(middle) < RADIUS * 0.95);
    let gap = Infinity;
    for (let i = 0; i < inside.length; i += 1) {
      for (let j = i + 1; j < inside.length; j += 1) gap = Math.min(gap, inside[i].distanceTo(inside[j]));
    }
    if (gap >= MIN_GAP) return z;
  }
  return MAX_LENS_ZOOM;
}

// Keep every label readable and inside the circle. A lone community's label goes to whichever
// side has room; when communities are close together, the lower one's label goes below its dot
// and the upper one's above, so they never overlap.
function placeLabels(map, items, zoom, center) {
  const mid = map.project(center, zoom);
  const pts = items.map((it) => map.project(it.latlng, zoom));
  items.forEach((it, i) => {
    const label = it.el.querySelector(".lp-label");
    if (!label) return;
    const near = pts.filter(
      (q, j) => j !== i && Math.abs(q.x - pts[i].x) < 150 && Math.abs(q.y - pts[i].y) < 34 && q.distanceTo(mid) < RADIUS + 60
    );
    let position = pts[i].x - mid.x > 20 ? "left" : "right";
    if (near.length) {
      const lowest = near.every((q) => pts[i].y > q.y || (pts[i].y === q.y && pts[i].x > q.x));
      position = lowest ? "below" : "above";
    }
    label.dataset.pos = position;
  });
}

// A round magnifier that follows the cursor over the dashboard map. It is a second,
// non-interactive map centred on the cursor and drawn a few zoom levels closer, so the
// real location under the pointer is at the lens centre and clicks pass straight through
// to the real markers. It is decoration: everything it shows is also reachable by hover,
// focus and click on the markers underneath.
export default function MagnifierLens({ communities, statsByName }) {
  const map = useMap();
  const parts = useRef({});
  const communitiesRef = useRef(communities);
  communitiesRef.current = communities;

  useEffect(() => {
    const pane = map.createPane("lens");
    pane.style.zIndex = 625; // above markers, below tooltips and the hover cards
    pane.style.pointerEvents = "none";

    const box = L.DomUtil.create("div", "lens", pane);
    box.setAttribute("aria-hidden", "true");
    box.style.width = box.style.height = `${RADIUS * 2}px`;
    box.style.position = "absolute";
    box.style.left = box.style.top = "0";

    const lens = L.map(box, {
      zoomControl: false, attributionControl: false, dragging: false, touchZoom: false,
      doubleClickZoom: false, scrollWheelZoom: false, boxZoom: false, keyboard: false,
      zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false, inertia: false,
    });
    lens.setView(map.getCenter(), MIN_LENS_ZOOM, { animate: false });
    L.tileLayer(TILE_URL, { maxZoom: 16, keepBuffer: 1 }).addTo(lens);
    const pins = L.layerGroup().addTo(lens);
    L.DomUtil.create("div", "lens-glass", box);
    parts.current = { lens, pins };

    const container = map.getContainer();
    let frame = 0;
    let last = null;
    let busy = false;
    const show = (on) => box.classList.toggle("on", on);

    function paint() {
      frame = 0;
      if (!last || busy) return;
      const e = last;
      if (e.target.closest?.(".leaflet-popup, .leaflet-control, .lens-toggle")) return show(false);
      const point = map.mouseEventToContainerPoint(e);
      // keep the lens off the hero text on wide screens
      if (window.innerWidth >= 900 && point.x < container.clientWidth * 0.42) return show(false);
      // the border sits outside the 208px map, so centre on map + border
      L.DomUtil.setPosition(box, map.containerPointToLayerPoint(point).subtract([RADIUS + BORDER, RADIUS + BORDER]));
      const center = magnet(map, communitiesRef.current, point, map.containerPointToLatLng(point));
      const zoom = pickZoom(map, communitiesRef.current, center, Math.max(map.getZoom() + 2, MIN_LENS_ZOOM));
      lens.setView(center, zoom, { animate: false });
      placeLabels(map, parts.current.items || [], zoom, center);
      box.dataset.zoom = String(zoom);
      box.dataset.mainZoom = String(map.getZoom());
      show(true);
    }
    const onMove = (e) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => { last = null; show(false); };
    const begin = () => { busy = true; show(false); };
    const end = () => { busy = false; };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    map.on("dragstart zoomstart", begin);
    map.on("dragend zoomend", end);

    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
      map.off("dragstart zoomstart", begin);
      map.off("dragend zoomend", end);
      cancelAnimationFrame(frame);
      lens.remove();
      pane.remove();
      parts.current = {};
    };
  }, [map]);

  // Pins show every community, with the same counts as the rest of the page.
  useEffect(() => {
    const { pins } = parts.current;
    if (!pins) return;
    pins.clearLayers();
    parts.current.items = communities.map((c) => {
      const el = pinElement(c, statsByName[c.name]);
      L.marker([c.latitude, c.longitude], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: "lens-pin", html: el, iconSize: [0, 0] }),
      }).addTo(pins);
      return { el, latlng: [c.latitude, c.longitude] };
    });
  }, [communities, statsByName]);

  return null;
}
