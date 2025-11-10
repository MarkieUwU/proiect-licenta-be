import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./ApiError";

export const apiErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof ApiError) {
    res.status(err.code).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
