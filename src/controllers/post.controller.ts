import { PrismaClient } from "@prisma/client/extension";
import asyncHandler from "express-async-handler";

const prisma = new PrismaClient();

export const getPosts = asyncHandler(async (req, res, next) => {
  const posts = await prisma.post.findMany();

  res.json(posts);
});

export const getPostsById = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({
    where: { id },
  });

  res.json(post);
});

export const createPostByUserId = asyncHandler(async (req, res, next) => {
  const userId = Number(req.params.userId);
  const { title, content } = req.body;
  const post = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      posts: {
        create: [{ title, content }],
      },
    },
  });
});

export const updatePost = asyncHandler(async (req, res, next) => {});

export const deletePost = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const post = await prisma.post.delete({
    where: { id },
  });

  res.json(post);
});
