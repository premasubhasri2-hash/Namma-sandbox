import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { analyzeEventSchema, explainSimulationSchema } from "../validators/aiSchemas.js";
import * as ai from "../controllers/aiController.js";

const router = Router();

router.post("/analyze-event", validate(analyzeEventSchema), ai.analyzeEvent);
router.post("/explain-simulation", validate(explainSimulationSchema), ai.explainSimulation);

export default router;