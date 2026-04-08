import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: "7d",
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: "30d",
  });
};