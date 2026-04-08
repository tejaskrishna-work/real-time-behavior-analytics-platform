import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { registerUser, loginUser } from "../services/auth.service.js";
import { apiResponse } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";

export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.issues[0].message, 400));
    }

    const result = await registerUser(parsed.data);

    res.status(201).json(
      apiResponse({
        success: true,
        message: "User registered successfully",
        data: result,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new AppError(parsed.error.issues[0].message, 400));
    }

    const result = await loginUser(parsed.data);

    res.status(200).json(
      apiResponse({
        success: true,
        message: "Login successful",
        data: result,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json(
      apiResponse({
        success: true,
        message: "Current user fetched successfully",
        data: req.user,
      })
    );
  } catch (error) {
    next(error);
  }
};