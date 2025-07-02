import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import { ApiError } from '../error/ApiError';
import { NotificationService } from '../services/notification.service';
import { Role } from '../models/enums/role.enum';
import { ContentStatus } from '../models/enums/content-status.enum';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalPosts,
    totalConnections,
    totalLikes,
    totalComments,
    totalReports,
    recentUsers,
    recentPosts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.connection.count(),
    prisma.like.count(),
    prisma.comment.count(),
    prisma.report.count(),
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

  // User and post growth by month for last 5 months
  const now = new Date();
  const userGrowth = [];
  const postGrowth = [];
  for (let i = 5; i >= 1; i--) {
    const monthStart = startOfMonth(subMonths(now, i - 1));
    const monthEnd = endOfMonth(subMonths(now, i - 1));
    const [userCount, postCount] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })
    ]);
    userGrowth.push({
      name: format(monthStart, 'MMM'),
      users: userCount
    });
    postGrowth.push({
      name: format(monthStart, 'MMM'),
      posts: postCount
    });
  }

  // Rolling 3-month average popularity growth rate (users + posts)
  let avgPopularityGrowthRate = null;
  if (userGrowth.length >= 4 && postGrowth.length >= 4) {
    let rates = [];
    for (let i = userGrowth.length - 3; i < userGrowth.length; i++) {
      const prevTotal = userGrowth[i - 1].users + postGrowth[i - 1].posts;
      const currTotal = userGrowth[i].users + postGrowth[i].posts;
      if (prevTotal > 0) {
        rates.push(((currTotal - prevTotal) / prevTotal) * 100);
      } else if (currTotal > 0) {
        rates.push(100);
      } else {
        rates.push(0);
      }
    }
    avgPopularityGrowthRate = rates.reduce((a, b) => a + b, 0) / rates.length;
  }

  res.json({
    totalUsers,
    totalPosts,
    totalConnections,
    totalComments,
    totalLikes,
    totalReports,
    recentUsers,
    recentPosts,
    userGrowth,
    postGrowth,
    avgPopularityGrowthRate
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
  const { postId, postTitle, authorId, authorUsername, page = 1, limit = 20, sort = "createdAt", order = "desc" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  let where: any = { commentId: null };
  if (postId) where.postId = Number(postId);

  // Only use authorId for DB filtering, do not filter by postTitle/authorUsername in DB (for case-insensitive workaround)
  if (authorId) {
    where.AND = [{ post: { user: { id: Number(authorId) } } }];
  }

  let orderBy: any;
  const safeOrder = order === "asc" ? "asc" : "desc";
  if (sort === 'postTitle' || sort === 'authorUsername') {
    orderBy = { createdAt: safeOrder };
  } else {
    orderBy = { [sort as string]: safeOrder };
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
      // fetch more than needed for in-memory filtering
      skip: 0,
      take: 1000,
      orderBy
    }),
    prisma.report.count({ where })
  ]);

  let processedReports = reports.map(report => ({
    ...report,
    postTitle: report.post.title,
    authorUsername: report.post.user.username
  }));

  // Ensure query params are strings for in-memory filtering
  const postTitleStr = typeof postTitle === 'string' ? postTitle : Array.isArray(postTitle) ? String(postTitle[0]) : '';
  const authorUsernameStr = typeof authorUsername === 'string' ? authorUsername : Array.isArray(authorUsername) ? String(authorUsername[0]) : '';

  // In-memory case-insensitive filtering
  if (postTitleStr) {
    processedReports = processedReports.filter(r => String(r.postTitle || '').toLowerCase().includes(postTitleStr.toLowerCase()));
  }
  if (authorUsernameStr) {
    processedReports = processedReports.filter(r => String(r.authorUsername || '').toLowerCase().includes(authorUsernameStr.toLowerCase()));
  }

  // In-memory sort for nested fields
  if (sort === "postTitle") {
    processedReports.sort((a, b) => {
      const aValue = a.postTitle?.toLowerCase() || '';
      const bValue = b.postTitle?.toLowerCase() || '';
      return safeOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  } else if (sort === "authorUsername") {
    processedReports.sort((a, b) => {
      const aValue = a.authorUsername?.toLowerCase() || '';
      const bValue = b.authorUsername?.toLowerCase() || '';
      return safeOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }

  const pagedReports = processedReports.slice(skip, skip + Number(limit));

  res.json({
    reports: pagedReports,
    total: processedReports.length,
    pages: Math.ceil(processedReports.length / Number(limit))
  });
});

export const getAdminComments = asyncHandler(async (req, res) => {
  const { search = '', status, page = 1, pageSize = 20, sort = "createdAt", order = "desc" } = req.query;
  const skip = (Number(page) - 1) * Number(pageSize);

  // Remove mode: 'insensitive' for SQLite compatibility, do in-memory filtering for nested fields
  let where: any = {
    ...(status !== ContentStatus.ALL ? { status: status as ContentStatus } : {}),
    ...(search
      ? {
          OR: [
            { text: { contains: search as string } },
          ],
        }
      : {}),
  };

  let orderBy: any;
  orderBy = { [sort as string]: order as "asc" | "desc" };

  // Fetch with possible overfetch for in-memory filtering
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
      skip: 0,
      take: 1000,
      orderBy,
    }),
    prisma.comment.count({ where }),
  ]);

  // In-memory filtering for user.username and post.title
  let processedComments = comments.filter(comment => {
    if (!search) return true;
    const searchLower = (search as string).toLowerCase();
    const userMatch = comment.user?.username?.toLowerCase().includes(searchLower);
    const postMatch = comment.post?.title?.toLowerCase().includes(searchLower);
    return (
      (comment.text && comment.text.toLowerCase().includes(searchLower)) ||
      userMatch ||
      postMatch
    );
  });

  // Pagination after filtering
  const pagedComments = processedComments.slice(skip, skip + Number(pageSize));

  res.json({ comments: pagedComments, total: processedComments.length });
});

export const updateCommentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const comment = await prisma.comment.update({
    where: { id: Number(id) },
    data: { status },
  });

  await NotificationService.notifyCommentStatusChange(comment.id, status, reason);

  res.json(comment);
});

export const getAllCommentReports = asyncHandler(async (req, res) => {
  const { commentId, commentContent, authorId, authorUsername, page = 1, limit = 20, sort = "createdAt", order = "desc" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  let where: any = { commentId: { not: null } };
  if (commentId) where.commentId = Number(commentId);
  if (authorId) {
    where.AND = [{ comment: { user: { id: Number(authorId) } } }];
  }

  let orderBy: any;
  const safeOrder = order === "asc" ? "asc" : "desc";
  if (sort === 'commentContent' || sort === 'authorUsername') {
    orderBy = { createdAt: safeOrder };
  } else {
    orderBy = { [sort as string]: safeOrder };
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
      skip: 0,
      take: 1000,
      orderBy
    }),
    prisma.report.count({ where })
  ]);

  let processedReports = reports.map(report => ({
    ...report,
    commentContent: report.comment?.text || '',
    authorUsername: report.comment?.user.username || ''
  }));

  // Ensure query params are strings for in-memory filtering
  const commentContentStr = typeof commentContent === 'string' ? commentContent : Array.isArray(commentContent) ? String(commentContent[0]) : '';
  const authorUsernameStr2 = typeof authorUsername === 'string' ? authorUsername : Array.isArray(authorUsername) ? String(authorUsername[0]) : '';

  // In-memory case-insensitive filtering
  if (commentContentStr) {
    processedReports = processedReports.filter(r => String(r.commentContent || '').toLowerCase().includes(commentContentStr.toLowerCase()));
  }
  if (authorUsernameStr2) {
    processedReports = processedReports.filter(r => String(r.authorUsername || '').toLowerCase().includes(authorUsernameStr2.toLowerCase()));
  }

  if (sort === "commentContent") {
    processedReports.sort((a, b) => {
      const aValue = a.commentContent?.toLowerCase() || '';
      const bValue = b.commentContent?.toLowerCase() || '';
      return safeOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  } else if (sort === "authorUsername") {
    processedReports.sort((a, b) => {
      const aValue = a.authorUsername?.toLowerCase() || '';
      const bValue = b.authorUsername?.toLowerCase() || '';
      return safeOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }

  // Pagination after filtering
  const pagedReports = processedReports.slice(skip, skip + Number(limit));

  res.json({
    reports: pagedReports,
    total: processedReports.length,
    pages: Math.ceil(processedReports.length / Number(limit))
  });
});
