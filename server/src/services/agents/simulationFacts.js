// Turns a simulation result (from runSimulation) into a flat "facts" object.
// Every number the explanation may use is calculated HERE, in code, including
// the differences between plans, so the AI never has to do arithmetic.

const round2 = (x) => Math.round(x * 100) / 100;

function difference(plan, baseline) {
  return {
    extraKm: round2(plan.totalKm - baseline.totalKm),
    extraVehicleMinutes: plan.totalVehicleMinutes - baseline.totalVehicleMinutes,
    extraCost: round2(plan.estimatedCost - baseline.estimatedCost),
    extraDelayMinutes: plan.totalDelayMinutes - baseline.totalDelayMinutes,
  };
}

export function buildSimulationFacts(result) {
  const baseline = result.baseline.metrics;
  const reroute = result.reroute.metrics;
  const wait = result.wait.metrics;

  return {
    scenario: {
      blockedRoadIds: result.scenario.blockedRoadIds,
      penaltyMinutes: result.scenario.penaltyMinutes,
      durationMinutes: result.scenario.durationMinutes,
      durationHours: round2(result.scenario.durationMinutes / 60),
    },
    affectedDeliveryIds: result.affectedDeliveryIds,
    affectedDeliveryCount: result.affectedDeliveryIds.length,
    baseline,
    reroute,
    wait,
    rerouteVsBaseline: difference(reroute, baseline),
    waitVsBaseline: difference(wait, baseline),
    rerouteUnassigned: result.reroute.unassigned,
    recommendedStrategy: result.recommendedStrategy,
    assumptions: result.assumptions,
  };
}
