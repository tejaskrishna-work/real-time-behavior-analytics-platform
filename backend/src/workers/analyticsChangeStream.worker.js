import mongoose from "mongoose";
import { Event } from "../models/event.model.js";
import { DailyAggregate } from "../models/dailyAggregate.model.js";
import { deleteCacheByPrefix } from "../services/cache.service.js";

const formatDateUTC = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

const ensureSafeKey = (value) => {
  return String(value).replaceAll(".", "_");
};

const handleInsert = async (doc) => {
  const eventDate = formatDateUTC(doc.timestamp || doc.createdAt || new Date());
  const eventName = ensureSafeKey(doc.eventName || "unknown");

  const update = {
    $inc: {
      totalEvents: 1,
      [`eventCounts.${eventName}`]: 1,
    },
    $addToSet: {},
  };

  if (doc.userId) {
    update.$addToSet.uniqueUserIds = doc.userId;
  }

  if (doc.sessionId) {
    update.$addToSet.uniqueSessionIds = doc.sessionId;
  }

  await DailyAggregate.updateOne(
    {
      projectId: doc.projectId,
      date: eventDate,
    },
    update,
    {
      upsert: true,
    }
  );

  await deleteCacheByPrefix(`analytics:${String(doc.projectId)}:`);
};

export const startAnalyticsChangeStreamWorker = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.log("[analytics-change-stream] skipped: mongoose not connected");
    return;
  }

  const changeStream = Event.watch(
    [{ $match: { operationType: "insert" } }],
    { fullDocument: "updateLookup" }
  );

  changeStream.on("change", async (change) => {
    try {
      await handleInsert(change.fullDocument);
      console.log("[analytics-change-stream] aggregated event insert");
    } catch (error) {
      console.error("[analytics-change-stream] failed:", error.message);
    }
  });

  changeStream.on("error", (error) => {
    console.error("[analytics-change-stream] stream error:", error.message);
  });

  console.log("[analytics-change-stream] worker started");
};