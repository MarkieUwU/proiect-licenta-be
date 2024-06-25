import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./ApiError";
import { Prisma } from "@prisma/client";

export const prismaErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = err.meta?.target as string;
      next(ApiError.badRequest(`A record with this ${field} already exists.`));
    }

    if (err.code === "P2025") {
      next(ApiError.notFound("The record requested was not found"));
    }
  }

  next(err);
};
