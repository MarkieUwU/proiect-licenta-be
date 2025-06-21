import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import { ApiError } from '../error/ApiError';
import { NotificationService } from '../services/notification.service';
import { Role } from '../models/enums/role.enum';
import { PostStatus } from '../models/enums/post-status.enum';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalPosts,
    totalConnections,
    recentUsers,
    recentPosts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.connection.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        createdAt: true
      }
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    })
  ]);

  res.json({
    totalUsers,
    totalPosts,
    totalConnections,
    recentUsers,
    recentPosts
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = search ? {
    OR: [
      { username: { contains: search as string } },
      { fullName: { contains: search as string } },
      { email: { contains: search as string } }
    ]
  } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            follower: true,
            following: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    users,
    total,
    pages: Math.ceil(total / Number(limit))
  });
});

export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!Object.values(Role).includes(role)) {
    return next(ApiError.badRequest('Invalid role'));
  }

  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { role },
    select: {
      id: true,
      username: true,
      role: true
    }
  });

  res.json(user);
});

export const getAdminPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", status = PostStatus.ALL } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    ...(search ? {
      OR: [
        { title: { contains: search as string } },
        { content: { contains: search as string } }
      ]
    } : {}),
    ...(status !== PostStatus.ALL ? { status: status as PostStatus } : {})
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        likes: true,
        comments: true,
        reports: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" }
    }),
    prisma.post.count({ where })
  ]);

  res.json({
    posts,
    pages: Math.ceil(total / Number(limit)),
    total
  });
});

export const updatePostStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const post = await prisma.post.update({
    where: { id: Number(id) },
    data: { 
      status,
      ...(status === PostStatus.ARCHIVED && {
        updatedAt: new Date()
      })
    },
    include: {
      user: true,
      likes: true,
      comments: true,
      reports: true
    }
  });

  await NotificationService.notifyPostStatusChange(post.id, status, reason);

  res.json(post);
});

export const getPostReports = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const reports = await prisma.report.findMany({
    where: { postId: Number(postId) },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(reports);
});

export const getAdminComments = asyncHandler(async (req, res) => {
  const { search = '', status, page = 1, pageSize = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);

  const where: any = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { content: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { post: { title: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        post: { select: { id: true, title: true } },
        reports: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        }
      },
      skip,
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.count({ where }),
  ]);

  res.json({ comments, total });
});

export const updateCommentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const comment = await prisma.comment.update({
    where: { id: Number(id) },
    data: { status },
  });

  // TODO: Notify user if needed

  res.json(comment);
});

export const getCommentReports = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reports = await prisma.report.findMany({
    where: { commentId: Number(id) },
    include: { user: { select: { id: true, username: true } } },
  });
  res.json(reports);
});
