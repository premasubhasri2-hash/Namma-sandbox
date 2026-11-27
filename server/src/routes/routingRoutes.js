import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { shortestPathSchema, alternativeRoutesSchema } from "../validators/routingSchemas.js";
import * as routing from "../controllers/routingController.js";

const router = Router();

router.post("/shortest-path", validate(shortestPathSchema), routing.shortestPath);
router.post("/alternative-routes", validate(alternativeRoutesSchema), routing.alternativeRoutes);

export default router;