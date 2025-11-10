import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ApiError } from '../error/ApiError';
import type {
  LoggedUser,
  SettingsRequest,
  UserProfile,
  UserSettings,
} from '../models/user.model';
import { Theme } from '../models/enums/theme.enum';
import type { Role } from '../models/enums/role.enum';
import { ConnectionService } from '../services/connection.service';
import { UserService } from '../services/user.service';
import { PostService } from '../services/post.service';

export const getUserProfile = asyncHandler(async (req, res, next) => {
  const { username } = req.body;
  const userDetails = await UserService.getUserProfile(username);

  if (!userDetails) {
    next(ApiError.notFound('User not found'));
    return;
  }

  const [posts, connections] = await Promise.all([
    PostService.getPosts(userDetails.id),
    ConnectionService.getConnections(userDetails.id, '', 6),
  ]);

  const response: UserProfile = {
    ...userDetails,
    posts,
    connections: connections.map((con) => con.user),
  };

  res.json(response);
});

export const getUserProfileImage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await prisma.user.findFirst({
    where: { id },
    select: { profileImage: true },
  });

  res.json(user?.profileImage);
});

export const registerUser = asyncHandler(async (req, res, next) => {
  const {
    fullName,
    username,
    email,
    password,
    gender,
    confirmPassword,
    theme,
    language,
  } = req.body;

  const exinstingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (exinstingUser) {
    return next(ApiError.badRequest('User already exists!'));
  }

  if (password !== confirmPassword) {
    return next(ApiError.badRequest("Passwords don't match"));
  }

  const request = {
    fullName,
    username,
    email,
    password,
    gender,
    confirmPassword,
    theme,
    language,
  };
  const registerResponse = await UserService.registerUser(request);

  res.json(registerResponse);
});

export const loginUser = asyncHandler(async (req, res, next) => {
  const { username, password, theme, language } = req.body;
  let user;

  user = await prisma.user.findFirst({
    where: { username },
  });

  if (!user) {
    return next(ApiError.unauthorized('Username or password is incorrect'));
  }

  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);

  if (!passwordMatch) {
    return next(ApiError.unauthorized('Username or password is incorrect'));
  }

  await UserService.upsertSettings(user.id, { theme, language });

  const loggedUser: LoggedUser = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    theme: theme || Theme.dark,
    language,
    role: user.role as Role,
  };
  const token = UserService.getJWTToken(loggedUser);

  res.json({ token, loggedUser });
});

export const sendPasswordResetEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  await UserService.sendPasswordResetEmail(user.id, email);

  res.json(null);
});

export const verifyResetToken = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const resetJwtSecret = process.env.RESET_JWT_SECRET;

  jwt.verify(token, resetJwtSecret!, (err, decoded) => {
    if (err?.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Password reset link has expired.'));
    }

    if (err) {
      return next(ApiError.unauthorized('Password reset link is invalid.'));
    }

    res.json(decoded);
  });
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(ApiError.badRequest("Passwords don't match"));
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  res.json(user);
});

export const editProfile = asyncHandler(async (req, res, next) => {
  const { profileImage, fullName, email, bio, gender } = req.body;
  const user = await prisma.user.update({
    where: {
      id: req.params.id,
    },
    data: {
      profileImage,
      fullName,
      email,
      bio,
      ...(gender?.length && { gender }),
    },
  });

  res.json(user);
});

export const getConnections = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const searchString = req.body.searchString;
  const connections = await ConnectionService.getConnections(id, searchString);

  res.json(connections);
});

export const getConnectionRequests = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const connectionRequests = await ConnectionService.getConnectionRequests(id);

  res.json(connectionRequests);
});

export const getSuggestions = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const searchString = req.body.searchString?.toLowerCase();
  const suggestions = await ConnectionService.getSuggestions(id, searchString);

  res.json(suggestions);
});

export const getConnectionState = asyncHandler(async (req, res, next) => {
  const id = req.params.userId;
  const connectionId = req.params.connectionId;
  const connectionState = await ConnectionService.getConnectionState(
    id,
    connectionId
  );

  res.json(connectionState);
});

export const requestForConnection = asyncHandler(async (req, res, next) => {
  const id = req.params.userId;
  const connectionId = req.params.connectionId;

  const existingConnection = await prisma.connection.findFirst({
    where: {
      OR: [
        { followerId: id, followingId: connectionId },
        { followerId: connectionId, followingId: id },
      ],
    },
  });

  if (existingConnection) {
    return next(ApiError.badRequest('Connection already exists'));
  }

  const connection = await prisma.connection.create({
    data: { followerId: id, followingId: connectionId, pending: true },
  });

  res.json(connection);
});

export const acceptConnection = asyncHandler(async (req, res, next) => {
  const id = req.params.userId;
  const connectionId = req.params.connectionId;

  const connection = await prisma.connection.updateMany({
    where: {
      followerId: id,
      followingId: connectionId,
      pending: true,
    },
    data: { pending: false },
  });

  if (!connection.count) {
    return next(ApiError.notFound('Connection not found'));
  }

  res.json();
});

export const removeConnection = asyncHandler(async (req, res, next) => {
  const id = req.params.userId;
  const connectionId = req.params.connectionId;

  const existingConnection = await prisma.connection.findFirst({
    where: {
      OR: [
        { followerId: id, followingId: connectionId },
        { followerId: connectionId, followingId: id },
      ],
    },
  });

  if (!existingConnection) {
    return next(ApiError.notFound('Connection not found'));
  }

  const connection = await prisma.connection.delete({
    where: {
      id: existingConnection.id,
    },
  });
  res.json(connection);
});

export const getAllConnections = asyncHandler(async (req, res, next) => {
  const connections = await prisma.connection.findMany();
  res.json(connections);
});

export const updateSettings = asyncHandler(async (req, res, next) => {
  const { language, theme, detailsPrivacy, connectionsPrivacy, postsPrivacy } =
    req.body;
  const userId = req.params.userId;
  const request: SettingsRequest = {
    language,
    theme,
    detailsPrivacy,
    connectionsPrivacy,
    postsPrivacy,
  };

  const settings = await UserService.upsertSettings(userId, request);

  res.json(settings);
});

export const getSettings = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;
  const settings = await prisma.settings.findUnique({
    where: {
      userId,
    },
  });
  let response: UserSettings;

  if (settings) {
    response = {
      theme: settings.theme,
      language: settings.language,
      detailsPrivacy: settings.detailsPrivacy,
      connectionsPrivacy: settings.connectionsPrivacy,
      postsPrivacy: settings.postsPrivacy,
    };
  } else {
    response = await UserService.upsertSettings(userId);
  }

  res.json(response);
});
