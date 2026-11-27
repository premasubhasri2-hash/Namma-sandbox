import { Router } from "express";
import * as dashboard from "../controllers/dashboardController.js";

const router = Router();

router.get("/summary", dashboard.getSummary);
router.get("/recent-activity", dashboard.getRecentActivity);

export default router;