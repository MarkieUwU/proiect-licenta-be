import { PrismaClient, type User } from "@prisma/client";
import asyncHandler from "express-async-handler";

const prisma = new PrismaClient();

export const getUsers = asyncHandler(async (req, res, next) => {
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
  const { name, email } = req.body;
  const user = await prisma.user.create({
    data: { name, email },
  });

  res.json(user);
});

export const updateUser = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  const user = await prisma.user.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: { name, email },
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
