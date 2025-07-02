import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { ApiError } from '../error/ApiError';
import type { ConnectionRequest } from '../models/connection.model';
import type {
  ConnectionUser,
  LoggedUser,
  UserProfile,
} from '../models/user-profile.model';
import { ConnectionStateEnum } from '../models/enums/connection-state.enum';
import { PrivacyOptions } from '../models/enums/privacy-optinos.enum';
import { Theme } from '../models/enums/theme.enum';
import type { Suggestion } from '../models/suggestion.model';
import nodemailer from 'nodemailer';
import type { Role } from '../models/enums/role.enum';

const mailPasscode = process.env.MAIL_PASSCODE;

const gmailTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'sabiadeaur@gmail.com',
    pass: mailPasscode,
  },
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
        orderBy: { createdAt: 'desc' },
      },
      following: {
        include: { follower: true },
      },
      follower: {
        include: { following: true },
      },
      settings: true,
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
          profileImage: value.following.profileImage,
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
          profileImage: value.follower.profileImage,
          username: value.follower.username,
          fullName: value.follower.fullName,
        };
        return connectionUser;
      }),
  ];

  const userResponse: UserProfile = {
    id: user.id,
    profileImage: user.profileImage,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    ...(user.gender ? { gender: user.gender } : {}),
    bio: user.bio,
    posts: user.posts,
    connections,
    ...(user.settings && { settings: user.settings }),
  };

  res.json(userResponse);
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
    data: {
      fullName,
      username,
      email,
      passwordHash,
      profileImage: '',
      ...(gender?.length && { gender }),
    },
  });

  await prisma.settings.create({
    data: {
      theme: theme || Theme.dark,
      language,
      detailsPrivacy: PrivacyOptions.public,
      connectionsPrivacy: PrivacyOptions.public,
      postsPrivacy: PrivacyOptions.public,
      userId: user.id,
    },
  });

  const userProfile: LoggedUser = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    theme: theme || Theme.dark,
    language,
    role: user.role as Role,
  };

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return next(ApiError.internal('JWT secret is not set'));
  }

  jwt.sign(userProfile, jwtSecret, { expiresIn: '2d' }, (err, token) => {
    if (err) return next(err);

    res.json({ token, userProfile });
  });
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

  await prisma.settings.upsert({
    where: {
      userId: user.id,
    },
    update: {
      theme: theme || Theme.dark,
      language,
    },
    create: {
      theme: theme || Theme.dark,
      language: language || 'en',
      detailsPrivacy: PrivacyOptions.public,
      connectionsPrivacy: PrivacyOptions.public,
      postsPrivacy: PrivacyOptions.public,
      userId: user.id,
    },
  });

  const userProfile: LoggedUser = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    theme: theme || Theme.dark,
    language,
    role: user.role as Role,
  };

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return next(ApiError.internal('JWT secret is not set'));
  }

  jwt.sign(userProfile, jwtSecret, { expiresIn: '2d' }, (err, token) => {
    if (err) {
      return next(err);
    }

    res.json({ token, userProfile });
  });
});

export const sendPasswordResetEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const resetJwtSecret = process.env.RESET_JWT_SECRET;

  if (!resetJwtSecret) {
    return next(ApiError.internal('Reset JWT secret is not set'));
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return next(ApiError.notFound('User not found'));
  }

  const token = jwt.sign({ userId: user.id }, resetJwtSecret, {
    expiresIn: '1h',
  });
  const resetLink = `${process.env.FE_URL}/reset-password/${token}`;

  await gmailTransporter.sendMail({
    from: 'SocialMediaApp <no-reply@socialmediapp.com',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>You requested a password reset. Click the button to reset your password:</p>
      <p>
        <a 
          style="background-color: #5696b9; border-radius: 20px; text-decoration: none; color: white; padding: 0.5rem 1rem;" 
          href="${resetLink}">
            Reset password
        </a>
      </p>
      <p style="margin-top: 1rem">If you did not request this, please ignore this email.</p>`,
  });

  res.json(null);
});

export const verifyResetToken = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const resetJwtSecret = process.env.RESET_JWT_SECRET;

  if (!resetJwtSecret) {
    return next(ApiError.internal('Reset JWT secret is not set'));
  }

  jwt.verify(token, resetJwtSecret, (err, decoded) => {
    if (err?.name === 'TokenExpiredError') {
      console.log('here');
      return next(ApiError.unauthorized('Password reset link has expired.'));
    }

    if (err) {
      console.log('or here');
      return next(ApiError.unauthorized('Password reset link is invalid.'));
    }

    res.json(decoded);
  });
})

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(ApiError.badRequest("Passwords don't match"));
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const user = await prisma.user.update({
    where: { id: +userId },
    data: { passwordHash },
  });

  res.json(user);
});

export const editProfile = asyncHandler(async (req, res, next) => {
  const { profileImage, fullName, email, bio, gender } = req.body;
  const user = await prisma.user.update({
    where: {
      id: parseInt(req.params.id),
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
  const id = parseInt(req.params.id);
  const searchString = req.body.searchString?.toLowerCase();

  const whereClause: any = {
    OR: [
      {
        followerId: id,
        following: searchString?.length
          ? {
              fullName: {
                contains: searchString,
                mode: 'insensitive',
              },
            }
          : undefined,
      },
      {
        followingId: id,
        follower: searchString?.length
          ? {
              fullName: {
                contains: searchString,
                mode: 'insensitive',
              },
            }
          : undefined,
      },
    ],
    pending: false,
  };

  const connections = await prisma.connection.findMany({
    where: whereClause,
    select: {
      follower: {
        select: {
          id: true,
          profileImage: true,
          fullName: true,
          username: true,
          email: true,
          bio: true,
          gender: true,
          createdAt: true,
          _count: {
            select: {
              follower: { where: { pending: false } },
              following: { where: { pending: false } },
              posts: true,
            },
          },
        },
      },
      following: {
        select: {
          id: true,
          profileImage: true,
          fullName: true,
          username: true,
          email: true,
          bio: true,
          gender: true,
          createdAt: true,
          _count: {
            select: {
              follower: { where: { pending: false } },
              following: { where: { pending: false } },
              posts: true,
            },
          },
        },
      },
      followerId: true,
      followingId: true,
      pending: true,
    },
  });

  let users = connections.map((conn) => {
    const user = conn.followerId === id ? conn.following : conn.follower;
    const connectionCount =
      (user._count?.follower || 0) + (user._count?.following || 0);
    const postsCount = user._count?.posts || 0;
    return {
      user: {
        ...user,
        connectionCount,
        postsCount,
      },
      userId: user.id,
      pending: conn.pending,
      connection: conn,
    };
  });

  res.json(users);
});

export const getConnectionRequests = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const connections = await prisma.connection.findMany({
    where: {
      followingId: id,
    },
    select: {
      follower: {
        select: {
          id: true,
          profileImage: true,
          fullName: true,
          username: true,
          email: true,
          gender: true,
          bio: true,
          createdAt: true, // ISO 8601 date string
          posts: true,
          following: true,
          follower: true,
        },
      },
      followerId: true,
      followingId: true,
      pending: true,
    },
  });

  const connectionRequests: ConnectionRequest[] = [
    ...connections
      .filter((connection) => connection.pending)
      .map((connection) => {
        return {
          user: connection.follower,
          userId: connection.followerId,
          connectionId: connection.followingId,
        };
      }),
  ];

  res.json(connectionRequests);
});

export const getSuggestions = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.id);
  const searchString = req.body.searchString?.toLowerCase();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      profileImage: true,
      fullName: true,
      username: true,
      email: true,
      gender: true,
      bio: true,
      createdAt: true, // ISO 8601 date string
      posts: true,
      following: {
        select: {
          follower: true,
          followerId: true,
          following: true,
          followingId: true,
          pending: true,
        },
      },
      follower: {
        select: {
          follower: true,
          followerId: true,
          following: true,
          followingId: true,
          pending: true,
        },
      },
    },
  });

  const connections: number[] = [id];
  const followingConnections = await prisma.connection.findMany({
    where: {
      followingId: id,
      pending: false,
    },
    select: {
      followerId: true,
    },
  });
  connections.push(...followingConnections.map((data) => data.followerId));

  const followedByConnections = await prisma.connection.findMany({
    where: {
      followerId: id,
      pending: false,
    },
    select: {
      followingId: true,
    },
  });
  connections.push(...followedByConnections.map((data) => data.followingId));

  let suggestions;

  if (searchString?.length) {
    suggestions = users.filter(
      (user) =>
        !connections.includes(user.id) &&
        user.fullName.toLowerCase().includes(searchString)
    );
  } else {
    suggestions = users.filter((user) => !connections.includes(user.id));
  }

  const suggestionsList: Suggestion[] = suggestions.map((user) => {
    let connectionState = ConnectionStateEnum.ADD;
    let connection = user.follower.find((value) => value.followingId === id);
    if (connection) {
      connectionState = ConnectionStateEnum.ACCEPT;
    } else {
      connection = user.following.find((value) => value.followerId === id);

      if (connection) {
        connectionState = ConnectionStateEnum.REQUEST;
      }
    }

    const suggestion: Suggestion = {
      user: user,
      connection: connection,
      connectionState,
    };
    return suggestion;
  });

  res.json(suggestionsList);
});

export const getConnectionState = asyncHandler(async (req, res, next) => {
  const id = Number(req.params.userId);
  const connectionId = Number(req.params.connectionId);

  let connectionState = ConnectionStateEnum.ADD;
  let isFollowedBy = false;
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

    if (connection) isFollowedBy = true;
  }

  if (isFollowedBy && connection?.pending) {
    connectionState = ConnectionStateEnum.ACCEPT;
  } else if (connection?.pending) {
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
        followerId: id,
        followingId: connectionId,
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

export const getAllConnections = asyncHandler(async (req, res, next) => {
  const connections = await prisma.connection.findMany();
  res.json(connections);
});

export const updateSettings = asyncHandler(async (req, res, next) => {
  const { language, theme, detailsPrivacy, connectionsPrivacy, postsPrivacy } =
    req.body;
  const userId = Number(req.params.userId);

  const settings = await prisma.settings.upsert({
    where: {
      userId,
    },
    update: { language, theme, detailsPrivacy, connectionsPrivacy, postsPrivacy },
    create: {
      language: language || 'en',
      theme: theme || Theme.dark,
      detailsPrivacy: detailsPrivacy || PrivacyOptions.public,
      connectionsPrivacy: connectionsPrivacy || PrivacyOptions.public,
      postsPrivacy: postsPrivacy || PrivacyOptions.public,
      userId,
    },
  });

  res.json(settings);
});

export const getSettings = asyncHandler(async (req, res, next) => {
  const userId = Number(req.params.userId);
  let settings = await prisma.settings.findUnique({
    where: {
      userId,
    },
  });

  if (!settings) {
    // Create default settings if they don't exist
    settings = await prisma.settings.create({
      data: {
        language: 'en',
        theme: Theme.dark,
        detailsPrivacy: PrivacyOptions.public,
        connectionsPrivacy: PrivacyOptions.public,
        postsPrivacy: PrivacyOptions.public,
        userId,
      },
    });
  }

  res.json(settings);
});
