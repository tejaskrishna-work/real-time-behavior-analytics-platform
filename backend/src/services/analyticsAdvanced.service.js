import mongoose from "mongoose";
import { Event } from "../models/event.model.js";
import { DailyAggregate } from "../models/dailyAggregate.model.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const formatDateUTC = (date) => {
  return new Date(date).toISOString().slice(0, 10);
};

const getLastNDates = (days) => {
  const dates = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(formatDateUTC(d));
  }

  return dates;
};

const buildDateToUsersMap = async (projectId, daysBack = 60) => {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - daysBack + 1);
  start.setUTCHours(0, 0, 0, 0);

  const rows = await Event.aggregate([
    {
      $match: {
        projectId: toObjectId(projectId),
        createdAt: { $gte: start },
        userId: { $ne: null },
      },
    },
    {
      $project: {
        userId: 1,
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
        _id: {
          date: "$date",
          userId: "$userId",
        },
      },
    },
  ]);

  const map = new Map();

  for (const row of rows) {
    const date = row._id.date;
    const userId = row._id.userId;

    if (!map.has(date)) {
      map.set(date, new Set());
    }

    map.get(date).add(userId);
  }

  return map;
};

const buildRollingActiveSeries = async (projectId, totalDays, windowDays) => {
  const dateToUsers = await buildDateToUsersMap(
    projectId,
    Math.max(totalDays, windowDays) + 35
  );

  const dates = getLastNDates(totalDays);

  const series = dates.map((date, idx) => {
    const union = new Set();
    const startIdx = Math.max(0, idx - windowDays + 1);

    for (let i = startIdx; i <= idx; i++) {
      const users = dateToUsers.get(dates[i]);
      if (!users) continue;

      for (const user of users) {
        union.add(user);
      }
    }

    return {
      date,
      activeUsers: union.size,
    };
  });

  return series;
};

export const getWAUAnalytics = async (projectId, days = 30) => {
  const series = await buildRollingActiveSeries(projectId, Number(days), 7);

  return {
    days: Number(days),
    window: 7,
    currentWAU: series.length ? series[series.length - 1].activeUsers : 0,
    series: series.map((item) => ({
      date: item.date,
      wau: item.activeUsers,
    })),
  };
};

export const getMAUAnalytics = async (projectId, days = 30) => {
  const series = await buildRollingActiveSeries(projectId, Number(days), 30);

  return {
    days: Number(days),
    window: 30,
    currentMAU: series.length ? series[series.length - 1].activeUsers : 0,
    series: series.map((item) => ({
      date: item.date,
      mau: item.activeUsers,
    })),
  };
};

export const getSegmentationAnalytics = async ({
  projectId,
  field = "eventName",
  eventName,
  days = 30,
  limit = 10,
}) => {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - Number(days) + 1);
  start.setUTCHours(0, 0, 0, 0);

  const match = {
    projectId: toObjectId(projectId),
    createdAt: { $gte: start },
  };

  if (eventName) {
    match.eventName = eventName;
  }

  const safeField = field.startsWith("$") ? field.slice(1) : field;

  const data = await Event.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $ifNull: [`$${safeField}`, "UNKNOWN"],
        },
        count: { $sum: 1 },
        users: { $addToSet: "$userId" },
      },
    },
    {
      $project: {
        _id: 0,
        segment: "$_id",
        count: 1,
        uniqueUsers: { $size: "$users" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: Number(limit) },
  ]);

  return {
    field: safeField,
    eventName: eventName || null,
    days: Number(days),
    segments: data,
  };
};

export const getPreaggregatedDailySummary = async (projectId, days = 7) => {
  const dates = getLastNDates(Number(days));

  const rows = await DailyAggregate.find({
    projectId: toObjectId(projectId),
    date: { $in: dates },
  })
    .sort({ date: 1 })
    .lean();

  const rowMap = new Map(rows.map((row) => [row.date, row]));

  const series = dates.map((date) => {
    const row = rowMap.get(date);

    return {
      date,
      totalEvents: row?.totalEvents || 0,
      uniqueUsers: row?.uniqueUserIds?.length || 0,
      uniqueSessions: row?.uniqueSessionIds?.length || 0,
      eventCounts: row?.eventCounts || {},
    };
  });

  return {
    days: Number(days),
    series,
  };
};