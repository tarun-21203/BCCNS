import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { COVERAGE_LABELS } from "../lib/coverage.js";

// Status colours mirror the --sm-* tokens in map.css (Leaflet paths need
// literal colours, not CSS variables).
const STATUS_COLOR = {
  found: "#2f6f6a",
  limited: "#b8752b",
  known: "#6b6aa8",
  unknown: "#8e897f",
};

// Marker area grows with record count. Zero still gets a visible (hollow)
// marker: limited coverage is information, not an empty spot.
const radiusFor = (count) => 7 + 4 * Math.sqrt(count);

function FitToRows({ rows }) {
  const map = useMap();
  useEffect(() => {
    if (rows.length === 0) return;
    const bounds = rows.map((r) => [r.latitude, r.longitude]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, rows]);
  return null;
}

function FlyToSelected({ row }) {
  const map = useMap();
  useEffect(() => {
    if (row) map.flyTo([row.latitude, row.longitude], Math.max(map.getZoom(), 9), { duration: 0.6 });
  }, [map, row]);
  return null;
}

export default function CoverageMap({ rows, selected, onSelect }) {
  // Memoised so FitToRows only re-fits when the data changes, not on select.
  const placed = useMemo(() => rows.filter((r) => r.latitude != null && r.longitude != null), [rows]);
  const unplaced = rows.filter((r) => r.latitude == null || r.longitude == null);
  const selectedRow = placed.find((r) => r.name === selected) || null;

  return (
    <div className="sm-mapwrap">
      <MapContainer
        className="sm-map"
        center={[44.65, -63.6]}
        zoom={7}
        scrollWheelZoom={false}
        aria-label="Map of selected African Nova Scotian communities and indexed record counts"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToRows rows={placed} />
        <FlyToSelected row={selectedRow} />
        {placed.map((r) => {
          const color = STATUS_COLOR[r.status];
          const isSel = r.name === selected;
          return (
            <CircleMarker
              key={r.name}
              center={[r.latitude, r.longitude]}
              radius={radiusFor(r.count)}
              pathOptions={{
                color: isSel ? "#111" : color,
                weight: isSel ? 3 : 2,
                fillColor: color,
                fillOpacity: r.count === 0 ? 0 : 0.55,
                dashArray: r.count === 0 ? "4 3" : null,
              }}
              eventHandlers={{ click: () => onSelect(r.name) }}
              bubblingMouseEvents={false}
            >
              <Tooltip direction="top" offset={[0, -radiusFor(r.count)]}>
                <strong>{r.name}</strong>
                <br />
                {r.count} indexed record{r.count === 1 ? "" : "s"} · {COVERAGE_LABELS[r.status].label}
                {r.coordinatesApproximate && (
                  <>
                    <br />
                    <em>Approximate location</em>
                  </>
                )}
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* On-map disclaimer: visible without clicking (project rule 3.4). */}
      <div className="sm-mapnote" role="note">
        Counts show our sample index only, not how much history exists.
      </div>

      {unplaced.length > 0 && (
        <p className="sm-muted">
          Not shown on the map (no verified location yet): {unplaced.map((r) => r.name).join(", ")}.
        </p>
      )}
    </div>
  );
}
