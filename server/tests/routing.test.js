import { test } from "node:test";
import assert from "node:assert/strict";

import { MinHeap } from "../src/services/routing/MinHeap.js";
import { buildGraph } from "../src/services/routing/graph.js";
import { shortestPath } from "../src/services/routing/dijkstra.js";
import { alternativeRoutes } from "../src/services/routing/alternatives.js";
import { network } from "../src/data/seedNetwork.js";

const graphWith = (blockedIds = []) =>
  buildGraph(
    network.nodes,
    network.roads.map((r) => (blockedIds.includes(r.id) ? { ...r, status: "blocked" } : r)),
  );

test("MinHeap pops values in ascending priority order", () => {
  const heap = new MinHeap();
  [5, 1, 4, 2, 3, 0].forEach((p) => heap.push(`p${p}`, p));
  const out = [];
  while (heap.size > 0) out.push(heap.pop());
  assert.deepEqual(out, ["p0", "p1", "p2", "p3", "p4", "p5"]);
});

test("MinHeap.pop on an empty heap returns undefined", () => {
  assert.equal(new MinHeap().pop(), undefined);
});

test("shortestPath finds the fastest known route (N1 -> N6)", () => {
  const route = shortestPath(graphWith(), "N1", "N6");
  assert.equal(route.found, true);
  assert.deepEqual(route.roadIds, ["R1", "R2", "R6"]);
  assert.deepEqual(route.nodes, ["N1", "N2", "N3", "N6"]);
  assert.equal(route.minutes, 13);
  assert.equal(route.km, 3.8);
});

test("shortestPath from a node to itself costs nothing", () => {
  const route = shortestPath(graphWith(), "N4", "N4");
  assert.equal(route.found, true);
  assert.equal(route.minutes, 0);
  assert.deepEqual(route.nodes, ["N4"]);
});

test("a blocked road is never used and the trip gets slower", () => {
  const normal = shortestPath(graphWith(), "N1", "N3");
  const detour = shortestPath(graphWith(["R2"]), "N1", "N3");
  assert.equal(normal.minutes, 9);
  assert.equal(detour.found, true);
  assert.equal(detour.minutes, 21);
  assert.ok(!detour.roadIds.includes("R2"));
});

test("when blocked roads cut the network, no route is found", () => {
  // R1 and R3 are the only roads leaving the depot N1.
  const route = shortestPath(graphWith(["R1", "R3"]), "N1", "N3");
  assert.equal(route.found, false);
  assert.equal(route.minutes, Infinity);
});

test("unknown nodes throw a clear error", () => {
  assert.throws(() => shortestPath(graphWith(), "N1", "NOPE"), /Unknown destination node/);
  assert.throws(() => shortestPath(graphWith(), "NOPE", "N1"), /Unknown start node/);
});

test("a road pointing at an unknown node is rejected when building the graph", () => {
  assert.throws(
    () => buildGraph([{ id: "A" }], [{ id: "X", from: "A", to: "B", minutes: 1, km: 1 }]),
    /unknown node/,
  );
});

test("one-way roads can only be driven in one direction", () => {
  const nodes = [{ id: "A" }, { id: "B" }];
  const roads = [{ id: "X", from: "A", to: "B", minutes: 2, km: 1, oneWay: true }];
  const graph = buildGraph(nodes, roads);
  assert.equal(shortestPath(graph, "A", "B").found, true);
  assert.equal(shortestPath(graph, "B", "A").found, false);
});

test("alternativeRoutes returns the fastest route first, then distinct slower ones", () => {
  const routes = alternativeRoutes(network, "N1", "N3", { maxRoutes: 3 });
  assert.ok(routes.length >= 2);
  assert.equal(routes[0].minutes, 9);
  const keys = routes.map((r) => r.roadIds.join(","));
  assert.equal(new Set(keys).size, keys.length, "routes must be distinct");
  for (let i = 1; i < routes.length; i++) {
    assert.ok(routes[i].minutes >= routes[i - 1].minutes, "sorted fastest first");
  }
});

test("alternativeRoutes returns an empty list when the destination is unreachable", () => {
  const cut = {
    ...network,
    roads: network.roads.map((r) => (["R1", "R3"].includes(r.id) ? { ...r, status: "blocked" } : r)),
  };
  assert.deepEqual(alternativeRoutes(cut, "N1", "N3"), []);
});