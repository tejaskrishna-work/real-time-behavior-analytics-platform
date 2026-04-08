import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  getWAU,
  getMAU,
  getSegmentation,
  getPreaggregatedDaily,
} from "../controllers/analyticsAdvanced.controller.js";

const router = Router();

router.use(protect);

router.get("/:projectId/users/wau", getWAU);
router.get("/:projectId/users/mau", getMAU);
router.get("/:projectId/segmentation", getSegmentation);
router.get("/:projectId/preaggregated/daily", getPreaggregatedDaily);

export default router;