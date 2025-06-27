import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import { ApiError } from '../error/ApiError';
import { NotificationService } from '../services/notification.service';
import { Role } from '../models/enums/role.enum';
import { ContentStatus } from '../models/enums/content-status.enum';

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
        profileImage: true,
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
            profileImage: true,
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
  const { page = 1, limit = 10, search, sort = "createdAt", order = "desc" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = search ? {
    OR: [
      { username: { contains: search as string } },
      { fullName: { contains: search as string } },
      { email: { contains: search as string } }
    ]
  } : {};

  const orderBy = { [sort as string]: order as "asc" | "desc" };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy,
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
  const { page = 1, limit = 10, search = "", status = ContentStatus.ALL, sort = "createdAt", order = "desc" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    ...(search ? {
      OR: [
        { title: { contains: search as string } },
        { content: { contains: search as string } }
      ]
    } : {}),
    ...(status !== ContentStatus.ALL ? { status: status as ContentStatus } : {})
  };

  const orderBy = { [sort as string]: order as "asc" | "desc" };

  const [response, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            profileImage: true,
            username: true,
            fullName: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
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
      orderBy
    }),
    prisma.post.count({ where })
  ]);

  let posts = response.map(post => {
    return {
      ...post,
      comments: post._count.comments,
      likes: post._count.likes,
      reports: post.reports.length
    }
  });

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
      ...(status === ContentStatus.ARCHIVED && {
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

export const getAllPostReports = asyncHandler(async (req, res) => {
  const { postId, reporterId, postTitle, reporterUsername, page = 1, limit = 20, sort = "createdAt", order = "desc" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    commentId: null, // Only post reports, not comment reports
    ...(postId ? { postId: Number(postId) } : {}),
    ...(reporterId ? { userId: Number(reporterId) } : {}),
    ...(postTitle ? {
      post: {
        title: { contains: postTitle as string, mode: 'insensitive' }
      }
    } : {}),
    ...(reporterUsername ? {
      user: {
        username: { contains: reporterUsername as string, mode: 'insensitive' }
      }
    } : {})
  };

  let orderBy: any;
  if (sort === 'postTitle' || sort === 'reporterUsername') {
    orderBy = { createdAt: 'desc' as 'asc' | 'desc' };
  } else {
    orderBy = { [sort as string]: order as 'asc' | 'desc' };
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            }
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy
    }),
    prisma.report.count({ where })
  ]);

  let processedReports = reports.map(report => ({
    ...report,
    postTitle: report.post.title,
    reporterUsername: report.user.username
  }));

  // Handle sorting by nested fields after fetching
  if (sort === "postTitle") {
    processedReports.sort((a, b) => {
      const aValue = a.postTitle.toLowerCase();
      const bValue = b.postTitle.toLowerCase();
      
      if (order === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  } else if (sort === "reporterUsername") {
    processedReports.sort((a, b) => {
      const aValue = a.reporterUsername.toLowerCase();
      const bValue = b.reporterUsername.toLowerCase();
      
      if (order === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }

  res.json({
    reports: processedReports,
    total,
    pages: Math.ceil(total / Number(limit))
  });
});

export const getAdminComments = asyncHandler(async (req, res) => {
  const { search = '', status, page = 1, pageSize = 20, sort = "createdAt", order = "desc" } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);

  const where: any = {
    ...(status !== ContentStatus.ALL ? { status: status as ContentStatus } : {}),
    ...(search
      ? {
          OR: [
            { text: { contains: search, mode: 'insensitive' } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
            { post: { title: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  let orderBy: any;
  orderBy = { [sort as string]: order as "asc" | "desc" };

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
      orderBy,
    }),
    prisma.comment.count({ where }),
  ]);

  let processedComments = comments.map(comment => ({
    ...comment,
    reports: comment.reports
  }));

  res.json({ comments: processedComments, total });
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

export const getAllCommentReports = asyncHandler(async (req, res) => {
  const { commentId, reporterId, commentContent, reporterUsername, page = 1, limit = 20, sort = "createdAt", order = "desc" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {
    commentId: { not: null }, // Only comment reports, not post reports
    ...(commentId ? { commentId: Number(commentId) } : {}),
    ...(reporterId ? { userId: Number(reporterId) } : {}),
    ...(commentContent ? {
      comment: {
        text: { contains: commentContent as string, mode: 'insensitive' }
      }
    } : {}),
    ...(reporterUsername ? {
      user: {
        username: { contains: reporterUsername as string, mode: 'insensitive' }
      }
    } : {})
  };

  let orderBy: any;
  if (sort === 'commentContent' || sort === 'reporterUsername') {
    orderBy = { createdAt: 'desc' as 'asc' | 'desc' };
  } else {
    orderBy = { [sort as string]: order as 'asc' | 'desc' };
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        comment: {
          select: {
            id: true,
            text: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            },
            post: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy
    }),
    prisma.report.count({ where })
  ]);

  let processedReports = reports.map(report => ({
    ...report,
    commentContent: report.comment?.text || '',
    reporterUsername: report.user.username
  }));

  // Handle sorting by nested fields after fetching
  if (sort === "commentContent") {
    processedReports.sort((a, b) => {
      const aValue = a.commentContent.toLowerCase();
      const bValue = b.commentContent.toLowerCase();
      
      if (order === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  } else if (sort === "reporterUsername") {
    processedReports.sort((a, b) => {
      const aValue = a.reporterUsername.toLowerCase();
      const bValue = b.reporterUsername.toLowerCase();
      
      if (order === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }

  res.json({
    reports: processedReports,
    total,
    pages: Math.ceil(total / Number(limit))
  });
});
