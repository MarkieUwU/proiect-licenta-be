import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { ApiError } from "../error/ApiError";

export const validateRequestSchema = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(ApiError.badRequest());
    return;
  }

  next();
};
