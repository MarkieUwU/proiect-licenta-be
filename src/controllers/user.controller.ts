import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ApiError } from '../error/ApiError';
import type { UserConnection } from '../models/connection.model';
import type { ConnectionUser, UserProfile } from '../models/user-profile.model';
import { ConnectionStateEnum } from '../models/connection-state.enum';
import type { Connection } from '@prisma/client';

const jwtSecret = String(process.env.JWT_SECRET);

export const getUsersList = asyncHandler(async (req, res, next) => {
  const { nr } = req.query;

  const users = await prisma.user.findMany({
    take: Number(nr) || 999,
  });

  res.json(users);
});

export const getFilteredUsers = asyncHandler(async (req, res, next) => {
  const { cursor, limit = 10, search = '' } = req.query;
  const searchString = String(search);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: searchString, mode: 'insensitive' } },
        { fullName: { contains: searchString, mode: 'insensitive' } },
        { email: { contains: searchString, mode: 'insensitive' } },
      ],
    },
    cursor: cursor ? { id: Number(cursor) } : undefined,
    skip: cursor ? 1 : 0,
    take: Number(limit),
    orderBy: { username: 'asc' },
  });

  res.json(users);
});

export const getUserDetails = asyncHandler(async (req, res, next) => {
  const { username } = req.body;
  let user = null;

  user = await prisma.user.findUnique({
    where: {
      username,
    },
    include: {
      posts: {
        include: { user: true, comments: true, likes: true },
      },
      following: {
        include: { follower: true },
      },
      follower: {
        include: { following: true },
      },
    },
  });

  if (!user) {
    next(ApiError.notFound('User not found'));
    return;
  }

  const connections: ConnectionUser[] = [
    ...user.follower
      .filter((value) => !value.pending)
      .map((value) => {
        const connectionUser: ConnectionUser = {
          id: value.following.id,
          username: value.following.username,
          fullName: value.following.fullName,
        };
        return connectionUser;
      }),
    ...user.following
      .filter((value) => !value.pending)
      .map((value) => {
        const connectionUser: ConnectionUser = {
          id: value.follower.id,
          username: value.follower.username,
          fullName: value.follower.fullName,
        };
        return connectionUser;
      }),
  ];

  const userResponse: UserProfile = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    bio: user.bio,
    posts: user.posts,
    connections,
  };

  res.json(userResponse);
});

export const registerUser = asyncHandler(async (req, res, next) => {
  const { fullName, username, email, password, confirmPassword } = req.body;

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
    return next(ApiError.badRequest('Both username and email already exist!'));
  }

  if (verifyEmail?.email) {
    return next(ApiError.badRequest('Email already exists!'));
  }

  if (verifyUsername?.username) {
    return next(ApiError.badRequest('Username already exists!'));
  }

  if (password !== confirmPassword) {
    return next(ApiError.badRequest("Passwords don't match"));
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

  jwt.sign(payload, jwtSecret, { expiresIn: '2d' }, (err, token) => {
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
    return next(ApiError.unauthorized('Username or password is incorrect'));
  }

  const payload = {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
  };
  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);

  if (!passwordMatch) {
    return next(ApiError.unauthorized('Username or password is incorrect'));
  }

  jwt.sign(payload, jwtSecret, { expiresIn: '2d' }, (err, token) => {
    if (err) {
      return next(err);
    }

    res.json({ token });
  });
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

export const getConnections = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);
  const searchString = req.body.searchString?.toLowerCase();
  let connections: UserConnection[] = [];
  const followingConnections = await prisma.connection.findMany({
    where: {
      followerId: id,
    },
    select: {
      following: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          bio: true,
          createdAt: true, // ISO 8601 date string
          posts: true,
          following: true,
          follower: true,
        },
      },
      followingId: true,
      follower: true,
      followerId: true,
      pending: true,
    },
  });
  connections.push(
    ...followingConnections.map((value) => {
      return {
        user: value.following,
        userId: value.followingId,
        pending: value.pending,
        connection: value,
      };
    })
  );

  const followedByConnections = await prisma.connection.findMany({
    where: {
      followingId: id,
    },
    select: {
      follower: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          bio: true,
          createdAt: true, // ISO 8601 date string
          posts: true,
          following: true,
          follower: true,
        },
      },
      followerId: true,
      following: true,
      followingId: true,
      pending: true,
    },
  });

  connections.push(
    ...followedByConnections.map((value) => {
      return {
        user: value.follower,
        userId: value.followerId,
        pending: value.pending,
        connection: value,
      };
    })
  );

  if (searchString?.length) {
    connections = connections.filter((connection) =>
      connection.user.fullName?.toLowerCase().includes(searchString)
    );
  }

  res.json(connections);
});

export const getSuggestions = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      bio: true,
      createdAt: true, // ISO 8601 date string
      posts: true,
      following: true,
      follower: true,
    },
  });

  const connections: number[] = [id];
  const followingConnections = await prisma.connection.findMany({
    where: {
      followingId: id,
    },
    select: {
      followerId: true,
    },
  });
  connections.push(...followingConnections.map((data) => data.followerId));

  const followedByConnections = await prisma.connection.findMany({
    where: {
      followerId: id,
    },
    select: {
      followingId: true,
    },
  });
  connections.push(...followedByConnections.map((data) => data.followingId));

  const suggestions = users.filter((user) => !connections.includes(user.id));

  res.json(suggestions);
});

export const getConnectionState = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.userId);
  const connectionId = Number(req.params.connectionId);
  let connectionState = ConnectionStateEnum.ADD;
  let connection = await prisma.connection.findUnique({
    where: {
      followingId_followerId: {
        followerId: id,
        followingId: connectionId,
      },
    },
  });

  if (!connection) {
    connection = await prisma.connection.findUnique({
      where: {
        followingId_followerId: {
          followerId: connectionId,
          followingId: id,
        },
      },
    });
  }

  if (connection?.pending) {
    connectionState = ConnectionStateEnum.REQUEST;
  } else if (connection) {
    connectionState = ConnectionStateEnum.CONNECTED;
  }

  const result = {
    connection: connection,
    connectionState: connectionState,
  };

  res.json(result);
});

export const requestForConnection = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.userId);
  const connectionId = Number(req.params.connectionId);
  const connection = await prisma.connection.create({
    data: { followerId: id, followingId: connectionId, pending: true },
  });

  res.json(connection);
});

export const acceptConnection = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.userId);
  const connectionId = Number(req.params.connectionId);
  const connection = await prisma.connection.update({
    where: {
      followingId_followerId: {
        followingId: id,
        followerId: connectionId,
      },
    },
    data: { pending: false },
  });

  res.json(connection);
});

export const removeConnection = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.userId);
  const connectionId = Number(req.params.connectionId);
  const connection = await prisma.connection.delete({
    where: {
      followingId_followerId: {
        followerId: id,
        followingId: connectionId,
      },
    },
  });
  res.json(connection);
});
