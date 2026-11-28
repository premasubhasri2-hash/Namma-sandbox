import { test } from "node:test";
import assert from "node:assert/strict";
import { requireRole } from "../src/middleware/roles.js";

const run = (middleware, user) => {
  let result = "passed";
  middleware({ user }, {}, (err) => { if (err) result = err.status; });
  return result;
};

test("an allowed role passes", () => {
  assert.equal(run(requireRole("operator", "admin"), { role: "operator" }), "passed");
});

test("a role that is not allowed gets 403", () => {
  assert.equal(run(requireRole("operator", "admin"), { role: "user" }), 403);
});

test("no signed-in user gets 401", () => {
  assert.equal(run(requireRole("admin"), undefined), 401);
});
