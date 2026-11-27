// Finds which roads in the network are closest to a map point (e.g. a reported
// event). Done in code, not by the AI, so the result is deterministic.
//
// Method: convert lat/lng to a small local flat plane in metres (accurate enough
// over a few kilometres), then measure the distance from the point to each
// road segment (a straight line between its two junctions).

const METRES_PER_DEG_LAT = 110574;
const METRES_PER_DEG_LNG_AT_EQUATOR = 111320;

function toLocalMetres(node, origin) {
  const cosLat = Math.cos((origin.lat * Math.PI) / 180);
  return {
    x: (node.lng - origin.lng) * cosLat * METRES_PER_DEG_LNG_AT_EQUATOR,
    y: (node.lat - origin.lat) * METRES_PER_DEG_LAT,
  };
}

// Distance from the origin (0,0) to the segment a-b.
function distanceFromOriginToSegment(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lengthSquared));
  return Math.hypot(a.x + t * dx, a.y + t * dy);
}

export function nearestRoads(network, point, limit = 3) {
  const nodeById = new Map(network.nodes.map((node) => [node.id, node]));

  return network.roads
    .map((road) => {
      const a = toLocalMetres(nodeById.get(road.from), point);
      const b = toLocalMetres(nodeById.get(road.to), point);
      return {
        roadId: road.id,
        name: road.name,
        distanceMeters: Math.round(distanceFromOriginToSegment(a, b) * 10) / 10,
      };
    })
    .sort((x, y) => x.distanceMeters - y.distanceMeters || x.roadId.localeCompare(y.roadId))
    .slice(0, limit);
}