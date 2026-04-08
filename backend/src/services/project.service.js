import { Project } from "../models/project.model.js";
import { ApiKey } from "../models/apiKey.model.js";
import { AppError } from "../utils/appError.js";
import { generateApiKey } from "../utils/generateApiKey.js";
import { hashApiKey } from "../utils/hashApiKey.js";

const slugify = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const generateUniqueSlug = async (name) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;

  while (await Project.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

const ensureProjectOwnership = async ({ userId, projectId }) => {
  const project = await Project.findOne({
    _id: projectId,
    ownerId: userId,
  });

  if (!project) {
    throw new AppError("Project not found or access denied", 404);
  }

  return project;
};

export const createProjectForUser = async ({ userId, name, description }) => {
  const slug = await generateUniqueSlug(name);

  const project = await Project.create({
    name,
    slug,
    description: description || "",
    ownerId: userId,
  });

  const { rawKey, keyPrefix } = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  await ApiKey.create({
    projectId: project._id,
    name: "Default Ingestion Key",
    keyHash,
    keyPrefix,
  });

  return {
    project,
    apiKey: rawKey,
  };
};

export const getProjectsForUser = async (userId) => {
  const projects = await Project.find({ ownerId: userId }).sort({
    createdAt: -1,
  });

  return projects;
};

export const createAdditionalApiKey = async ({ userId, projectId, name }) => {
  await ensureProjectOwnership({ userId, projectId });

  const { rawKey, keyPrefix } = generateApiKey();
  const keyHash = hashApiKey(rawKey);

  const apiKeyDoc = await ApiKey.create({
    projectId,
    name: name || "Secondary Key",
    keyHash,
    keyPrefix,
  });

  return {
    apiKey: rawKey,
    apiKeyMeta: {
      _id: apiKeyDoc._id,
      projectId: apiKeyDoc.projectId,
      name: apiKeyDoc.name,
      keyPrefix: apiKeyDoc.keyPrefix,
      lastUsedAt: apiKeyDoc.lastUsedAt,
      expiresAt: apiKeyDoc.expiresAt,
      revokedAt: apiKeyDoc.revokedAt,
      isActive: apiKeyDoc.isActive,
      createdAt: apiKeyDoc.createdAt,
      updatedAt: apiKeyDoc.updatedAt,
    },
  };
};

export const getApiKeysForProject = async ({ userId, projectId }) => {
  await ensureProjectOwnership({ userId, projectId });

  const apiKeys = await ApiKey.find({ projectId })
    .select("-keyHash")
    .sort({ createdAt: -1 });

  return apiKeys;
};

export const revokeApiKeyForProject = async ({
  userId,
  projectId,
  apiKeyId,
}) => {
  await ensureProjectOwnership({ userId, projectId });

  const apiKey = await ApiKey.findOne({
    _id: apiKeyId,
    projectId,
  });

  if (!apiKey) {
    throw new AppError("API key not found for this project", 404);
  }

  if (apiKey.revokedAt || !apiKey.isActive) {
    throw new AppError("API key is already revoked", 400);
  }

  apiKey.isActive = false;
  apiKey.revokedAt = new Date();

  await apiKey.save();

  return {
    _id: apiKey._id,
    projectId: apiKey.projectId,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    lastUsedAt: apiKey.lastUsedAt,
    expiresAt: apiKey.expiresAt,
    revokedAt: apiKey.revokedAt,
    isActive: apiKey.isActive,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
  };
};