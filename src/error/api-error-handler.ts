import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./ApiError";
import { ApiResponse } from "../utils/ApiResponse";

export const apiErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err); // Log the error for debugging

  if (err instanceof ApiError) {
    // Use the ApiResponse utility to handle localized error messages
    return ApiResponse.error(req, res, err, err.code);
  } else {
    // For unexpected errors
    return ApiResponse.error(req, res, { 
      message: "Internal Server Error",
      translationKey: "errors.internalServerError"
    }, 500);
  }
};
