import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { ApiError } from "../error/ApiError";

export const jwtDecoder = asyncHandler((req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) {
    next(ApiError.unauthorized());
  } else {
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        next(ApiError.unauthorized());
      } else {
        // req.userData = decoded;
      }
    });
  }
});
