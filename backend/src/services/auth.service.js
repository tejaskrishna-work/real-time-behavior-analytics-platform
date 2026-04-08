import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/appError.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRefreshToken({ userId: user._id });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken({ userId: user._id });
  const refreshToken = generateRefreshToken({ userId: user._id });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};