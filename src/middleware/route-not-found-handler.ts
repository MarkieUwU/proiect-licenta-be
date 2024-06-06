import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../error/ApiError";

export const routeNotFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(ApiError.notFound("Endpoint not found"));
};
