import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";
import TransitionLink from "./TransitionLink.jsx";
import "leaflet/dist/leaflet.css";
import { clusterPoints } from "../lib/geo.js";

const dotIcon = L.divIcon({
  className: "tm",
  html: '<span class="tm-ring"></span><span class="tm-dot"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -10],
});

const clusterIcon = (n) =>
  L.divIcon({
    className: "tm",
    html: `<span class="tm-cluster">${n}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

// Frame all communities, leaving the left side free for the hero text on wide screens.
function FitToCommunities({ communities }) {
  const map = useMap();
  useEffect(() => {
    if (!communities.length) return;
    const wide = window.innerWidth >= 900;
    map.fitBounds(communities.map((c) => [c.latitude, c.longitude]), {
      paddingTopLeft: [wide ? window.innerWidth * 0.52 : 30, 60],
      paddingBottomRight: [40, wide ? 90 : 40],
      maxZoom: 9,
      animate: false,
    });
  }, [map, communities]);
  return null;
}

function Markers({ communities, statsByName }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const groups = useMemo(() => clusterPoints(map, communities, 34), [map, communities, zoom]);

  return groups.map((g) => {
    if (g.members.length > 1) {
      const names = g.members.map((m) => m.name).join(", ");
      return (
        <Marker
          key={names}
          position={[g.lat, g.lng]}
          icon={clusterIcon(g.members.length)}
          title={`${g.members.length} communities: ${names}`}
          eventHandlers={{
            click: () =>
              map.fitBounds(g.members.map((m) => [m.latitude, m.longitude]), { padding: [90, 90], maxZoom: 12 }),
          }}
        >
          <Tooltip direction="top" offset={[0, -16]}>
            {g.members.length} communities: {names}. Click to zoom in.
          </Tooltip>
        </Marker>
      );
    }

    const c = g.members[0];
    const s = statsByName[c.name];
    return (
      <Marker
        key={c.name}
        position={[c.latitude, c.longitude]}
        icon={dotIcon}
        title={c.name}
        eventHandlers={{ mouseover: (e) => e.target.openPopup() }}
      >
        {zoom >= 9 && <Tooltip permanent direction="right" offset={[12, 0]} className="tm-label">{c.name}</Tooltip>}
        <Popup className="tm-popup" closeButton minWidth={250} maxWidth={290}>
          <h3>{c.name}</h3>
          {s && s.count > 0 ? (
            <>
              <p className="tm-count">
                {s.count} {s.count === 1 ? "record" : "records"} found in indexed sources
              </p>
              <p className="tm-line">Held by {s.institutions.join(", ")}</p>
              {s.digitization.length > 0 && <p className="tm-line">{s.digitization.join(" · ")}</p>}
              <p className="tm-eg">e.g. {s.records[0].title}</p>
              <TransitionLink className="tm-btn" to={`results?community=${encodeURIComponent(c.name)}`}>
                View {s.count} {s.count === 1 ? "record" : "records"} →
              </TransitionLink>
            </>
          ) : (
            <p className="tm-line">Limited indexed coverage. This does not mean no records exist elsewhere.</p>
          )}
          {c.coordinates_approximate && <p className="tm-fine">Map position is approximate.</p>}
        </Popup>
      </Marker>
    );
  });
}

export default function CommunityMap({ communities, statsByName }) {
  return (
    <MapContainer
      className="community-map"
      center={[44.7, -63.6]}
      zoom={7}
      minZoom={4}
      zoomControl={false}
      worldCopyJump
      attributionControl
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
        maxZoom={16}
      />
      <FitToCommunities communities={communities} />
      <Markers communities={communities} statsByName={statsByName} />
    </MapContainer>
  );
}
