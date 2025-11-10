import { prisma } from '../server';
import asyncHandler from 'express-async-handler';
import { NotificationService } from '../services/notification.service';

export const reportPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const report = await prisma.report.create({
    data: { reason, userId, postId }
  });

  await NotificationService.notifyPostReported(postId, report.id);

  res.status(201).json(report);
});

export const reportComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const report = await prisma.report.create({
    data: { reason, userId, commentId }
  });

  await NotificationService.notifyCommentReported(commentId, report.id);

  res.status(201).json(report);
}); 