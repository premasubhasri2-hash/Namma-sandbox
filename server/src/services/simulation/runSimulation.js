// Runs one what-if scenario and compares three plans:
//   baseline : normal network, no disruption
//   reroute  : disrupted network, plan recomputed around the closure
//   wait     : keep the baseline routes; a vehicle whose route needs a closed
//              road waits `durationMinutes` at the first such stop, and
//              everything after that stop slips by the same amount
// The engine, not an LLM, picks the recommended strategy (lowest total delay,
// with unassigned deliveries heavily penalised; a tie goes to "reroute").
// Penalty-only scenarios (slower but open roads) are handled by "reroute" only.

import { assignDeliveries } from "../optimization/assign.js";
import { summarizePlan } from "../optimization/metrics.js";
import { createScenario } from "./scenario.js";

const UNASSIGNED_PENALTY = 1000;

function applyWait(assignments, blocked, durationMinutes) {
  return assignments.map((a) => {
    let extra = 0;
    const stops = a.stops.map((stop) => {
      if (extra === 0 && stop.routeRoadIds.some((id) => blocked.has(id))) extra = durationMinutes;
      const arrivalMinutes = stop.arrivalMinutes + extra;
      const delayMinutes = Math.max(0, arrivalMinutes - stop.deadlineMinutes);
      return { ...stop, arrivalMinutes, delayMinutes, late: delayMinutes > 0 };
    });
    return { ...a, stops, finishMinutes: a.stops.length ? a.finishMinutes + extra : 0 };
  });
}

export function runSimulation({
  network,
  depotNodeId,
  vehicles,
  deliveries,
  scenarioParams,
  serviceMinutes = 3,
  costPerMinute = 5,
}) {
  const common = { depotNodeId, vehicles, deliveries, serviceMinutes, costPerMinute };

  const baseline = assignDeliveries({ network, ...common });
  const scenario = createScenario(network, scenarioParams);
  const reroute = assignDeliveries({ network: scenario.network, ...common });

  const blocked = new Set(scenario.params.blockedRoadIds);
  const disrupted = new Set([...blocked, ...Object.keys(scenario.params.penaltyMinutes)]);

  const affectedDeliveryIds = baseline.assignments
    .flatMap((a) => a.stops)
    .filter((stop) => stop.routeRoadIds.some((id) => disrupted.has(id)))
    .map((stop) => stop.deliveryId)
    .sort();

  const waitAssignments = applyWait(baseline.assignments, blocked, scenario.params.durationMinutes);
  const wait = {
    assignments: waitAssignments,
    unassigned: baseline.unassigned,
    metrics: summarizePlan(waitAssignments, baseline.unassigned, costPerMinute),
  };

  const score = (plan) => plan.metrics.totalDelayMinutes + plan.metrics.unassignedCount * UNASSIGNED_PENALTY;

  let recommendedStrategy;
  if (affectedDeliveryIds.length === 0) recommendedStrategy = "no_action_needed";
  else recommendedStrategy = score(wait) < score(reroute) ? "wait" : "reroute";

  return {
    scenario: scenario.params,
    baseline,
    reroute,
    wait,
    affectedDeliveryIds,
    recommendedStrategy,
    assumptions: [
      "Synthetic demo network and deliveries, not real traffic data",
      "Every vehicle starts at the depot and does not return afterwards",
      `Each stop takes ${serviceMinutes} minutes; cost is ${costPerMinute} per vehicle-minute (placeholder rate)`,
      "Assignment is a greedy heuristic, not a proven optimum",
      "Wait strategy delays a vehicle once, at its first stop that needs a closed road",
    ],
  };
}