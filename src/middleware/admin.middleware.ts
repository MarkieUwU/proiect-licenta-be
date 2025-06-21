import { ApiError } from '../error/ApiError';
import { Role } from '../models/enums/role.enum';
import expressAsyncHandler from 'express-async-handler';

export const adminMiddleware = expressAsyncHandler((req, res, next) => {
  const user = req.user as { role: Role };
  
  if (!user || user.role !== Role.ADMIN) {
    return next(ApiError.forbidden('Admin access required'));
  }
  
  next();
});
