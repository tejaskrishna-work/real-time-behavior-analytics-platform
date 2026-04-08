import { DailyAggregate } from "../models/dailyAggregate.model.js";
import { deleteCacheByPrefix } from "./cache.service.js";

const formatDateUTC = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

const ensureSafeKey = (value) => {
  return String(value || "unknown").replaceAll(".", "_");
};

export const updateDailyAggregateOnInsert = async (eventDoc) => {
  const eventDate = formatDateUTC(
    eventDoc.timestamp || eventDoc.createdAt || new Date()
  );
  const eventName = ensureSafeKey(eventDoc.eventName);

  const update = {
    $inc: {
      totalEvents: 1,
      [`eventCounts.${eventName}`]: 1,
    },
    $addToSet: {},
  };

  if (eventDoc.userId) {
    update.$addToSet.uniqueUserIds = eventDoc.userId;
  }

  if (eventDoc.sessionId) {
    update.$addToSet.uniqueSessionIds = eventDoc.sessionId;
  }

  await DailyAggregate.updateOne(
    {
      projectId: eventDoc.projectId,
      date: eventDate,
    },
    update,
    { upsert: true }
  );

  await deleteCacheByPrefix(`analytics:${String(eventDoc.projectId)}:`);
};