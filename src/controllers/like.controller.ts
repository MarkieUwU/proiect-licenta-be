import { ApiError } from "../error/ApiError";
import { prisma } from "../server";
import asyncHandler from "express-async-handler";
import { NotificationService } from "../services/notification.service";

export const createLikeOnPost = asyncHandler(async (req, res, next) => {
  const { userId, postId } = req.body;
  const like = await prisma.like.create({
    data: { postId, userId },
  });

  await NotificationService.notifyPostLiked(postId, userId);

  res.json(like);
});

export const deleteLike = asyncHandler(async (req, res, next) => {
  const { userId, postId } = req.query;
  const like = await prisma.like.findFirst({
    where: {
      AND: [{ userId: userId as string }, { postId: postId as string }],
    },
  });

  if (!like) return next(ApiError.notFound("Something wrong happened"));

  const deletedLike = await prisma.like.delete({
    where: { id: like.id },
  });

  res.json(deletedLike);
});
