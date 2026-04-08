import { apiResponse } from "../utils/apiResponse.js";

export const errorMiddleware = (err, req, res, next) => {
  console.error("========== ERROR START ==========");
  console.error(err);
  console.error("========== ERROR END ==========");

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json(
    apiResponse({
      success: false,
      message: err.message || "Internal Server Error",
      data: null,
    })
  );
};