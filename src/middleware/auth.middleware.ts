import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { ApiError } from "../error/ApiError";
import type { LoggedUser } from "../models/user.model";
import { prisma } from "../server";
import type { Role } from "../models/enums/role.enum";

declare global {
  namespace Express {
    interface Request {
      user: LoggedUser;
    }
  }
}

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const jwtSecret = process.env.JWT_SECRET;

  if (!token || !jwtSecret) {
    return next(ApiError.unauthorized("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as LoggedUser;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true }
    });

    if (!user) {
      return next(ApiError.unauthorized("User no longer exists"));
    }

    req.user = {
      ...decoded,
      role: user.role as Role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized("Token expired"));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized("Invalid token"));
    }
    next(ApiError.unauthorized("Authentication failed"));
  }
});
