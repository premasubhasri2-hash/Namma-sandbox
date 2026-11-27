import { network } from "../../data/seedNetwork.js";
import { createScenario } from "../simulation/scenario.js";
import { buildGraph } from "./graph.js";
import { shortestPath } from "./dijkstra.js";
import { alternativeRoutes } from "./alternatives.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

// The network with any requested roads closed. The original is never changed.
function networkWithClosures(blockedRoadIds = []) {
  if (blockedRoadIds.length === 0) return network;
  try {
    return createScenario(network, { blockedRoadIds }).network;
  } catch (error) {
    throw httpError(400, error.message);
  }
}

function assertKnownNodes(...ids) {
  const known = new Set(network.nodes.map((node) => node.id));
  for (const id of ids) {
    if (!known.has(id)) throw httpError(400, `Unknown node: ${id}`);
  }
}

// Adds a GeoJSON line so the map can draw the route. Coordinates are [lng, lat].
function withGeometry(net, route) {
  const nodeById = new Map(net.nodes.map((node) => [node.id, node]));
  return {
    ...route,
    minutes: route.found ? route.minutes : null, // JSON cannot hold Infinity
    geometry: {
      type: "LineString",
      coordinates: route.nodes.map((id) => [nodeById.get(id).lng, nodeById.get(id).lat]),
    },
  };
}

export function findShortestPath({ from, to, blockedRoadIds }) {
  assertKnownNodes(from, to);
  const net = networkWithClosures(blockedRoadIds);
  const route = shortestPath(buildGraph(net.nodes, net.roads), from, to);
  return withGeometry(net, route);
}

export function findAlternativeRoutes({ from, to, blockedRoadIds, maxRoutes }) {
  assertKnownNodes(from, to);
  const net = networkWithClosures(blockedRoadIds);
  const routes = alternativeRoutes(net, from, to, { maxRoutes }).map((route) =>
    withGeometry(net, route),
  );
  return { count: routes.length, routes };
}