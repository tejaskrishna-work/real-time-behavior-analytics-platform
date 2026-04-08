import { Router } from "express";
import { authenticateApiKey } from "../middlewares/apiKey.middleware.js";
import { ingestionRateLimit } from "../middlewares/ingestionRateLimit.middleware.js";
import { createEvent, createBatchEvents } from "../controllers/event.controller.js";

const router = Router();

router.use(authenticateApiKey);
router.use(ingestionRateLimit);

router.post("/", createEvent);
router.post("/batch", createBatchEvents);

export default router;