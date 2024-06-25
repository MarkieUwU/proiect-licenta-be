import asyncHandler from "express-async-handler";
import { prisma } from "../server";
import jwt, { verify } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ApiError } from "../error/ApiError";

const jwtSecret = String(process.env.JWT_SECRET);

export const getUsersList = asyncHandler(async (req, res, next) => {
  const { nr } = req.query;

  const users = await prisma.user.findMany({
    take: Number(nr) || 999,
  });

  res.json(users);
});

export const getFilteredUsers = asyncHandler(async (req, res, next) => {
  const { cursor, limit = 10, search = "" } = req.query;
  const searchString = String(search);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: searchString, mode: "insensitive" } },
        { fullName: { contains: searchString, mode: "insensitive" } },
        { email: { contains: searchString, mode: "insensitive" } },
      ],
    },
    cursor: cursor ? { id: Number(cursor) } : undefined,
    skip: cursor ? 1 : 0,
    take: Number(limit),
    orderBy: { username: "asc" },
  });

  res.json(users);
});

export const getUserData = asyncHandler(async (req, res, next) => {
  const { id, username } = req.body;
  let user = null;

  if (id) {
    user = await prisma.user.findUnique({
      where: { id },
    });
  }

  if (username) {
    user = await prisma.user.findUnique({
      where: { username },
    });
  }

  if (!user) {
    next(ApiError.notFound("User not found"));
    return;
  }

  res.json(user);
});

export const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, username, email, password } = req.body;

  const [verifyEmail, verifyUsername] = await Promise.all([
    prisma.user.findFirst({
      where: { email },
      select: { email: true },
    }),
    prisma.user.findFirst({
      where: { username },
      select: { username: true },
    }),
  ]);

  if (verifyEmail?.email && verifyUsername?.username) {
    return next(ApiError.badRequest("Both username and email already exist!"));
  }

  if (verifyEmail?.email) {
    return next(ApiError.badRequest("Email already exists!"));
  }

  if (verifyUsername?.username) {
    return next(ApiError.badRequest("Username already exists!"));
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const user = await prisma.user.create({
    data: { fullName, username, email, passwordHash },
  });

  const payload = {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
  };

  jwt.sign(payload, jwtSecret, { expiresIn: "2d" }, (err, token) => {
    if (err) return next(err);

    res.json({ token });
  });
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { username },
  });

  if (!user) {
    next(ApiError.unauthorized());
    return;
  } else {
    const payload = {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    };
    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);

    if (!passwordMatch) {
      return next(ApiError.unauthorized());
    }

    jwt.sign(payload, jwtSecret, { expiresIn: "2d" }, (err, token) => {
      if (err) return next(err);

      res.json({ token });
    });
  }
});

export const editProfile = asyncHandler(async (req, res, next) => {
  const { fullName, email, bio } = req.body;
  const user = await prisma.user.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: { fullName, email, bio },
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
