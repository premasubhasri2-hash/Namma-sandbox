import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/services/auth/passwords.js";

test("a correct password verifies", async () => {
  const stored = await hashPassword("correct horse battery");
  assert.equal(await verifyPassword("correct horse battery", stored), true);
});

test("a wrong password does not verify", async () => {
  const stored = await hashPassword("correct horse battery");
  assert.equal(await verifyPassword("wrong password", stored), false);
});

test("the stored value never contains the password", async () => {
  const stored = await hashPassword("super-secret-pw");
  assert.ok(!stored.includes("super-secret-pw"));
  assert.match(stored, /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/);
});

test("the same password hashes differently each time (random salt)", async () => {
  const a = await hashPassword("same-password");
  const b = await hashPassword("same-password");
  assert.notEqual(a, b);
});

test("a malformed stored value is rejected instead of crashing", async () => {
  assert.equal(await verifyPassword("x", "not-a-hash"), false);
  assert.equal(await verifyPassword("x", ""), false);
});
