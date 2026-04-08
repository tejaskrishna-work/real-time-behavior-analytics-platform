import { z } from "zod";

const baseEventSchema = z.object({
  userId: z.string().min(1).max(100).optional().nullable(),
  anonymousId: z.string().min(1).max(100).optional().nullable(),
  sessionId: z.string().min(1).max(100).optional().nullable(),
  eventId: z.string().min(1).max(150).optional().nullable(),
  eventName: z.string().min(1).max(100),
  properties: z.object({}).passthrough().optional().default({}),
  source: z.enum(["web", "mobile", "backend", "other"]).optional().default("web"),
  timestamp: z.string().optional(),
});

export const singleEventSchema = baseEventSchema.refine(
  (data) => data.userId || data.anonymousId,
  {
    message: "Either userId or anonymousId is required",
    path: ["userId"],
  }
);

export const batchEventSchema = z.object({
  events: z.array(singleEventSchema).min(1).max(100),
});