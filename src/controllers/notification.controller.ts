import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import { ApiError } from '../error/LocalizedApiError';
import { ApiResponse } from '../utils/ApiResponse';

export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.notification.count({
      where: { userId },
    }),
  ]);

  res.json({
    notifications,
    pages: Math.ceil(total / Number(limit)),
    total,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.update({
    where: {
      id: Number(notificationId),
      userId, // Ensure user owns the notification
    },
    data: { read: true },
  });

  res.json(notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  ApiResponse.operationCompleted(req, res);
});

export const deleteNotification = asyncHandler(async (req, res, next) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  // First check if the notification exists and belongs to the user
  const notification = await prisma.notification.findFirst({
    where: {
      id: Number(notificationId),
      userId,
    },
  });

  if (!notification) {
    return next(ApiError.notificationNotFound());
  }

  // Only allow deletion of read notifications
  if (!notification.read) {
    return next(ApiError.cannotDeleteUnreadNotifications());
  }

  await prisma.notification.delete({
    where: {
      id: Number(notificationId),
    },
  });

  ApiResponse.notificationDeleted(req, res);
}); 