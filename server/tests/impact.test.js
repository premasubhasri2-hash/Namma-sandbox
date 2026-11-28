import { test } from "node:test";
import assert from "node:assert/strict";

import { runSimulation } from "../src/services/simulation/runSimulation.js";
import { buildImpactReport } from "../src/services/agents/impactAnalysis.js";
import { network, depotNodeId, vehicles, deliveries } from "../src/data/seedNetwork.js";

const impact = (scenarioParams) =>
  buildImpactReport(runSimulation({ network, depotNodeId, vehicles, deliveries, scenarioParams }), {
    network,
    deliveries,
  });

test("R2 closed for 2 hours: D1 is affected and the report names the road", () => {
  const r = impact({ blockedRoadIds: ["R2"], durationMinutes: 120 });
  assert.equal(r.disruptedRoads[0].name, "Northern Cross");
  assert.equal(r.disruptedRoads[0].kind, "closed");
  assert.deepEqual(r.affectedDeliveries.map((d) => d.deliveryId), ["D1"]);
  assert.equal(r.affectedDeliveries[0].priority, "high");
  assert.equal(r.totals.demandAtRisk, 8);
  assert.equal(r.totals.affectedVehicleCount, 1);
  assert.equal(r.source, "engine");
});

test("a high-priority delivery that is still late after rerouting makes the risk critical", () => {
  const r = impact({ blockedRoadIds: ["R2"], durationMinutes: 120 });
  assert.equal(r.recommendedStrategy, "reroute");
  assert.equal(r.affectedDeliveries[0].reroute.late, true);
  assert.equal(r.riskLevel, "critical");
});

test("a closed road nobody uses has no impact", () => {
  const r = impact({ blockedRoadIds: ["R4"], durationMinutes: 60 });
  assert.equal(r.riskLevel, "none");
  assert.equal(r.totals.affectedDeliveryCount, 0);
  assert.deepEqual(r.affectedVehicles, []);
});

test("cutting off the depot reports deliveries that cannot be served", () => {
  const r = impact({ blockedRoadIds: ["R1", "R3"], durationMinutes: 60 });
  assert.ok(r.totals.unservedUnderReroute > 0);
  assert.ok(r.affectedDeliveries.some((d) => d.reroute.servedByReroute === false));
});

test("a slower (not closed) road is reported as slower with its extra minutes", () => {
  const r = impact({ penaltyMinutes: { R2: 30 }, durationMinutes: 60 });
  assert.equal(r.disruptedRoads[0].kind, "slower");
  assert.equal(r.disruptedRoads[0].extraMinutes, 30);
});

test("every affected vehicle lists its affected deliveries", () => {
  const r = impact({ blockedRoadIds: ["R2"], durationMinutes: 120 });
  assert.deepEqual(r.affectedVehicles[0].affectedDeliveryIds, ["D1"]);
  assert.equal(typeof r.affectedVehicles[0].finishMinutes.baseline, "number");
});
