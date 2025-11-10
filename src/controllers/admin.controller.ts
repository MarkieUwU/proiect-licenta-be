import asyncHandler from 'express-async-handler';
import { prisma } from '../server';
import { ApiError } from '../error/ApiError';
import { NotificationService } from '../services/notification.service';
import { Role } from '../models/enums/role.enum';
import { ContentStatus } from '../models/enums/content-status.enum';
import { AdminService } from '../services/admin.service';
import type {
  CommentsPaginatedRequest,
  OrderBy,
  PostReportsPaginatedRequest,
  PostReportsSortField,
  PostsPaginatedRequest,
  PostsSortField,
  UsersPaginatedRequest,
  UsersSortField,
  CommentSortField,
  CommentReportsPaginatedRequest,
  CommentReportsSortField,
} from '../models/admin.model';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const dashboardStatsData = await AdminService.getDashboardStats();
  res.json(dashboardStatsData);
});

export const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    size = 10,
    search,
    sort = 'createdAt',
    order = 'desc',
  } = req.query;
  const filters: UsersPaginatedRequest = {
    page: +page,
    size: +size,
    search: search as string,
    sort: sort as UsersSortField,
    order: order as OrderBy,
  };

  const adminUserResponse = await AdminService.getUsers(filters);

  res.json(adminUserResponse);
});

export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!Object.values(Role).includes(role)) {
    return next(ApiError.badRequest('Invalid role'));
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  res.json(user);
});

export const getAdminPosts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    size = 10,
    search = '',
    status = ContentStatus.ALL,
    sort = 'createdAt',
    order = 'desc',
  } = req.query;
  const request: PostsPaginatedRequest = {
    page: +page,
    size: +size,
    search: search as string,
    status: status as ContentStatus,
    sort: sort as PostsSortField,
    order: order as OrderBy,
  };

  const adminPostsResponse = await AdminService.getAdminPosts(request);

  res.json(adminPostsResponse);
});

export const updatePostStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const post = await prisma.post.update({
    where: { id },
    data: {
      status,
      ...(status === ContentStatus.ARCHIVED && {
        updatedAt: new Date(),
      }),
    },
  });

  await NotificationService.notifyPostStatusChange(post.id, status, reason);

  res.json(post);
});

export const getAllPostReports = asyncHandler(async (req, res) => {
  const {
    postId,
    postTitle,
    postAuthor,
    reporter,
    page = 1,
    size = 10,
    sort = 'createdAt',
    order = 'desc',
  } = req.query;
  
  const request: PostReportsPaginatedRequest = {
    page: +page,
    size: +size,
    sort: sort as PostReportsSortField,
    order: order as OrderBy,
    postId: postId as string,
    postTitle: postTitle as string,
    postAuthor: postAuthor as string,
    reporter: reporter as string
  };

  const reportsResponse = await AdminService.getPostReports(request);

  res.json(reportsResponse);
});

export const getAdminComments = asyncHandler(async (req, res) => {
  const {
    commentText = '',
    postTitle = '',
    authorUsername = '',
    status,
    page = 1,
    size = 10,
    sort = 'createdAt',
    order = 'desc',
  } = req.query;
  
  const request: CommentsPaginatedRequest = {
    page: +page,
    size: +size,
    sort: sort as CommentSortField,
    order: order as OrderBy,
    commentText: commentText as string,
    postTitle: postTitle as string,
    authorUsername: authorUsername as string,
    status: status as ContentStatus
  }

  const adminCommentsResponse = await AdminService.getAdminComments(request);

  res.json(adminCommentsResponse);
});

export const updateCommentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const comment = await prisma.comment.update({
    where: { id },
    data: { status },
  });

  await NotificationService.notifyCommentStatusChange(
    comment.id,
    status,
    reason
  );

  res.json(comment);
});

export const getAllCommentReports = asyncHandler(async (req, res) => {
  const {
    commentId,
    commentText,
    commentAuthor,
    reporter,
    page = 1,
    size = 10,
    sort = 'createdAt',
    order = 'desc',
  } = req.query;

  const request: CommentReportsPaginatedRequest = {
    page: +page,
    size: +size,
    sort: sort as CommentReportsSortField,
    order: order as OrderBy,
    commentId: commentId as string,
    commentText: commentText as string,
    commentAuthor: commentAuthor as string,
    reporter: reporter as string,
  };

  const commentReportsResponse = await AdminService.getCommentReports(request);

  res.json(commentReportsResponse);
});
