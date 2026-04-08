import { createClient } from "redis";
import { env } from "./env.js";

export const redisClient = createClient({
  url: env.redisUrl,
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected");
  } catch (error) {
    console.error("Redis connection error:", error.message);
  }
};