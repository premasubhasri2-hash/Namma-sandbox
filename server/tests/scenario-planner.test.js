import { test } from "node:test";
import assert from "node:assert/strict";

import { network } from "../src/data/seedNetwork.js";
import { validateScenario, parseScenarioFallback } from "../src/services/agents/scenarioParser.js";
import { planScenario } from "../src/services/agents/scenarioPlannerAgent.js";

const deps = (generate) => ({ generate, configured: () => true, modelName: () => "fake-model" });

test("validateScenario keeps known roads and drops unknown ones with a warning", () => {
  const r = validateScenario({ blockedRoadIds: ["R2", "R99"], slowedRoads: [], durationMinutes: 120 }, network);
  assert.deepEqual(r.scenario, { blockedRoadIds: ["R2"], penaltyMinutes: {}, durationMinutes: 120 });
  assert.ok(r.warnings.some((w) => w.includes("R99")));
});

test("validateScenario assumes 60 minutes when no duration is given, and says so", () => {
  const r = validateScenario({ blockedRoadIds: ["R2"], slowedRoads: [] }, network);
  assert.equal(r.scenario.durationMinutes, 60);
  assert.ok(r.warnings.some((w) => /assumed/.test(w)));
});

test("validateScenario rejects impossible durations and slowdowns", () => {
  const r = validateScenario(
    { blockedRoadIds: ["R2"], slowedRoads: [{ roadId: "R5", extraMinutes: 9999 }], durationMinutes: 99999 },
    network,
  );
  assert.equal(r.scenario.durationMinutes, 60);
  assert.deepEqual(r.scenario.penaltyMinutes, {});
  assert.equal(r.warnings.length, 2);
});

test("a road cannot be both closed and slowed", () => {
  const r = validateScenario(
    { blockedRoadIds: ["R2"], slowedRoads: [{ roadId: "R2", extraMinutes: 10 }], durationMinutes: 30 },
    network,
  );
  assert.deepEqual(r.scenario.penaltyMinutes, {});
});

test("nothing recognised means understood is false and there is no scenario", () => {
  const r = validateScenario({ blockedRoadIds: ["R99"], slowedRoads: [], durationMinutes: 30 }, network);
  assert.equal(r.understood, false);
  assert.equal(r.scenario, null);
});

test("fallback reads a road name and an hours duration", () => {
  const r = parseScenarioFallback("What if Northern Cross is blocked for 2 hours?", network);
  assert.deepEqual(r.scenario, { blockedRoadIds: ["R2"], penaltyMinutes: {}, durationMinutes: 120 });
});

test("fallback reads a road id and combined hours and minutes", () => {
  const r = parseScenarioFallback("r5 closed for 1 hour 30 minutes", network);
  assert.deepEqual(r.scenario.blockedRoadIds, ["R5"]);
  assert.equal(r.scenario.durationMinutes, 90);
});

test("fallback treats 'slow' as a slowdown with an assumed delay", () => {
  const r = parseScenarioFallback("Traffic is slow on Central Connector for 45 minutes", network);
  assert.deepEqual(r.scenario, { blockedRoadIds: [], penaltyMinutes: { R5: 15 }, durationMinutes: 45 });
  assert.ok(r.warnings.some((w) => /assumed/.test(w)));
});

test("fallback does not match R1 inside R12", () => {
  const r = parseScenarioFallback("R12 is blocked", network);
  assert.deepEqual(r.scenario.blockedRoadIds, ["R12"]);
});

test("AI proposal is validated: an invented road is dropped", async () => {
  const r = await planScenario(
    "block the fake road for 2 hours",
    deps(async () => ({
      blockedRoadIds: ["R2", "R77"], slowedRoads: [], durationMinutes: 120,
      interpretation: "Close R2 for two hours.", confidence: 0.9,
    })),
  );
  assert.equal(r.source, "gemini");
  assert.deepEqual(r.scenario.blockedRoadIds, ["R2"]);
  assert.equal(r.requiresConfirmation, true);
  assert.ok(r.warnings.some((w) => w.includes("R77")));
});

test("a Gemini failure falls back to the rule-based reader", async () => {
  const r = await planScenario(
    "Northern Cross blocked for 2 hours",
    deps(async () => { throw new Error("Gemini request timed out"); }),
  );
  assert.equal(r.source, "fallback");
  assert.deepEqual(r.scenario.blockedRoadIds, ["R2"]);
});

test("output of the wrong shape falls back", async () => {
  const r = await planScenario("R2 blocked", deps(async () => ({ nonsense: true })));
  assert.equal(r.source, "fallback");
});

test("no key means fallback without calling the AI", async () => {
  let called = false;
  const r = await planScenario("R2 blocked", { generate: async () => { called = true; }, configured: () => false });
  assert.equal(r.source, "fallback");
  assert.equal(called, false);
});
