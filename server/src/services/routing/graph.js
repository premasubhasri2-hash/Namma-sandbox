// Turns a network ({ nodes, roads }) into an adjacency list:
//   Map<nodeId, [{ to, roadId, minutes, km }, ...]>
// Blocked roads are simply left out, so the routing code never sees them.
// Roads are two-way unless a road has `oneWay: true`.

export function buildGraph(nodes, roads) {
  const adjacency = new Map();
  for (const node of nodes) adjacency.set(node.id, []);

  for (const road of roads) {
    if (!adjacency.has(road.from) || !adjacency.has(road.to)) {
      throw new Error(`Road ${road.id} refers to an unknown node (${road.from} -> ${road.to})`);
    }
    if (road.status === "blocked") continue;

    adjacency.get(road.from).push({ to: road.to, roadId: road.id, minutes: road.minutes, km: road.km });
    if (!road.oneWay) {
      adjacency.get(road.to).push({ to: road.from, roadId: road.id, minutes: road.minutes, km: road.km });
    }
  }
  return { adjacency };
}