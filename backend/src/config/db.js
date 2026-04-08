import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "behavior_analytics",
    });

    console.log("MongoDB connected to:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};