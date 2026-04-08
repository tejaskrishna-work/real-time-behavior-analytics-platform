import { redisClient } from "../config/redis.js";
import { AppError } from "../utils/appError.js";

export const ingestionRateLimit = async (req, res, next) => {
  try {
    const apiKeyId = req.apiKey?.id?.toString();

    if (!apiKeyId) {
      return next(new AppError("API key context missing for rate limiting", 500));
    }

    const currentMinute = new Date().toISOString().slice(0, 16);
    const redisKey = `rate_limit:ingest:${apiKeyId}:${currentMinute}`;
    const limit = 300;

    const currentCount = await redisClient.incr(redisKey);

    if (currentCount === 1) {
      await redisClient.expire(redisKey, 60);
    }

    if (currentCount > limit) {
      return next(
        new AppError("Rate limit exceeded for ingestion API key", 429)
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};