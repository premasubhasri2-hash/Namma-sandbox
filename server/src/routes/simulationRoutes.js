import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { runSimulationSchema } from "../validators/simulationSchemas.js";
import { authenticate } from "../middleware/authenticate.js";
import * as simulations from "../controllers/simulationController.js";

const router = Router();

router.post("/", authenticate, validate(runSimulationSchema), simulations.createSimulation);
router.get("/", simulations.listSimulations);
router.get("/:id", simulations.getSimulation);

export default router;