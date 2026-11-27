import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { createEventSchema, updateStatusSchema } from "../validators/eventSchemas.js";
import * as events from "../controllers/eventController.js";

const router = Router();

router.post("/", validate(createEventSchema), events.createEvent);
router.get("/", events.listEvents);
router.get("/nearby", events.nearbyEvents); // must come before "/:id"
router.get("/:id", events.getEvent);
router.patch("/:id/status", validate(updateStatusSchema), events.updateEventStatus);

export default router;