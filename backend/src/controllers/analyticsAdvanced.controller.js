import { apiResponse } from "../utils/apiResponse.js";
import { getCache, setCache } from "../services/cache.service.js";
import {
  getWAUAnalytics,
  getMAUAnalytics,
  getSegmentationAnalytics,
  getPreaggregatedDailySummary,
} from "../services/analyticsAdvanced.service.js";

export const getWAU = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const days = Number(req.query.days || 30);
    const cacheKey = `analytics:${projectId}:wau:${days}`;

    let data = await getCache(cacheKey);

    if (!data) {
      data = await getWAUAnalytics(projectId, days);
      await setCache(cacheKey, data);
    }

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Weekly active users fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getMAU = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const days = Number(req.query.days || 30);
    const cacheKey = `analytics:${projectId}:mau:${days}`;

    let data = await getCache(cacheKey);

    if (!data) {
      data = await getMAUAnalytics(projectId, days);
      await setCache(cacheKey, data);
    }

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Monthly active users fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getSegmentation = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { field = "eventName", eventName, days = 30, limit = 10 } = req.query;

    const cacheKey = `analytics:${projectId}:segmentation:${field}:${eventName || "all"}:${days}:${limit}`;

    let data = await getCache(cacheKey);

    if (!data) {
      data = await getSegmentationAnalytics({
        projectId,
        field,
        eventName,
        days,
        limit,
      });
      await setCache(cacheKey, data);
    }

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Segmentation analytics fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getPreaggregatedDaily = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const days = Number(req.query.days || 7);
    const cacheKey = `analytics:${projectId}:preaggregated:${days}`;

    let data = await getCache(cacheKey);

    if (!data) {
      data = await getPreaggregatedDailySummary(projectId, days);
      await setCache(cacheKey, data);
    }

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Preaggregated daily analytics fetched successfully",
        data,
      })
    );
  } catch (error) {
    next(error);
  }
};