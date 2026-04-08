import mongoose from "mongoose";

const dailyAggregateSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    totalEvents: {
      type: Number,
      default: 0,
    },
    uniqueUserIds: {
      type: [String],
      default: [],
    },
    uniqueSessionIds: {
      type: [String],
      default: [],
    },
    eventCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

dailyAggregateSchema.index({ projectId: 1, date: 1 }, { unique: true });

export const DailyAggregate = mongoose.model(
  "DailyAggregate",
  dailyAggregateSchema
);