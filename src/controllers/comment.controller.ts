import { prisma } from "../server";
import asyncHandler from "express-async-handler";

export const addCommentToPost = asyncHandler(async (req, res, next) => {
  const postId = Number(req.params.postId);
  const { author, text, userId } = req.body;
  const comment = await prisma.comment.create({
    data: { postId: Number(postId), userId, text, author },
  });
  res.json(comment);
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
