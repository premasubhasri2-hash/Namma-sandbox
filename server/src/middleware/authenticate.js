import { verifyToken } from "../services/auth/tokens.js";

// Reads "Authorization: Bearer <token>", checks the signature and expiry, and
// puts { id, role } on req.user. The role comes from the signed token, so no
// database call is needed per request. Trade-off: if an admin changes someone's
// role, it takes effect when their token expires (7 days) or they log in again.
export function authenticate(req, res, next) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(Object.assign(new Error("Please sign in first"), { status: 401 }));
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
