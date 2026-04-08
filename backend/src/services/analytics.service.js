import mongoose from "mongoose";
import { Event } from "../models/event.model.js";
import { Project } from "../models/project.model.js";
import { AppError } from "../utils/appError.js";
import { getSessionAnalyticsSummary } from "./event.service.js";
import { getCache, setCache, hashSteps } from "./cache.service.js";
import { cacheKeys } from "../utils/cacheKeys.js";

const ensureProjectAccess = async ({ userId, projectId }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError("Invalid project id", 400);
  }

  const project = await Project.findOne({
    _id: projectId,
    ownerId: userId,
  });

  if (!project) {
    throw new AppError("Project not found or access denied", 404);
  }

  return project;
};

export const getOverviewAnalytics = async ({ userId, projectId }) => {
  await ensureProjectAccess({ userId, projectId });

  const cacheKey = cacheKeys.analyticsOverview(projectId);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalEvents,
    uniqueUsers,
    uniqueAnonymousUsers,
    uniqueSessions,
    todayEvents,
  ] = await Promise.all([
    Event.countDocuments({ projectId }),
    Event.distinct("userId", {
      projectId,
      userId: { $ne: null },
    }).then((arr) => arr.length),
    Event.distinct("anonymousId", {
      projectId,
      anonymousId: { $ne: null },
    }).then((arr) => arr.length),
    Event.distinct("sessionId", {
      projectId,
      sessionId: { $ne: null },
    }).then((arr) => arr.length),
    Event.countDocuments({
      projectId,
      timestamp: { $gte: startOfToday },
    }),
  ]);

  const result = {
    totalEvents,
    uniqueUsers,
    uniqueAnonymousUsers,
    uniqueSessions,
    todayEvents,
  };

  await setCache(cacheKey, result);
  return result;
};

export const getTopEventsAnalytics = async ({
  userId,
  projectId,
  limit = 10,
}) => {
  await ensureProjectAccess({ userId, projectId });

  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  const cacheKey = cacheKeys.analyticsTopEvents(projectId, safeLimit);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const result = await Event.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $group: {
        _id: "$eventName",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1, _id: 1 },
    },
    {
      $limit: safeLimit,
    },
    {
      $project: {
        _id: 0,
        eventName: "$_id",
        count: 1,
      },
    },
  ]);

  await setCache(cacheKey, result);
  return result;
};

export const getEventTimeseriesAnalytics = async ({
  userId,
  projectId,
  days = 7,
}) => {
  await ensureProjectAccess({ userId, projectId });

  const safeDays = Math.max(1, Math.min(Number(days) || 7, 365));
  const cacheKey = cacheKeys.analyticsTimeseries(projectId, safeDays);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - safeDays + 1);
  startDate.setHours(0, 0, 0, 0);

  const result = await Event.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$timestamp",
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        count: 1,
      },
    },
  ]);

  const payload = {
    days: safeDays,
    series: result,
  };

  await setCache(cacheKey, payload);
  return payload;
};

export const getDailyActiveUsersAnalytics = async ({
  userId,
  projectId,
  days = 7,
}) => {
  await ensureProjectAccess({ userId, projectId });

  const safeDays = Math.max(1, Math.min(Number(days) || 7, 365));
  const cacheKey = cacheKeys.analyticsDau(projectId, safeDays);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - safeDays + 1);
  startDate.setHours(0, 0, 0, 0);

  const result = await Event.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
        timestamp: { $gte: startDate },
        userId: { $ne: null },
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          userId: "$userId",
        },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        dau: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        dau: 1,
      },
    },
  ]);

  const payload = {
    days: safeDays,
    series: result,
  };

  await setCache(cacheKey, payload);
  return payload;
};

export const getRetentionAnalytics = async ({
  userId,
  projectId,
  days = 7,
}) => {
  await ensureProjectAccess({ userId, projectId });

  const safeDays = Math.max(1, Math.min(Number(days) || 7, 365));
  const cacheKey = cacheKeys.analyticsRetention(projectId, safeDays);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - safeDays + 1);
  startDate.setHours(0, 0, 0, 0);

  const rawEvents = await Event.find({
    projectId,
    userId: { $ne: null },
    timestamp: { $gte: startDate },
  })
    .select("userId timestamp")
    .sort({ timestamp: 1 })
    .lean();

  const userActivityMap = new Map();

  for (const event of rawEvents) {
    const dateStr = new Date(event.timestamp).toISOString().slice(0, 10);

    if (!userActivityMap.has(event.userId)) {
      userActivityMap.set(event.userId, {
        firstSeenDate: dateStr,
        activeDates: new Set(),
      });
    }

    userActivityMap.get(event.userId).activeDates.add(dateStr);
  }

  const cohortMap = new Map();

  for (const [, value] of userActivityMap.entries()) {
    const cohortDate = value.firstSeenDate;

    if (!cohortMap.has(cohortDate)) {
      cohortMap.set(cohortDate, {
        cohortDate,
        cohortSize: 0,
        returns: {},
      });
    }

    const cohort = cohortMap.get(cohortDate);
    cohort.cohortSize += 1;

    for (const activeDate of value.activeDates) {
      const diffDays = Math.floor(
        (new Date(activeDate) - new Date(cohortDate)) / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= 0) {
        cohort.returns[diffDays] = (cohort.returns[diffDays] || 0) + 1;
      }
    }
  }

  const result = Array.from(cohortMap.values())
    .sort((a, b) => a.cohortDate.localeCompare(b.cohortDate))
    .map((cohort) => {
      const retention = {};

      Object.entries(cohort.returns).forEach(([day, count]) => {
        retention[`day_${day}`] = {
          users: count,
          retentionRate: Number(((count / cohort.cohortSize) * 100).toFixed(2)),
        };
      });

      return {
        cohortDate: cohort.cohortDate,
        cohortSize: cohort.cohortSize,
        retention,
      };
    });

  const payload = {
    days: safeDays,
    cohorts: result,
  };

  await setCache(cacheKey, payload);
  return payload;
};

export const getFunnelAnalytics = async ({
  userId,
  projectId,
  steps = [],
}) => {
  await ensureProjectAccess({ userId, projectId });

  if (!Array.isArray(steps) || steps.length < 2) {
    throw new AppError("At least 2 funnel steps are required", 400);
  }

  const sanitizedSteps = steps
    .map((step) => String(step).trim())
    .filter((step) => step.length > 0);

  if (sanitizedSteps.length < 2) {
    throw new AppError("At least 2 valid funnel steps are required", 400);
  }

  const stepsHash = hashSteps(sanitizedSteps);
  const cacheKey = cacheKeys.analyticsFunnel(projectId, stepsHash);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const rawEvents = await Event.find({
    projectId,
    userId: { $ne: null },
    eventName: { $in: sanitizedSteps },
  })
    .select("userId eventName timestamp")
    .sort({ timestamp: 1 })
    .lean();

  const userEventsMap = new Map();

  for (const event of rawEvents) {
    if (!userEventsMap.has(event.userId)) {
      userEventsMap.set(event.userId, []);
    }

    userEventsMap.get(event.userId).push({
      eventName: event.eventName,
      timestamp: event.timestamp,
    });
  }

  const stepUserCounts = Array(sanitizedSteps.length).fill(0);

  for (const [, events] of userEventsMap.entries()) {
    let currentStepIndex = 0;

    for (const event of events) {
      if (event.eventName === sanitizedSteps[currentStepIndex]) {
        currentStepIndex += 1;

        if (currentStepIndex === sanitizedSteps.length) {
          break;
        }
      }
    }

    for (let i = 0; i < currentStepIndex; i++) {
      stepUserCounts[i] += 1;
    }
  }

  const firstStepUsers = stepUserCounts[0] || 0;

  const result = sanitizedSteps.map((step, index) => {
    const users = stepUserCounts[index] || 0;

    return {
      step,
      users,
      conversionFromFirstStep:
        firstStepUsers > 0
          ? Number(((users / firstStepUsers) * 100).toFixed(2))
          : 0,
      dropOffFromPreviousStep:
        index === 0
          ? 0
          : Math.max((stepUserCounts[index - 1] || 0) - users, 0),
    };
  });

  const payload = {
    totalUsersAtStep1: firstStepUsers,
    steps: result,
  };

  await setCache(cacheKey, payload);
  return payload;
};

export const getSessionAnalytics = async ({ userId, projectId }) => {
  await ensureProjectAccess({ userId, projectId });

  const cacheKey = cacheKeys.analyticsSessions(projectId);
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const payload = await getSessionAnalyticsSummary({ projectId });

  await setCache(cacheKey, payload);
  return payload;
};