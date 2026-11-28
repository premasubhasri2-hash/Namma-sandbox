import { test } from "node:test";
import assert from "node:assert/strict";
import { orchestrate } from "../src/services/agents/orchestrator.js";

const goodPlan = {
  understood: true, source: "gemini", confidence: 0.9, warnings: [],
  scenario: { blockedRoadIds: ["R2"], penaltyMinutes: {}, durationMinutes: 120 },
};
const fakeSim = {
  _id: "abc123", title: "Planned", scenarioParameters: {}, recommendedStrategy: "reroute",
  affectedDeliveryIds: ["D1"], baselineMetrics: {}, rerouteMetrics: {}, waitMetrics: {},
};

const makeSteps = (overrides = {}) => ({
  plan: async () => goodPlan,
  simulate: async () => fakeSim,
  impact: async () => ({ riskLevel: "critical" }),
  explain: async () => ({ recommendation: { source: "gemini" } }),
  ...overrides,
});

test("all four steps run in order and are logged", async () => {
  const r = await orchestrate("Northern Cross blocked for 2 hours", makeSteps());
  assert.equal(r.completed, true);
  assert.deepEqual(r.steps.map((s) => s.name), ["scenario-planner", "simulation", "impact-analysis", "recommendation"]);
  assert.ok(r.steps.every((s) => s.status === "ok"));
  assert.equal(r.impact.riskLevel, "critical");
  assert.equal(r.needsReview, false);
});

test("the planner's scenario is what the simulation receives", async () => {
  let received;
  await orchestrate("x road blocked", makeSteps({ simulate: async (input) => { received = input; return fakeSim; } }));
  assert.deepEqual(received.blockedRoadIds, ["R2"]);
  assert.equal(received.durationMinutes, 120);
});

test("an unrecognised request stops early and runs no simulation", async () => {
  let simulated = false;
  const r = await orchestrate("close the moon", makeSteps({
    plan: async () => ({ understood: false, scenario: null, warnings: [], confidence: 0, source: "fallback" }),
    simulate: async () => { simulated = true; return fakeSim; },
  }));
  assert.equal(r.completed, false);
  assert.equal(simulated, false);
  assert.match(r.stoppedBecause, /No known road/);
});

test("low confidence or warnings mark the result as needing review", async () => {
  const r = await orchestrate("blocked", makeSteps({ plan: async () => ({ ...goodPlan, confidence: 0.4 }) }));
  assert.equal(r.needsReview, true);
  const r2 = await orchestrate("blocked", makeSteps({ plan: async () => ({ ...goodPlan, warnings: ["assumed 60 min"] }) }));
  assert.equal(r2.needsReview, true);
});

test("a failing step keeps the earlier steps and reports the error", async () => {
  const r = await orchestrate("blocked", makeSteps({ impact: async () => { throw new Error("boom"); } }));
  assert.equal(r.completed, false);
  assert.equal(r.stoppedBecause, "boom");
  assert.ok(r.simulation);
  assert.equal(r.steps.at(-1).status, "failed");
  assert.equal(r.recommendation, undefined);
});
