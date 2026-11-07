// Greedy pixel-distance clustering so nearby communities (e.g. Preston and
// Cherry Brook, ~3 km apart) don't sit on top of each other at low zoom.
// Clusters split automatically as the user zooms in.
export function clusterPoints(map, points, radiusPx) {
  const placed = points.map((p) => ({ p, px: map.latLngToContainerPoint([p.latitude, p.longitude]) }));
  const used = new Set();
  const groups = [];
  placed.forEach((a, i) => {
    if (used.has(i)) return;
    const members = [a.p];
    used.add(i);
    placed.forEach((b, j) => {
      if (!used.has(j) && a.px.distanceTo(b.px) < radiusPx) {
        members.push(b.p);
        used.add(j);
      }
    });
    const lat = members.reduce((n, m) => n + m.latitude, 0) / members.length;
    const lng = members.reduce((n, m) => n + m.longitude, 0) / members.length;
    groups.push({ members, lat, lng });
  });
  return groups;
}
