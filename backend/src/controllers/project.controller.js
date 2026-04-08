import { createProjectSchema } from "../validators/project.validator.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import {
  createProjectForUser,
  getProjectsForUser,
  createAdditionalApiKey,
  getApiKeysForProject,
  revokeApiKeyForProject,
} from "../services/project.service.js";

export const createProject = async (req, res, next) => {
  try {
    const parsed = createProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.issues[0].message, 400));
    }

    const result = await createProjectForUser({
      userId: req.user._id,
      ...parsed.data,
    });

    res.status(201).json(
      apiResponse({
        success: true,
        message: "Project created successfully",
        data: result,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (req, res, next) => {
  try {
    const projects = await getProjectsForUser(req.user._id);

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Projects fetched successfully",
        data: projects,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const createProjectApiKey = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    const result = await createAdditionalApiKey({
      userId: req.user._id,
      projectId,
      name,
    });

    res.status(201).json(
      apiResponse({
        success: true,
        message: "API key created successfully",
        data: result,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getProjectApiKeys = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const apiKeys = await getApiKeysForProject({
      userId: req.user._id,
      projectId,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "API keys fetched successfully",
        data: apiKeys,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const revokeProjectApiKey = async (req, res, next) => {
  try {
    const { projectId, apiKeyId } = req.params;

    const result = await revokeApiKeyForProject({
      userId: req.user._id,
      projectId,
      apiKeyId,
    });

    res.status(200).json(
      apiResponse({
        success: true,
        message: "API key revoked successfully",
        data: result,
      })
    );
  } catch (error) {
    next(error);
  }
};