import { test } from "node:test";
import assert from "node:assert/strict";

import { nearestRoads } from "../src/services/routing/nearestRoad.js";
import { fallbackAnalysis } from "../src/services/ai/fallbackAnalyzer.js";
import { network } from "../src/data/seedNetwork.js";

const nodeById = new Map(network.nodes.map((n) => [n.id, n]));

test("a point at the middle of R2 is closest to R2, at about 0 metres", () => {
  const a = nodeById.get("N2");
  const b = nodeById.get("N3");
  const middle = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const [first] = nearestRoads(network, middle, 3);
  assert.equal(first.roadId, "R2");
  assert.ok(first.distanceMeters < 1);
});

test("a point on junction N2 touches exactly the roads that meet there (R1, R2, R5)", () => {
  const n2 = nodeById.get("N2");
  const top = nearestRoads(network, n2, 3);
  assert.deepEqual(top.map((r) => r.roadId).sort(), ["R1", "R2", "R5"]);
  assert.ok(top.every((r) => r.distanceMeters < 1));
});

test("nearestRoads sorts by distance and respects the limit", () => {
  const result = nearestRoads(network, { lat: 12.9371, lng: 77.629 }, 5);
  assert.equal(result.length, 5);
  for (let i = 1; i < result.length; i++) {
    assert.ok(result[i].distanceMeters >= result[i - 1].distanceMeters);
  }
});

test("a point far away (another city) is a long way from every road", () => {
  const [closest] = nearestRoads(network, { lat: 19.07, lng: 72.87 }, 1);
  assert.ok(closest.distanceMeters > 100000);
});

test("fallback: a partial blockage on waterlogging stays medium", () => {
  const result = fallbackAnalysis({
    description: "Road is flooded and one lane is blocked.",
    category: "waterlogging",
  });
  assert.equal(result.severity, "medium");
});

test("fallback: complete impassable waterlogging becomes high", () => {
  const result = fallbackAnalysis({
    description: "The road is completely submerged and impassable.",
    category: "waterlogging",
  });
  assert.equal(result.severity, "high");
});

test("fallback: a completely blocked accident becomes critical", () => {
  const result = fallbackAnalysis({ description: "Road completely blocked by a crash", category: "accident" });
  assert.equal(result.severity, "critical");
});

test("fallback: minor construction stays low and severity never goes below low", () => {
  const result = fallbackAnalysis({ description: "Minor work, slow traffic", category: "construction" });
  assert.equal(result.severity, "low");
});

test("fallback: honest about itself (low confidence, verification list, truncated summary)", () => {
  const long = "x".repeat(500);
  const result = fallbackAnalysis({ description: long, category: "other" });
  assert.equal(result.confidence, 0.3);
  assert.equal(result.needsVerification.length, 3);
  assert.equal(result.summary.length, 200);
  assert.match(result.imageObservations, /fallback/i);
});

test("fallback: an unknown category falls back to low base severity", () => {
  const result = fallbackAnalysis({ description: "Something odd", category: "alien_landing" });
  assert.equal(result.severity, "low");
});