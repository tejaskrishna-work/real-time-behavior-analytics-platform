import mongoose from "mongoose";
import { Worker } from "bullmq";
import { redisClient } from "../config/redis.js";
import { DailyAggregate } from "../models/dailyAggregate.model.js";
import { Event } from "../models/event.model.js";
import { deleteCacheByPrefix } from "../services/cache.service.js";
import { env } from "../config/env.js";

const connection = redisClient.duplicate();

const formatDateUTC = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

const recomputeDailyAggregatesForProject = async (projectId) => {
  const rows = await Event.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $project: {
        eventName: 1,
        userId: 1,
        sessionId: 1,
        date: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: { $ifNull: ["$timestamp", "$createdAt"] },
          },
        },
      },
    },
    {
      $group: {
        _id: "$date",
        totalEvents: { $sum: 1 },
        userIds: { $addToSet: "$userId" },
        sessionIds: { $addToSet: "$sessionId" },
        eventNames: { $push: "$eventName" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  await DailyAggregate.deleteMany({
    projectId: new mongoose.Types.ObjectId(projectId),
  });

  const docs = rows.map((row) => {
    const eventCounts = {};

    for (const eventName of row.eventNames) {
      const key = String(eventName || "unknown").replaceAll(".", "_");
      eventCounts[key] = (eventCounts[key] || 0) + 1;
    }

    return {
      projectId: new mongoose.Types.ObjectId(projectId),
      date: row._id,
      totalEvents: row.totalEvents,
      uniqueUserIds: row.userIds.filter(Boolean),
      uniqueSessionIds: row.sessionIds.filter(Boolean),
      eventCounts,
    };
  });

  if (docs.length) {
    await DailyAggregate.insertMany(docs);
  }

  await deleteCacheByPrefix(`analytics:${projectId}:`);
};

const worker = new Worker(
  "analytics-preaggregation",
  async (job) => {
    if (job.name === "refresh-project-analytics") {
      const { projectId } = job.data;

      console.log(
        `[analytics-worker] recomputing aggregates for project ${projectId}`
      );

      await recomputeDailyAggregatesForProject(projectId);

      console.log(
        `[analytics-worker] aggregates recomputed for project ${projectId}`
      );
    }
  },
  {
    connection,
  }
);

worker.on("completed", (job) => {
  console.log(`[analytics-worker] job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(
    `[analytics-worker] job failed: ${job?.id ?? "unknown"}`,
    err.message
  );
});

console.log("[analytics-worker] worker started");