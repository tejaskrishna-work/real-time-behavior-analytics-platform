import { ApiKey } from "../models/apiKey.model.js";
import { Project } from "../models/project.model.js";
import { AppError } from "../utils/appError.js";
import { hashApiKey } from "../utils/hashApiKey.js";

export const authenticateApiKey = async (req, res, next) => {
  try {
    console.log("STEP 1: entered API key middleware");

    const rawKey = req.headers["x-api-key"];
    console.log("STEP 2: rawKey =", rawKey);

    if (!rawKey) {
      return next(new AppError("API key missing", 401));
    }

    const keyHash = hashApiKey(rawKey);
    console.log("STEP 3: keyHash generated");

    const apiKeyDoc = await ApiKey.findOne({ keyHash, isActive: true });
    console.log("STEP 4: apiKeyDoc =", apiKeyDoc);

    if (!apiKeyDoc) {
      return next(new AppError("Invalid API key", 401));
    }

    if (apiKeyDoc.revokedAt) {
      return next(new AppError("API key has been revoked", 401));
    }

    if (apiKeyDoc.expiresAt && new Date() > apiKeyDoc.expiresAt) {
      return next(new AppError("API key has expired", 401));
    }

    const project = await Project.findById(apiKeyDoc.projectId);
    console.log("STEP 5: project =", project);

    if (!project || project.status !== "active") {
      return next(new AppError("Associated project is not active", 403));
    }

    apiKeyDoc.lastUsedAt = new Date();
    await apiKeyDoc.save();

    req.project = project;
    req.apiKey = {
      id: apiKeyDoc._id,
      projectId: apiKeyDoc.projectId,
      name: apiKeyDoc.name,
    };

    console.log("STEP 6: API key middleware success");
    next();
  } catch (error) {
    console.error("API KEY MIDDLEWARE FAILED:", error);
    next(error);
  }
};