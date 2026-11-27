// A scenario is a MODIFIED COPY of the baseline network. The baseline is never
// changed, so we can always compare "before" and "after".

export function createScenario(baseline, params = {}) {
  const { blockedRoadIds = [], penaltyMinutes = {}, durationMinutes = 60 } = params;

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error("durationMinutes must be a positive number");
  }

  const roadIds = new Set(baseline.roads.map((road) => road.id));
  for (const id of blockedRoadIds) {
    if (!roadIds.has(id)) throw new Error(`Unknown road in blockedRoadIds: ${id}`);
  }
  for (const [id, extra] of Object.entries(penaltyMinutes)) {
    if (!roadIds.has(id)) throw new Error(`Unknown road in penaltyMinutes: ${id}`);
    if (!Number.isFinite(extra) || extra < 0) {
      throw new Error(`Penalty for ${id} must be a number >= 0`);
    }
  }

  const network = structuredClone(baseline);
  const blocked = new Set(blockedRoadIds);
  for (const road of network.roads) {
    if (blocked.has(road.id)) road.status = "blocked";
    road.minutes += penaltyMinutes[road.id] ?? 0;
  }

  return {
    network,
    params: { blockedRoadIds: [...blocked], penaltyMinutes: { ...penaltyMinutes }, durationMinutes },
  };
}