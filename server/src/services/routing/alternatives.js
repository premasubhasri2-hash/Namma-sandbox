// Alternative routes by single-road exclusion:
//   1. find the fastest route,
//   2. for each road on it, pretend that road is closed and find the fastest route again,
//   3. keep the distinct results, fastest first.
// This is simple and explainable, but it is NOT a full k-shortest-paths
// algorithm (Yen's), so it can miss some good alternatives. Documented limit.

import { buildGraph } from "./graph.js";
import { shortestPath } from "./dijkstra.js";

export function alternativeRoutes(network, from, to, { maxRoutes = 3 } = {}) {
  const best = shortestPath(buildGraph(network.nodes, network.roads), from, to);
  if (!best.found) return [];

  const routes = new Map([[best.roadIds.join(","), best]]);

  for (const roadId of best.roadIds) {
    const roads = network.roads.map((road) =>
      road.id === roadId ? { ...road, status: "blocked" } : road,
    );
    const route = shortestPath(buildGraph(network.nodes, roads), from, to);
    if (route.found) routes.set(route.roadIds.join(","), route);
  }

  return [...routes.values()]
    .sort((a, b) => a.minutes - b.minutes || a.km - b.km)
    .slice(0, maxRoutes);
}