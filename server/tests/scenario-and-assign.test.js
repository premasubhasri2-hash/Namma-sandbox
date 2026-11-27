import { test } from "node:test";
import assert from "node:assert/strict";

import { createScenario } from "../src/services/simulation/scenario.js";
import { assignDeliveries } from "../src/services/optimization/assign.js";
import { network, depotNodeId, vehicles, deliveries } from "../src/data/seedNetwork.js";

const base = { network, depotNodeId, vehicles, deliveries };

test("createScenario never changes the baseline network", () => {
  const before = JSON.stringify(network);
  const { network: copy } = createScenario(network, { blockedRoadIds: ["R2"], penaltyMinutes: { R1: 10 } });
  assert.equal(JSON.stringify(network), before);
  assert.equal(copy.roads.find((r) => r.id === "R2").status, "blocked");
  assert.equal(network.roads.find((r) => r.id === "R2").status, "open");
});

test("createScenario applies travel-time penalties to the copy only", () => {
  const { network: copy } = createScenario(network, { penaltyMinutes: { R1: 10 } });
  assert.equal(copy.roads.find((r) => r.id === "R1").minutes, 14);
  assert.equal(network.roads.find((r) => r.id === "R1").minutes, 4);
});

test("createScenario rejects unknown roads and invalid values", () => {
  assert.throws(() => createScenario(network, { blockedRoadIds: ["R99"] }), /Unknown road/);
  assert.throws(() => createScenario(network, { penaltyMinutes: { R99: 5 } }), /Unknown road/);
  assert.throws(() => createScenario(network, { penaltyMinutes: { R1: -5 } }), />= 0/);
  assert.throws(() => createScenario(network, { durationMinutes: 0 }), /positive/);
  assert.throws(() => createScenario(network, { durationMinutes: "soon" }), /positive/);
});

test("baseline plan serves every delivery on time within vehicle capacity", () => {
  const plan = assignDeliveries(base);
  assert.equal(plan.metrics.deliveriesServed, deliveries.length);
  assert.equal(plan.metrics.unassignedCount, 0);
  assert.equal(plan.metrics.lateCount, 0);
  for (const a of plan.assignments) assert.ok(a.capacityLeft >= 0);
});

test("assignDeliveries is deterministic", () => {
  assert.deepEqual(assignDeliveries(base), assignDeliveries(base));
});

test("a delivery too big for every vehicle is reported as insufficient_capacity", () => {
  const plan = assignDeliveries({
    ...base,
    deliveries: [{ deliveryId: "BIG", nodeId: "N3", demand: 999, priority: "high", deadlineMinutes: 60 }],
  });
  assert.deepEqual(plan.unassigned, [{ deliveryId: "BIG", reason: "insufficient_capacity" }]);
});

test("a deadline that cannot be met is flagged late with the exact delay", () => {
  // Fastest trip to N3 is 9 minutes, so a 5-minute deadline is missed by 4.
  const plan = assignDeliveries({
    ...base,
    deliveries: [{ deliveryId: "TIGHT", nodeId: "N3", demand: 1, priority: "high", deadlineMinutes: 5 }],
  });
  const stop = plan.assignments.flatMap((a) => a.stops)[0];
  assert.equal(stop.late, true);
  assert.equal(stop.delayMinutes, 4);
  assert.equal(plan.metrics.lateCount, 1);
});

test("a delivery on an unreachable node is reported as no_route", () => {
  const isolated = {
    ...network,
    nodes: [...network.nodes, { id: "N10", name: "Island", lat: 0, lng: 0 }],
  };
  const plan = assignDeliveries({
    ...base,
    network: isolated,
    deliveries: [{ deliveryId: "ISLAND", nodeId: "N10", demand: 1, priority: "low", deadlineMinutes: 60 }],
  });
  assert.deepEqual(plan.unassigned, [{ deliveryId: "ISLAND", reason: "no_route" }]);
});

test("unavailable vehicles are not used", () => {
  const plan = assignDeliveries({
    ...base,
    vehicles: vehicles.map((v) => (v.vehicleId === "V2" ? { ...v, available: false } : v)),
  });
  assert.deepEqual(plan.assignments.map((a) => a.vehicleId), ["V1"]);
});