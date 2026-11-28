// Agent B: Impact Analysis. Plain code, no AI.
//
// It answers: "Which roads, deliveries and vehicles does this disruption touch,
// and how bad is it?" Everything is read from the simulation result, so every
// number comes from the engine. The risk level follows the written rules below.

export const RISK_RULES = [
  "none: no planned delivery uses a disrupted road",
  "critical: a delivery cannot be served, or a high-priority delivery is still late under the recommended plan",
  "high: any affected delivery is late under the recommended plan, or a high-priority delivery is affected",
  "medium: some deliveries are affected, but all can still be served on time",
];

function stopsByDelivery(plan) {
  const map = new Map();
  for (const assignment of plan.assignments) {
    for (const stop of assignment.stops) map.set(stop.deliveryId, { ...stop, vehicleId: assignment.vehicleId });
  }
  return map;
}

function outcome(stop) {
  if (!stop) return null;
  return { arrivalMinutes: stop.arrivalMinutes, delayMinutes: stop.delayMinutes, late: stop.late };
}

export function buildImpactReport(result, { network, deliveries }) {
  const roadById = new Map(network.roads.map((r) => [r.id, r]));
  const nodeById = new Map(network.nodes.map((n) => [n.id, n]));
  const deliveryById = new Map(deliveries.map((d) => [d.deliveryId, d]));
  const nodeName = (id) => nodeById.get(id)?.name ?? id;

  const { blockedRoadIds, penaltyMinutes, durationMinutes } = result.scenario;

  const disruptedRoads = [
    ...blockedRoadIds.map((id) => ({ id, kind: "closed", extraMinutes: null })),
    ...Object.entries(penaltyMinutes).map(([id, extra]) => ({ id, kind: "slower", extraMinutes: extra })),
  ].map((d) => {
    const road = roadById.get(d.id);
    return {
      ...d,
      name: road.name,
      from: nodeName(road.from),
      to: nodeName(road.to),
      km: road.km,
      normalMinutes: road.minutes,
    };
  });

  const baselineStops = stopsByDelivery(result.baseline);
  const rerouteStops = stopsByDelivery(result.reroute);
  const waitStops = stopsByDelivery(result.wait);
  const rerouteUnassigned = new Map(result.reroute.unassigned.map((u) => [u.deliveryId, u.reason]));

  const affectedDeliveries = result.affectedDeliveryIds.map((id) => {
    const delivery = deliveryById.get(id);
    const base = baselineStops.get(id);
    return {
      deliveryId: id,
      destination: nodeName(delivery.nodeId),
      priority: delivery.priority,
      demand: delivery.demand,
      deadlineMinutes: delivery.deadlineMinutes,
      vehicleId: base?.vehicleId ?? null,
      baseline: outcome(base),
      reroute: rerouteUnassigned.has(id)
        ? { servedByReroute: false, reason: rerouteUnassigned.get(id) }
        : { servedByReroute: true, ...outcome(rerouteStops.get(id)) },
      wait: outcome(waitStops.get(id)),
    };
  });

  const affectedVehicleIds = [...new Set(affectedDeliveries.map((d) => d.vehicleId).filter(Boolean))].sort();
  const affectedVehicles = affectedVehicleIds.map((vehicleId) => {
    const pick = (plan) => plan.assignments.find((a) => a.vehicleId === vehicleId);
    return {
      vehicleId,
      affectedDeliveryIds: affectedDeliveries.filter((d) => d.vehicleId === vehicleId).map((d) => d.deliveryId),
      finishMinutes: {
        baseline: pick(result.baseline).finishMinutes,
        reroute: pick(result.reroute)?.finishMinutes ?? null,
        wait: pick(result.wait).finishMinutes,
      },
    };
  });

  const recommended = result.recommendedStrategy;
  const chosen = (d) => (recommended === "wait" ? d.wait : d.reroute);
  const unserved = affectedDeliveries.filter((d) => recommended !== "wait" && d.reroute.servedByReroute === false);
  const lateAfterPlan = affectedDeliveries.filter((d) => {
    const c = chosen(d);
    return c && c.late === true;
  });

  let riskLevel;
  if (affectedDeliveries.length === 0) riskLevel = "none";
  else if (unserved.length > 0 || lateAfterPlan.some((d) => d.priority === "high")) riskLevel = "critical";
  else if (lateAfterPlan.length > 0 || affectedDeliveries.some((d) => d.priority === "high")) riskLevel = "high";
  else riskLevel = "medium";

  return {
    scenario: { blockedRoadIds, penaltyMinutes, durationMinutes },
    disruptedRoads,
    affectedDeliveries,
    affectedVehicles,
    totals: {
      affectedDeliveryCount: affectedDeliveries.length,
      affectedVehicleCount: affectedVehicles.length,
      demandAtRisk: affectedDeliveries.reduce((sum, d) => sum + d.demand, 0),
      unservedUnderReroute: affectedDeliveries.filter((d) => d.reroute.servedByReroute === false).length,
      lateUnderRecommendedPlan: lateAfterPlan.length,
    },
    recommendedStrategy: recommended,
    riskLevel,
    riskRules: RISK_RULES,
    source: "engine",
  };
}
