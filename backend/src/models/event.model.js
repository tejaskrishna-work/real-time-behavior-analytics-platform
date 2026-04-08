import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    anonymousId: {
      type: String,
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    eventId: {
      type: String,
      default: null,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    source: {
      type: String,
      enum: ["web", "mobile", "backend", "other"],
      default: "web",
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ projectId: 1, timestamp: -1 });
eventSchema.index({ projectId: 1, eventName: 1, timestamp: -1 });
eventSchema.index({ projectId: 1, userId: 1, timestamp: -1 });
eventSchema.index({ projectId: 1, sessionId: 1, timestamp: -1 });
eventSchema.index(
  { projectId: 1, eventId: 1 },
  {
    unique: true,
    partialFilterExpression: { eventId: { $type: "string" } },
  }
);

export const Event = mongoose.model("Event", eventSchema);