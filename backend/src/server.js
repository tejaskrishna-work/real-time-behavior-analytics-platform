import app from "./app.js";
import { connectDB } from "./config/db.js";
import { connectRedis, redisClient } from "./config/redis.js";
import { env } from "./config/env.js";

const startServer = async () => {
  await connectDB();
  await connectRedis();

  await redisClient.ping();
  console.log("Redis ping successful");

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer();