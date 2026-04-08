import { Queue } from "bullmq";
import { redisClient } from "../config/redis.js";

const connection = redisClient.duplicate();

connection.on("error", (err) => {
  console.error("[analytics-queue] redis connection error:", err.message);
});

connection.on("connect", () => {
  console.log("[analytics-queue] redis connection connected");
});

connection.on("ready", () => {
  console.log("[analytics-queue] redis connection ready");
});

export const analyticsQueue = new Queue("analytics-preaggregation", {
  connection,
});

export const enqueueAnalyticsRefresh = async (projectId) => {
  try {
    console.log("[analytics-queue] enqueue start for project:", projectId);

    const job = await analyticsQueue.add(
      "refresh-project-analytics",
      { projectId },
      {
        removeOnComplete: 50,
        removeOnFail: 50,
      }
    );

    console.log("[analytics-queue] enqueue success, job id:", job.id);
    return job;
  } catch (error) {
    console.error("[analytics-queue] enqueue failed:", error.message);
    throw error;
  }
};