import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  createProject,
  getMyProjects,
  createProjectApiKey,
  getProjectApiKeys,
  revokeProjectApiKey,
} from "../controllers/project.controller.js";

const router = Router();

router.use(protect);

router.post("/", createProject);
router.get("/", getMyProjects);

router.post("/:projectId/api-keys", createProjectApiKey);
router.get("/:projectId/api-keys", getProjectApiKeys);
router.patch("/:projectId/api-keys/:apiKeyId/revoke", revokeProjectApiKey);

export default router;