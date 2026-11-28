// Password hashing with scrypt, which is built into Node (no extra package).
// A password is never stored. We store: scrypt:<salt>:<hash>, where the salt is
// random per user, so two users with the same password get different hashes.

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(plain, salt, KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(plain, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(plain, Buffer.from(saltHex, "hex"), expected.length);
  // timingSafeEqual avoids leaking how many leading bytes matched.
  return timingSafeEqual(actual, expected);
}
