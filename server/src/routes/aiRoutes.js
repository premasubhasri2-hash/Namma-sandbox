import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { analyzeEventSchema } from "../validators/aiSchemas.js";
import * as ai from "../controllers/aiController.js";

const router = Router();

router.post("/analyze-event", validate(analyzeEventSchema), ai.analyzeEvent);

export default router;