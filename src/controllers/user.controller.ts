import asyncHandler from "express-async-handler";
import { prisma } from "../../server";

export const getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await prisma.user.findMany();

  res.json(users);
});

export const getUserById = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({
    where: { id },
  });

  res.json(user);
});

export const createUser = asyncHandler(async (req, res, next) => {
  const { userName, email } = req.body;
  const user = await prisma.user.create({
    data: { userName, email },
  });

  res.json(user);
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { userName, email } = req.body;
  const user = await prisma.user.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: { userName, email },
  });

  res.json(user);
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const userId = Number(req.params.id);
  const user = await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  res.json(user);
});

export const getUserPosts = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const posts = await prisma.user.findUnique({
    where: { id },
    select: {
      posts: true,
    },
  });
  res.json(posts);
});
