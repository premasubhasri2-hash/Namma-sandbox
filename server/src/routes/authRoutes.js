import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/roles.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { registerSchema, loginSchema, setRoleSchema } from "../validators/authSchemas.js";
import * as auth from "../controllers/authController.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), auth.register);
router.post("/login", authLimiter, validate(loginSchema), auth.login);
router.get("/me", authenticate, auth.me);
router.patch("/users/:id/role", authenticate, requireRole("admin"), validate(setRoleSchema), auth.setRole);

export default router;
