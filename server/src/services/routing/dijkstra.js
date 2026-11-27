// Dijkstra's shortest-path algorithm on travel time (minutes).
// Works because every road time is >= 0. Returns the fastest route, or
// { found: false } when the destination cannot be reached (e.g. blocked roads
// cut the network in two).

import { MinHeap } from "./MinHeap.js";

export function shortestPath(graph, from, to) {
  const { adjacency } = graph;
  if (!adjacency.has(from)) throw new Error(`Unknown start node: ${from}`);
  if (!adjacency.has(to)) throw new Error(`Unknown destination node: ${to}`);

  const best = new Map([[from, 0]]); // fastest known time to each node
  const cameFrom = new Map(); // node -> { node, roadId, km } we arrived from
  const heap = new MinHeap();
  heap.push({ node: from, time: 0 }, 0);

  while (heap.size > 0) {
    const { node, time } = heap.pop();
    if (time > best.get(node)) continue; // stale heap entry, a faster way was found
    if (node === to) break;

    for (const edge of adjacency.get(node)) {
      const candidate = time + edge.minutes;
      if (candidate < (best.get(edge.to) ?? Infinity)) {
        best.set(edge.to, candidate);
        cameFrom.set(edge.to, { node, roadId: edge.roadId, km: edge.km });
        heap.push({ node: edge.to, time: candidate }, candidate);
      }
    }
  }

  if (!best.has(to)) {
    return { found: false, nodes: [], roadIds: [], minutes: Infinity, km: 0 };
  }

  // Walk backwards from the destination to rebuild the path.
  const nodes = [to];
  const roadIds = [];
  let km = 0;
  let cursor = to;
  while (cursor !== from) {
    const step = cameFrom.get(cursor);
    roadIds.unshift(step.roadId);
    km += step.km;
    cursor = step.node;
    nodes.unshift(cursor);
  }

  return { found: true, nodes, roadIds, minutes: best.get(to), km: Math.round(km * 100) / 100 };
}