import { ApiError } from "../error/ApiError";
import { prisma } from "../server";
import asyncHandler from "express-async-handler";

export const addCommentToPost = asyncHandler(async (req, res, next) => {
  const postId = Number(req.params.postId);
  const { text, userId } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      fullName: true
    }
  });

  if (user) {
    const comment = await prisma.comment.create({
    data: { postId: Number(postId), userId, text, author: user.fullName },
  });
    res.json(comment);
  } else {
    next(ApiError.notFound('User not found'));
  }
});

export const updateComment = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { text } = req.body;
  const comment = await prisma.comment.update({
    where: { id },
    data: { text, isEdited: true },
  });
  res.json(comment);
});

export const deleteComment = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const comment = await prisma.comment.delete({
    where: { id },
  });
  res.json(comment);
});

export const getPostComments = asyncHandler(async (req, res, next) => {
  const postId = Number(req.params.postId);
  const comments = await prisma.comment.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: { postId },
  });
  res.json(comments);
});

export const getAllComments = asyncHandler(async (req, res, next) => {
  const comments = await prisma.comment.findMany();
  res.json(comments);
})
