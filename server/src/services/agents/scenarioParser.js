// Pure-code helpers for Agent C (scenario planner).
//   validateScenario : checks ANY proposed scenario (from the AI or the fallback)
//                      against the real road list. Nothing unknown gets through.
//   parseScenarioFallback : a simple rule-based reader used when the AI is
//                      unavailable. It only recognises road ids/names and
//                      simple durations; it is deliberately limited.

export const DEFAULT_DURATION_MINUTES = 60;
export const DEFAULT_SLOWDOWN_MINUTES = 15;
const MAX_DURATION = 24 * 60;
const MAX_PENALTY = 240;

export function validateScenario(raw, network) {
  const warnings = [];
  const known = new Set(network.roads.map((r) => r.id));

  const blocked = [];
  for (const id of raw.blockedRoadIds ?? []) {
    if (!known.has(id)) warnings.push(`Unknown road "${id}" was ignored.`);
    else if (!blocked.includes(id)) blocked.push(id);
  }

  const penaltyMinutes = {};
  for (const { roadId, extraMinutes } of raw.slowedRoads ?? []) {
    if (!known.has(roadId)) warnings.push(`Unknown road "${roadId}" was ignored.`);
    else if (blocked.includes(roadId)) warnings.push(`${roadId} is closed, so its slowdown was ignored.`);
    else if (!(extraMinutes > 0 && extraMinutes <= MAX_PENALTY))
      warnings.push(`The slowdown for ${roadId} must be between 1 and ${MAX_PENALTY} minutes, so it was ignored.`);
    else penaltyMinutes[roadId] = extraMinutes;
  }

  let durationMinutes = raw.durationMinutes;
  if (durationMinutes == null) {
    durationMinutes = DEFAULT_DURATION_MINUTES;
    warnings.push(`No duration was stated, so ${DEFAULT_DURATION_MINUTES} minutes was assumed.`);
  } else if (!(durationMinutes > 0 && durationMinutes <= MAX_DURATION)) {
    warnings.push(`A duration of ${durationMinutes} minutes is not allowed (1 to ${MAX_DURATION}), so ${DEFAULT_DURATION_MINUTES} minutes was assumed.`);
    durationMinutes = DEFAULT_DURATION_MINUTES;
  }

  const understood = blocked.length > 0 || Object.keys(penaltyMinutes).length > 0;
  return {
    understood,
    scenario: understood ? { blockedRoadIds: blocked, penaltyMinutes, durationMinutes } : null,
    warnings,
  };
}

function readDurationMinutes(text) {
  let total = 0;
  let found = false;
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/g)) {
    total += Number(m[1]) * 60;
    found = true;
  }
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|m)\b/g)) {
    total += Number(m[1]);
    found = true;
  }
  return found ? Math.round(total) : null;
}

export function parseScenarioFallback(text, network) {
  const lower = text.toLowerCase();
  const mentioned = network.roads
    .filter((r) => new RegExp(`\\b${r.id.toLowerCase()}\\b`).test(lower) || lower.includes(r.name.toLowerCase()))
    .map((r) => r.id);

  const durationMinutes = readDurationMinutes(lower);
  const slowOnly =
    /\b(slow\w*|congest\w*|delay\w*|crawl\w*)\b/.test(lower) && !/\b(block\w*|clos\w*|shut|impassable)\b/.test(lower);

  const raw = slowOnly
    ? { blockedRoadIds: [], slowedRoads: mentioned.map((roadId) => ({ roadId, extraMinutes: DEFAULT_SLOWDOWN_MINUTES })), durationMinutes }
    : { blockedRoadIds: mentioned, slowedRoads: [], durationMinutes };

  const result = validateScenario(raw, network);
  if (slowOnly && result.understood) {
    result.warnings.push(`No delay was stated, so ${DEFAULT_SLOWDOWN_MINUTES} extra minutes was assumed.`);
  }
  return result;
}
