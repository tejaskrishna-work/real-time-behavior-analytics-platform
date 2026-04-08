import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getOverview,
  getTopEvents,
  getEventTimeseries,
  getDailyActiveUsers,
  getRetention,
  getFunnel,
  getSessions,
} from "../controllers/analytics.controller.js";

const router = Router();

router.use(protect);

router.get("/:projectId/overview", getOverview);
router.get("/:projectId/events/top", getTopEvents);
router.get("/:projectId/events/timeseries", getEventTimeseries);
router.get("/:projectId/users/dau", getDailyActiveUsers);
router.get("/:projectId/retention", getRetention);
router.post("/:projectId/funnel", getFunnel);
router.get("/:projectId/sessions", getSessions);


export default router;