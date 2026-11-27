import { test } from "node:test";
import assert from "node:assert/strict";

import { runSimulation } from "../src/services/simulation/runSimulation.js";
import { assignDeliveries } from "../src/services/optimization/assign.js";
import { network, depotNodeId, vehicles, deliveries } from "../src/data/seedNetwork.js";

const base = { network, depotNodeId, vehicles, deliveries };
const run = (scenarioParams) => runSimulation({ ...base, scenarioParams });

test("the baseline inside a simulation equals a plain baseline run (nothing was overwritten)", () => {
  const before = JSON.stringify(network);
  const result = run({ blockedRoadIds: ["R2"], durationMinutes: 60 });
  assert.deepEqual(result.baseline, assignDeliveries(base));
  assert.equal(JSON.stringify(network), before);
});

test("closing R2 changes the results: D1 is affected and the reroute is longer", () => {
  const result = run({ blockedRoadIds: ["R2"], durationMinutes: 60 });
  assert.deepEqual(result.affectedDeliveryIds, ["D1"]);
  assert.notDeepEqual(result.reroute.metrics, result.baseline.metrics);
  assert.ok(result.reroute.metrics.totalKm > result.baseline.metrics.totalKm);
  assert.ok(result.reroute.metrics.totalVehicleMinutes > result.baseline.metrics.totalVehicleMinutes);
  const rerouted = result.reroute.assignments.flatMap((a) => a.stops);
  for (const stop of rerouted) assert.ok(!stop.routeRoadIds.includes("R2"), "no stop may use a closed road");
});

test("closing a road no baseline route uses affects nothing", () => {
  const result = run({ blockedRoadIds: ["R4"], durationMinutes: 60 });
  assert.deepEqual(result.affectedDeliveryIds, []);
  assert.equal(result.recommendedStrategy, "no_action_needed");
});

test("closure duration changes the recommendation: short closure -> wait, long closure -> reroute", () => {
  assert.equal(run({ blockedRoadIds: ["R2"], durationMinutes: 5 }).recommendedStrategy, "wait");
  assert.equal(run({ blockedRoadIds: ["R2"], durationMinutes: 120 }).recommendedStrategy, "reroute");
});

test("a longer closure makes waiting strictly worse while rerouting is unchanged", () => {
  const short = run({ blockedRoadIds: ["R2"], durationMinutes: 30 });
  const long = run({ blockedRoadIds: ["R2"], durationMinutes: 300 });
  assert.ok(long.wait.metrics.totalDelayMinutes > short.wait.metrics.totalDelayMinutes);
  assert.deepEqual(long.reroute.metrics, short.reroute.metrics);
});

test("two simultaneous closures affect more deliveries than one", () => {
  const one = run({ blockedRoadIds: ["R2"], durationMinutes: 60 });
  const two = run({ blockedRoadIds: ["R2", "R5"], durationMinutes: 60 });
  assert.ok(two.affectedDeliveryIds.length > one.affectedDeliveryIds.length);
  assert.deepEqual(two.affectedDeliveryIds, ["D1", "D3"]);
});

test("cutting off the depot leaves every delivery without a route when rerouting", () => {
  const result = run({ blockedRoadIds: ["R1", "R3"], durationMinutes: 60 });
  assert.equal(result.reroute.metrics.unassignedCount, deliveries.length);
  assert.ok(result.reroute.unassigned.every((u) => u.reason === "no_route"));
  assert.equal(result.recommendedStrategy, "wait");
});

test("a travel-time penalty on a used road marks its deliveries as affected", () => {
  const result = run({ penaltyMinutes: { R2: 30 }, durationMinutes: 60 });
  assert.ok(result.affectedDeliveryIds.includes("D1"));
});

test("the same scenario always gives the same result", () => {
  const params = { blockedRoadIds: ["R2", "R5"], durationMinutes: 45 };
  assert.deepEqual(run(params), run(params));
});

test("invalid scenario parameters are rejected", () => {
  assert.throws(() => run({ blockedRoadIds: ["R99"], durationMinutes: 60 }), /Unknown road/);
  assert.throws(() => run({ blockedRoadIds: ["R2"], durationMinutes: -1 }), /positive/);
});

test("the result lists its assumptions so they can be shown to users", () => {
  const result = run({ blockedRoadIds: ["R2"], durationMinutes: 60 });
  assert.ok(result.assumptions.length >= 4);
  assert.ok(result.assumptions.some((a) => /Synthetic/i.test(a)));
});