import { Event } from "../models/event.model.js";
import { deleteCacheByPrefix } from "./cache.service.js";
import { cacheKeys } from "../utils/cacheKeys.js";
import { updateDailyAggregateOnInsert } from "./dailyAggregate.service.js";

const buildEventDoc = ({ projectId, payload, req }) => {
  return {
    projectId,
    userId: payload.userId || null,
    anonymousId: payload.anonymousId || null,
    sessionId: payload.sessionId || null,
    eventId: payload.eventId || null,
    eventName: payload.eventName,
    properties: payload.properties || {},
    source: payload.source || "web",
    timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    receivedAt: new Date(),
    ipAddress: req.ip || null,
    userAgent: req.get("user-agent") || null,
  };
};

const refreshProjectAnalyticsState = async (projectId, createdEvent) => {
  await deleteCacheByPrefix(cacheKeys.analyticsProjectPrefix(projectId));
  await updateDailyAggregateOnInsert(createdEvent);
};

export const ingestSingleEvent = async ({ projectId, payload, req }) => {
  const eventDoc = buildEventDoc({ projectId, payload, req });

  try {
    const createdEvent = await Event.create(eventDoc);

    await refreshProjectAnalyticsState(projectId, createdEvent);

    return {
      created: true,
      duplicate: false,
      event: createdEvent,
    };
  } catch (error) {
    if (error?.code === 11000 && payload.eventId) {
      const existingEvent = await Event.findOne({
        projectId,
        eventId: payload.eventId,
      });

      return {
        created: false,
        duplicate: true,
        event: existingEvent,
      };
    }

    throw error;
  }
};

export const ingestBatchEvents = async ({ projectId, events, req }) => {
  const results = [];
  let createdCount = 0;
  let duplicateCount = 0;

  for (const payload of events) {
    const result = await ingestSingleEvent({ projectId, payload, req });

    if (result.created) createdCount += 1;
    if (result.duplicate) duplicateCount += 1;

    results.push({
      eventId: result.event?._id || null,
      duplicate: result.duplicate,
      created: result.created,
      sourceEventId: payload.eventId || null,
      eventName: payload.eventName,
    });
  }

  return {
    createdCount,
    duplicateCount,
    totalProcessed: events.length,
    results,
  };
};

export const getSessionAnalyticsSummary = async ({ projectId }) => {
  const rawEvents = await Event.find({
    projectId,
    sessionId: { $ne: null },
  })
    .select("sessionId userId anonymousId timestamp")
    .sort({ timestamp: 1 })
    .lean();

  const sessionMap = new Map();

  for (const event of rawEvents) {
    const sessionKey = event.sessionId;

    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, {
        sessionId: sessionKey,
        userId: event.userId || null,
        anonymousId: event.anonymousId || null,
        startTime: event.timestamp,
        endTime: event.timestamp,
        eventCount: 0,
      });
    }

    const session = sessionMap.get(sessionKey);
    session.eventCount += 1;

    if (new Date(event.timestamp) < new Date(session.startTime)) {
      session.startTime = event.timestamp;
    }

    if (new Date(event.timestamp) > new Date(session.endTime)) {
      session.endTime = event.timestamp;
    }
  }

  const sessions = Array.from(sessionMap.values()).map((session) => {
    const durationMs =
      new Date(session.endTime).getTime() - new Date(session.startTime).getTime();

    return {
      ...session,
      durationSeconds: Math.max(Math.floor(durationMs / 1000), 0),
    };
  });

  const totalSessions = sessions.length;
  const totalEventsAcrossSessions = sessions.reduce(
    (sum, s) => sum + s.eventCount,
    0
  );
  const totalDurationSeconds = sessions.reduce(
    (sum, s) => sum + s.durationSeconds,
    0
  );

  return {
    totalSessions,
    averageEventsPerSession:
      totalSessions > 0
        ? Number((totalEventsAcrossSessions / totalSessions).toFixed(2))
        : 0,
    averageSessionDurationSeconds:
      totalSessions > 0
        ? Number((totalDurationSeconds / totalSessions).toFixed(2))
        : 0,
    sessions,
  };
};