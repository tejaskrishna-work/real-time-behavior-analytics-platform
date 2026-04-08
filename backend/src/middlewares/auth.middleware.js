import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";
import { User } from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Unauthorized: token missing", 401));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtAccessSecret);

    const user = await User.findById(decoded.userId).select("-passwordHash");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
};