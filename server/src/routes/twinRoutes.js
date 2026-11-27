import { Router } from "express";
import * as twin from "../controllers/twinController.js";

const router = Router();

router.get("/state", twin.getState);
router.get("/overview", twin.getOverview);
router.get("/roads", twin.getRoads);
router.get("/vehicles", twin.getVehicles);
router.get("/deliveries", twin.getDeliveries);

export default router;