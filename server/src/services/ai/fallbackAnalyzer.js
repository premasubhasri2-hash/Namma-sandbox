// Rule-based event analysis. Used when the AI is unavailable, times out, or
// returns something invalid, so the app (and the demo) keeps working.
// It is deliberately simple and says so: low confidence, "not analysed" image.

const LEVELS = ["low", "medium", "high", "critical"];

const BASE_SEVERITY = {
  waterlogging: "medium",
  road_closure: "high",
  construction: "low",
  public_gathering: "medium",
  accident: "high",
  other: "low",
};

const SEVERE_WORDS = /\b(completely|fully|totally|impassable|closed|blocked|submerged|stuck)\b/i;
const MILD_WORDS = /\b(slow|minor|partial|partially|one lane|light)\b/i;

export function fallbackAnalysis({ description, category = "other" }) {
  let level = LEVELS.indexOf(BASE_SEVERITY[category] ?? "low");
  if (SEVERE_WORDS.test(description)) level += 1;
  if (MILD_WORDS.test(description)) level -= 1;
  level = Math.max(0, Math.min(LEVELS.length - 1, level));

  return {
    category,
    severity: LEVELS[level],
    summary: description.trim().slice(0, 200),
    confidence: 0.3,
    needsVerification: [
      "Confirm the incident with an official or second source",
      "Confirm which road segments are actually affected",
      "Confirm the expected duration",
    ],
    imageObservations: "Not analysed (rule-based fallback)",
  };
}