import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { analyzeEventSchema, explainSimulationSchema, analyzeImpactSchema, planScenarioSchema } from "../validators/aiSchemas.js";
import * as ai from "../controllers/aiController.js";

const router = Router();

router.post("/analyze-event", validate(analyzeEventSchema), ai.analyzeEvent);
router.post("/explain-simulation", validate(explainSimulationSchema), ai.explainSimulation);
router.post("/analyze-impact", validate(analyzeImpactSchema), ai.analyzeImpact);
router.post("/plan-scenario", validate(planScenarioSchema), ai.planScenarioFromText);

export default router;