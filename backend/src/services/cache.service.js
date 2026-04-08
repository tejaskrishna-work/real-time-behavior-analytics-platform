import crypto from "crypto";
import { redisClient } from "../config/redis.js";

const DEFAULT_TTL_SECONDS = 300;

export const getCache = async (key) => {
  const rawValue = await redisClient.get(key);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

export const setCache = async (
  key,
  value,
  ttlSeconds = DEFAULT_TTL_SECONDS
) => {
  await redisClient.set(key, JSON.stringify(value), {
    EX: ttlSeconds,
  });
};

export const deleteCacheByPrefix = async (prefix) => {
  const keys = await redisClient.keys(`${prefix}*`);

  if (!keys.length) {
    return 0;
  }

  return redisClient.del(keys);
};

export const hashSteps = (steps = []) => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(steps))
    .digest("hex")
    .slice(0, 16);
};