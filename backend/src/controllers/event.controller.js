import { singleEventSchema, batchEventSchema } from "../validators/event.validator.js";
import { AppError } from "../utils/appError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { ingestSingleEvent, ingestBatchEvents } from "../services/event.service.js";

export const createEvent = async (req, res, next) => {
  try {
    const parsed = singleEventSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.issues[0].message, 400));
    }

    const result = await ingestSingleEvent({
      projectId: req.project._id,
      payload: parsed.data,
      req,
    });

    const statusCode = result.duplicate ? 200 : 201;

    res.status(statusCode).json(
      apiResponse({
        success: true,
        message: result.duplicate
          ? "Duplicate event detected, existing event returned"
          : "Event ingested successfully",
        data: {
          eventId: result.event?._id || null,
          projectId: result.event?.projectId || req.project._id,
          eventName: result.event?.eventName || parsed.data.eventName,
          timestamp: result.event?.timestamp || parsed.data.timestamp || null,
          duplicate: result.duplicate,
          created: result.created,
          sourceEventId: parsed.data.eventId || null,
        },
      })
    );
  } catch (error) {
    next(error);
  }
};

export const createBatchEvents = async (req, res, next) => {
  try {
    const parsed = batchEventSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.issues[0].message, 400));
    }

    const result = await ingestBatchEvents({
      projectId: req.project._id,
      events: parsed.data.events,
      req,
    });

    res.status(201).json(
      apiResponse({
        success: true,
        message: "Batch events processed successfully",
        data: result,
      })
    );
  } catch (error) {
    next(error);
  }
};