import { prisma } from '../server';
import asyncHandler from 'express-async-handler';
import { NotificationService } from '../services/notification.service';

export const reportPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const report = await prisma.report.create({
    data: { reason, userId, postId: Number(postId) }
  });

  // Send notification to post owner and admins
  await NotificationService.notifyPostReported(Number(postId), report.id);

  res.status(201).json(report);
});

export const reportComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  // Fetch the comment to get its postId
  const comment = await prisma.comment.findUnique({
    where: { id: Number(commentId) },
    select: { postId: true }
  });
  if (!comment) {
    return next(new Error('Comment not found'));
  }

  const report = await prisma.report.create({
    data: { reason, userId, postId: comment.postId, commentId: Number(commentId) }
  });

  // Send notification to comment owner and admins
  await NotificationService.notifyPostReported(comment.postId, report.id);

  res.status(201).json(report);
}); 