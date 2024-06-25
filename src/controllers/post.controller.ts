import asyncHandler from "express-async-handler";
import { prisma } from "../server";

export const getAllPosts = asyncHandler(async (req, res, next) => {
  const posts = await prisma.post.findMany({
    include: {
      user: true,
      comments: true,
      likes: true,
    },
  });

  res.json(posts);
});

export const getPostById = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({
    where: { id },
  });

  res.json(post);
});

export const getPostComments = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const comments = await prisma.post.findUnique({
    where: { id },
    select: { comments: true },
  });
  res.json(comments);
});

export const getPostLikes = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const likes = await prisma.post.findUnique({
    where: { id },
    select: { likes: true },
  });
  res.json(likes);
});

export const createPostByUserId = asyncHandler(async (req, res, next) => {
  const userId = Number(req.params.userId);
  const { content } = req.body;
  const post = await prisma.post.create({
    data: { content, userId },
  });
  res.json(post);
});

export const updatePost = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const { content } = req.body;
  const post = prisma.post.update({
    data: { content },
    where: { id },
  });
  res.json;
});

export const deletePost = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const post = await prisma.post.delete({
    where: { id },
  });

  res.json(post);
});
