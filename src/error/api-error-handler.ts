import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./ApiError";
import { Prisma } from "@prisma/client";

export const apiErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof ApiError) {
    res.status(err.code).json(err.message);
    return;
  }

  res.status(500).json("Internal Server Error");
};
