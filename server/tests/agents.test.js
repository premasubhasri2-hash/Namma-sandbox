import { test } from "node:test";
import assert from "node:assert/strict";

import { runSimulation } from "../src/services/simulation/runSimulation.js";
import { buildSimulationFacts } from "../src/services/agents/simulationFacts.js";
import { buildTemplateExplanation } from "../src/services/agents/explanationTemplate.js";
import { reviewExplanation, extractNumbers } from "../src/services/agents/criticAgent.js";
import { network, depotNodeId, vehicles, deliveries } from "../src/data/seedNetwork.js";

const simulate = (scenarioParams) =>
  runSimulation({ network, depotNodeId, vehicles, deliveries, scenarioParams });

const factsFor = (scenarioParams) => buildSimulationFacts(simulate(scenarioParams));

test("facts contain engine-calculated differences (R2 closed for 120 minutes)", () => {
  const facts = factsFor({ blockedRoadIds: ["R2"], durationMinutes: 120 });
  assert.equal(facts.scenario.durationHours, 2);
  assert.equal(facts.affectedDeliveryCount, 1);
  assert.equal(facts.rerouteVsBaseline.extraKm, 6.1);
  assert.equal(facts.rerouteVsBaseline.extraVehicleMinutes, 22);
  assert.equal(facts.rerouteVsBaseline.extraCost, 110);
  assert.equal(facts.waitVsBaseline.extraKm, 0);
  assert.equal(facts.recommendedStrategy, "reroute");
});

test("extractNumbers ignores ids like D1 and R2 and handles thousands separators", () => {
  assert.deepEqual(extractNumbers("Road R2 and delivery D1 add 6.1 km"), [6.1]);
  assert.deepEqual(extractNumbers("Cost rises to 1,200 units"), [1200]);
});

test("the critic accepts an explanation that only uses numbers from the facts", () => {
  const facts = factsFor({ blockedRoadIds: ["R2"], durationMinutes: 120 });
  const text = {
    whyThisPlan: "Rerouting adds 6.1 km and 22 vehicle-minutes for a 2 hour closure of R2.",
  };
  assert.deepEqual(reviewExplanation(text, facts), { ok: true, unsupportedNumbers: [] });
});

test("the critic catches a number the AI invented", () => {
  const facts = factsFor({ blockedRoadIds: ["R2"], durationMinutes: 120 });
  const result = reviewExplanation({ whyThisPlan: "Rerouting saves 38% of time and 4 vehicles." }, facts);
  assert.equal(result.ok, false);
  assert.deepEqual(result.unsupportedNumbers.sort((a, b) => a - b), [4, 38]);
});

test("the critic looks inside lists and nested fields", () => {
  const facts = factsFor({ blockedRoadIds: ["R2"], durationMinutes: 120 });
  const result = reviewExplanation({ alternatives: ["fine", "this takes 999 minutes"] }, facts);
  assert.deepEqual(result.unsupportedNumbers, [999]);
});

for (const [name, params, strategy] of [
  ["short closure (wait)", { blockedRoadIds: ["R2"], durationMinutes: 5 }, "wait"],
  ["long closure (reroute)", { blockedRoadIds: ["R2"], durationMinutes: 120 }, "reroute"],
  ["unused road (no action)", { blockedRoadIds: ["R4"], durationMinutes: 60 }, "no_action_needed"],
  ["depot cut off", { blockedRoadIds: ["R1", "R3"], durationMinutes: 60 }, "wait"],
  ["penalty only", { penaltyMinutes: { R2: 30 }, durationMinutes: 60 }, null],
]) {
  test(`the template explanation always passes the critic: ${name}`, () => {
    const facts = factsFor(params);
    if (strategy) assert.equal(facts.recommendedStrategy, strategy);
    const explanation = buildTemplateExplanation(facts);
    assert.deepEqual(reviewExplanation(explanation, facts), { ok: true, unsupportedNumbers: [] });
    assert.ok(explanation.headline.length > 0);
    assert.ok(explanation.alternatives.length >= 3);
  });
}

test("the template mentions the unreachable deliveries when the depot is cut off", () => {
  const facts = factsFor({ blockedRoadIds: ["R1", "R3"], durationMinutes: 60 });
  const explanation = buildTemplateExplanation(facts);
  assert.ok(explanation.alternatives.some((line) => /cannot be served/.test(line)));
});

test("the template says nothing was affected when no route uses the closed road", () => {
  const explanation = buildTemplateExplanation(factsFor({ blockedRoadIds: ["R4"], durationMinutes: 60 }));
  assert.match(explanation.whatWasAffected, /No planned deliveries/);
});
