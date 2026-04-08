import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  redisUrl: process.env.REDIS_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
};