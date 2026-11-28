import { test } from "node:test";
import assert from "node:assert/strict";

import { runSimulation } from "../src/services/simulation/runSimulation.js";
import { buildSimulationFacts } from "../src/services/agents/simulationFacts.js";
import { explainSimulation } from "../src/services/agents/recommendationAgent.js";
import { network, depotNodeId, vehicles, deliveries } from "../src/data/seedNetwork.js";

const facts = buildSimulationFacts(
  runSimulation({
    network, depotNodeId, vehicles, deliveries,
    scenarioParams: { blockedRoadIds: ["R2"], durationMinutes: 120 },
  }),
);

const good = {
  headline: "Reroute around R2",
  whatHappened: "R2 is closed for 2 hours.",
  whatWasAffected: "1 delivery (D1) uses R2.",
  alternatives: ["Waiting is slower for the affected delivery."],
  whyThisPlan: "Rerouting adds 6.1 km and 22 vehicle-minutes but avoids a long wait.",
  tradeOffs: ["Estimated cost rises by 110."],
};
const bad = { ...good, whyThisPlan: "Rerouting saves 38% of the time." };

const deps = (generate) => ({ generate, configured: () => true, modelName: () => "fake-model" });

test("a clean AI explanation is accepted on the first attempt", async () => {
  const r = await explainSimulation(facts, deps(async () => good));
  assert.equal(r.source, "gemini");
  assert.equal(r.critic.attempts, 1);
  assert.deepEqual(r.explanation.assumptions, facts.assumptions);
  assert.equal(r.recommendedStrategy, "reroute");
});

test("an invented number is rejected, and the retry can succeed", async () => {
  let calls = 0;
  const prompts = [];
  const r = await explainSimulation(facts, deps(async (req) => {
    prompts.push(req.userText);
    return ++calls === 1 ? bad : good;
  }));
  assert.equal(r.source, "gemini");
  assert.equal(r.critic.attempts, 2);
  assert.match(prompts[1], /38/); // the retry names the rejected number
});

test("if the AI keeps inventing numbers, the template is used", async () => {
  const r = await explainSimulation(facts, deps(async () => bad));
  assert.equal(r.source, "template");
  assert.deepEqual(r.critic.rejectedNumbers, [38]);
  assert.match(r.explanation.headline, /Reroute/);
});

test("a Gemini failure falls back to the template", async () => {
  const r = await explainSimulation(facts, deps(async () => { throw new Error("Gemini request timed out"); }));
  assert.equal(r.source, "template");
  assert.match(r.fallbackReason, /timed out/);
});

test("output of the wrong shape falls back to the template", async () => {
  const r = await explainSimulation(facts, deps(async () => ({ headline: "only this" })));
  assert.equal(r.source, "template");
});

test("no API key means the template, without calling the AI", async () => {
  let called = false;
  const r = await explainSimulation(facts, { generate: async () => { called = true; }, configured: () => false });
  assert.equal(r.source, "template");
  assert.equal(called, false);
});
