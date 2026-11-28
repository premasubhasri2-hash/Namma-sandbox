// Login tokens (JWT). The token proves "this request comes from user X with
// role Y". It is signed with a secret that only the server knows, so it cannot
// be edited by the client. The secret lives in .env, never in the code.

import jwt from "jsonwebtoken";

const ALGORITHM = "HS256";
const EXPIRES_IN = "7d";
const MIN_SECRET_LENGTH = 32;

const httpError = (status, message) => Object.assign(new Error(message), { status });

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw httpError(500, `JWT_SECRET must be set in .env (at least ${MIN_SECRET_LENGTH} characters)`);
  }
  return secret;
}

export function signToken({ id, role }) {
  return jwt.sign({ role }, getSecret(), { subject: String(id), algorithm: ALGORITHM, expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    // Only HS256 is accepted, so a forged token using another algorithm is refused.
    const payload = jwt.verify(token, getSecret(), { algorithms: [ALGORITHM] });
    return { id: payload.sub, role: payload.role };
  } catch (error) {
    if (error.status) throw error; // a missing secret is a server problem, not a bad token
    throw httpError(401, error.name === "TokenExpiredError" ? "Login expired, please sign in again" : "Invalid token");
  }
}
