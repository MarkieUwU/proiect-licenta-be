import { ApiError } from "../error/ApiError";
import { prisma } from "../server";
import asyncHandler from "express-async-handler";
import { NotificationService } from "../services/notification.service";

export const getAllLikes = asyncHandler(async (req, res, next) => {
  const likes = await prisma.like.findMany();
  res.json(likes);
})

export const getIfLiked = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { postId } = req.query;
  const like = await prisma.like.findFirst({
    where: {
      AND: [{ userId: Number(userId) }, { postId: Number(postId) }],
    },
  });

  res.json(!!like);
});

export const createLikeOnPost = asyncHandler(async (req, res, next) => {
  const { userId, postId } = req.body;
  const like = await prisma.like.create({
    data: { postId, userId },
  });

  // Send notification to post owner
  await NotificationService.notifyPostLiked(postId, userId);

  res.json(like);
});

export const deleteLike = asyncHandler(async (req, res, next) => {
  const { userId, postId } = req.query;
  const like = await prisma.like.findFirst({
    where: {
      AND: [{ userId: Number(userId) }, { postId: Number(postId) }],
    },
  });

  if (!like) return next(ApiError.notFound("Something wrong happened"));

  const deletedLike = await prisma.like.delete({
    where: { id: like.id },
  });

  res.json(deletedLike);
});
