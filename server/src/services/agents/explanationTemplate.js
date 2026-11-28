// A deterministic explanation built purely from the facts. It is used when the
// AI is unavailable or when the critic rejects the AI's text. It only repeats
// numbers that exist in the facts, so it always passes the critic.

const HEADLINES = {
  reroute: "Reroute around the closure",
  wait: "Wait for the road to reopen",
  no_action_needed: "No action needed",
};

function describePlan(label, m) {
  return (
    `${label}: ${m.deliveriesServed} deliveries served, ${m.lateCount} late, ` +
    `total delay ${m.totalDelayMinutes} min, ${m.totalKm} km, ` +
    `${m.totalVehicleMinutes} vehicle-minutes, estimated cost ${m.estimatedCost}.`
  );
}

// "adds 6.1 km" or "saves 6.1 km" (the number itself is always positive).
const change = (value, unit) =>
  value >= 0 ? `adds ${value} ${unit}` : `saves ${Math.abs(value)} ${unit}`;

export function buildTemplateExplanation(facts) {
  const { scenario, baseline, reroute, wait } = facts;

  const parts = [];
  if (scenario.blockedRoadIds.length > 0) {
    parts.push(
      `Road ${scenario.blockedRoadIds.join(", ")} closed for ${scenario.durationMinutes} minutes (${scenario.durationHours} hours).`,
    );
  }
  const penalties = Object.entries(scenario.penaltyMinutes);
  if (penalties.length > 0) {
    parts.push(
      `Travel time increased on ${penalties.map(([id, min]) => `${id} (+${min} min)`).join(", ")}.`,
    );
  }

  const whatWasAffected =
    facts.affectedDeliveryCount === 0
      ? "No planned deliveries use the disrupted roads."
      : `${facts.affectedDeliveryCount} planned deliveries use a disrupted road: ${facts.affectedDeliveryIds.join(", ")}.`;

  const alternatives = [
    describePlan("Normal plan (no disruption)", baseline),
    describePlan("Reroute", reroute),
    describePlan("Wait", wait),
  ];
  if (reroute.unassignedCount > 0) {
    alternatives.push(`When rerouting, ${reroute.unassignedCount} deliveries cannot be served.`);
  }

  let whyThisPlan;
  let tradeOffs;
  if (facts.recommendedStrategy === "no_action_needed") {
    whyThisPlan = "None of the planned routes use a disrupted road, so the current plan stays as it is.";
    tradeOffs = ["No change is needed, so there is no extra distance, time or cost."];
  } else if (facts.recommendedStrategy === "reroute") {
    whyThisPlan = `Rerouting gives a total delay of ${reroute.totalDelayMinutes} min, compared with ${wait.totalDelayMinutes} min when waiting.`;
    tradeOffs = [
      `Compared with the normal plan, rerouting ${change(facts.rerouteVsBaseline.extraKm, "km")} and ${change(facts.rerouteVsBaseline.extraVehicleMinutes, "vehicle-minutes")}, and the estimated cost ${facts.rerouteVsBaseline.extraCost >= 0 ? "rises" : "falls"} by ${Math.abs(facts.rerouteVsBaseline.extraCost)}.`,
    ];
  } else {
    whyThisPlan = `Waiting gives a total delay of ${wait.totalDelayMinutes} min, compared with ${reroute.totalDelayMinutes} min when rerouting.`;
    tradeOffs = [
      `Waiting keeps the normal routes but holds an affected vehicle for ${scenario.durationMinutes} minutes at its first affected stop.`,
    ];
  }

  return {
    headline: HEADLINES[facts.recommendedStrategy],
    whatHappened: parts.length > 0 ? parts.join(" ") : "No roads were closed in this scenario.",
    whatWasAffected,
    alternatives,
    whyThisPlan,
    tradeOffs,
    assumptions: facts.assumptions,
  };
}
