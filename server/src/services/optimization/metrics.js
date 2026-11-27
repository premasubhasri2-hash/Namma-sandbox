// Turns a plan (per-vehicle stops + unassigned deliveries) into summary numbers.
// Every number here is computed, never estimated by an LLM.

const round2 = (x) => Math.round(x * 100) / 100;

export function summarizePlan(assignments, unassigned, costPerMinute) {
  const stops = assignments.flatMap((a) => a.stops);
  const totalVehicleMinutes = assignments.reduce((sum, a) => sum + a.finishMinutes, 0);

  return {
    deliveriesServed: stops.length,
    unassignedCount: unassigned.length,
    lateCount: stops.filter((s) => s.late).length,
    totalDelayMinutes: stops.reduce((sum, s) => sum + s.delayMinutes, 0),
    totalVehicleMinutes,
    totalKm: round2(stops.reduce((sum, s) => sum + s.km, 0)),
    estimatedCost: round2(totalVehicleMinutes * costPerMinute),
  };
}