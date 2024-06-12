import { prisma } from "../../server";
import asyncHandler from "express-async-handler";

export const createLikeOnPost = asyncHandler(async (req, res, next) => {
  const { userId, postId } = req.body;
  const like = await prisma.like.create({
    data: { postId, userId },
  });
  res.json(like);
});

export const deleteLike = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const like = await prisma.like.delete({
    where: { id },
  });
  res.json(like);
});
