// Greedy delivery assignment. Deliveries are handled in order of priority, then
// deadline. Each one goes to the vehicle that (a) has capacity left and (b) can
// arrive soonest, preferring on-time arrivals over late ones.
//
// This is a heuristic, NOT a proven optimum. Assumptions (also reported to users):
//   - every vehicle starts at the depot and does not return afterwards;
//   - a vehicle serves its stops one after another;
//   - each stop takes `serviceMinutes`;
//   - a vehicle's capacity is used up by each delivery's demand.

import { buildGraph } from "../routing/graph.js";
import { shortestPath } from "../routing/dijkstra.js";
import { summarizePlan } from "./metrics.js";

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export function assignDeliveries({
  network,
  depotNodeId,
  vehicles,
  deliveries,
  serviceMinutes = 3,
  costPerMinute = 5,
}) {
  const graph = buildGraph(network.nodes, network.roads);

  const states = vehicles
    .filter((v) => v.available !== false)
    .map((v) => ({
      vehicleId: v.vehicleId,
      capacityLeft: v.capacity,
      node: depotNodeId,
      elapsed: 0,
      stops: [],
    }));

  const ordered = [...deliveries].sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.deadlineMinutes - b.deadlineMinutes ||
      a.deliveryId.localeCompare(b.deliveryId),
  );

  const unassigned = [];

  for (const delivery of ordered) {
    const candidates = states.filter((s) => s.capacityLeft >= delivery.demand);
    if (candidates.length === 0) {
      unassigned.push({ deliveryId: delivery.deliveryId, reason: "insufficient_capacity" });
      continue;
    }

    let best = null;
    for (const state of candidates) {
      const route = shortestPath(graph, state.node, delivery.nodeId);
      if (!route.found) continue;
      const arrival = state.elapsed + route.minutes;
      const late = arrival > delivery.deadlineMinutes;
      const better =
        !best || (!late && best.late) || (late === best.late && arrival < best.arrival);
      if (better) best = { state, route, arrival, late };
    }

    if (!best) {
      unassigned.push({ deliveryId: delivery.deliveryId, reason: "no_route" });
      continue;
    }

    const { state, route, arrival } = best;
    const delayMinutes = Math.max(0, arrival - delivery.deadlineMinutes);
    state.stops.push({
      deliveryId: delivery.deliveryId,
      nodeId: delivery.nodeId,
      priority: delivery.priority,
      deadlineMinutes: delivery.deadlineMinutes,
      arrivalMinutes: arrival,
      delayMinutes,
      late: delayMinutes > 0,
      routeNodes: route.nodes,
      routeRoadIds: route.roadIds,
      km: route.km,
    });
    state.capacityLeft -= delivery.demand;
    state.node = delivery.nodeId;
    state.elapsed = arrival + serviceMinutes;
  }

  const assignments = states.map((s) => ({
    vehicleId: s.vehicleId,
    stops: s.stops,
    capacityLeft: s.capacityLeft,
    finishMinutes: s.stops.length ? s.elapsed : 0,
  }));

  return { assignments, unassigned, metrics: summarizePlan(assignments, unassigned, costPerMinute) };
}