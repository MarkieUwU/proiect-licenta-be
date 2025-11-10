import type {
  AdminComment,
  AdminCommentsResponse,
  AdminPostsResponse,
  AdminUser,
  AdminUsersResponse,
  CommentReport,
  CommentReportsPaginatedRequest,
  CommentReportsResponse,
  CommentsPaginatedRequest,
  DashboardStatsData,
  GrouthStat,
  PostReportsPaginatedRequest,
  PostReportsResponse,
  PostsPaginatedRequest,
  PostStats,
  UsersPaginatedRequest,
  UserStats,
} from '../models/admin.model';
import { ContentStatus } from '../models/enums/content-status.enum';
import type { Role } from '../models/enums/role.enum';
import { prisma } from '../server';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export class AdminService {
  static async getDashboardStats(): Promise<DashboardStatsData> {
    const [
      totalUsers,
      totalPosts,
      totalConnections,
      totalLikes,
      totalComments,
      totalReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.connection.count(),
      prisma.like.count(),
      prisma.comment.count(),
      prisma.report.count(),
    ]);
    const { recentUsers, recentPosts } = await this.getRecentUsersAndPosts();
    const userGrowth = await this.getUserAndPostGrowth();
    const avgPopularityGrowthRate = this.getAvgPopularityGrowthRate(userGrowth);

    return {
      totalUsers,
      totalPosts,
      totalConnections,
      totalComments,
      totalLikes,
      totalReports,
      recentUsers,
      recentPosts,
      userGrowth,
      avgPopularityGrowthRate,
    };
  }

  private static async getRecentUsersAndPosts(): Promise<{
    recentUsers: UserStats[];
    recentPosts: PostStats[];
  }> {
    const [recentUsers, recentPosts] = await Promise.all([
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          profileImage: true,
          username: true,
          fullName: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              profileImage: true,
              username: true,
              fullName: true,
            },
          },
        },
      }),
    ]);

    return { recentUsers, recentPosts };
  }

  private static async getUserAndPostGrowth(): Promise<GrouthStat[]> {
    const now = new Date();
    const userGrowth: GrouthStat[] = [];
    for (let i = 5; i >= 1; i--) {
      const monthStart = startOfMonth(subMonths(now, i - 1));
      const monthEnd = endOfMonth(subMonths(now, i - 1));
      const userCount = await prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });
      userGrowth.push({
        name: format(monthStart, 'MMM').toUpperCase(),
        count: userCount,
      });
    }

    return userGrowth;
  }

  private static getAvgPopularityGrowthRate(userGrowth: GrouthStat[]): number {
    let avgPopularityGrowthRate = 0;
    if (userGrowth.length >= 4) {
      let rates = [];
      for (let i = userGrowth.length - 3; i < userGrowth.length; i++) {
        const prevTotal = userGrowth[i - 1].count;
        const currTotal = userGrowth[i].count;
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
    return avgPopularityGrowthRate;
  }

  static async getUsers(
    request: UsersPaginatedRequest
  ): Promise<AdminUsersResponse> {
    const skip = (request.page - 1) * request.size;
    const orderBy = {
      [request.sort as string]: request.order as 'asc' | 'desc',
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: this.getUsersWhere(request.search),
        skip,
        take: Number(request.size),
        orderBy,
        select: this.getUsersSelect(),
      }),
      prisma.user.count({ where: this.getUsersWhere(request.search) }),
    ]);

    const usersResponse = users.map(
      (user): AdminUser => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role as Role,
        createdAt: user.createdAt,
        posts: user._count.posts,
        connections: user._count.follower + user._count.following,
      })
    );

    return {
      users: usersResponse,
      total,
      pages: Math.ceil(total / Number(request.size)),
    };
  }

  private static getUsersWhere(search: String) {
    const where = search
      ? {
          OR: [
            {
              username: {
                contains: search as string,
                mode: 'insensitive' as const,
              },
            },
            {
              fullName: {
                contains: search as string,
                mode: 'insensitive' as const,
              },
            },
            {
              email: {
                contains: search as string,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};
    return where;
  }

  private static getUsersSelect() {
    return {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          posts: { where: { status: { not: 'ARCHIVED' } } },
          follower: true,
          following: true,
        },
      },
    };
  }

  static async getAdminPosts(
    request: PostsPaginatedRequest
  ): Promise<AdminPostsResponse> {
    const skip = (request.page - 1) * request.size;
    const where = this.getAdminPostsWhere(request.search, request.status);
    const orderBy = {
      [request.sort as string]: request.order as 'asc' | 'desc',
    };

    const [posts, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        select: this.getAdminPostsSelect(),
        skip,
        take: request.size,
        orderBy,
      }),
      prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status as ContentStatus,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        userUsername: post.user.username,
        userProfileImage: post.user.profileImage,
        likes: post._count.likes,
        comments: post._count.comments,
      })),
      total,
      pages: Math.ceil(total / Number(request.size)),
    };
  }

  private static getAdminPostsWhere(search: string, status: ContentStatus) {
    return {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              {
                content: {
                  contains: search as string,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(status !== ContentStatus.ALL
        ? { status: status as ContentStatus }
        : {}),
    };
  }

  private static getAdminPostsSelect() {
    return {
      id: true,
      title: true,
      content: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          profileImage: true,
          username: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: { where: { status: { not: 'ARCHIVED' } } },
        },
      },
    };
  }

  static async getPostReports(
    request: PostReportsPaginatedRequest
  ): Promise<PostReportsResponse> {
    const skip = (request.page - 1) * request.size;

    let orderBy: any;
    if (request.sort === 'postTitle' || request.sort === 'authorUsername') {
      orderBy = { createdAt: request.order };
    } else {
      orderBy = { [request.sort as string]: request.order };
    }

    const [reports, total] = await prisma.$transaction([
      prisma.report.findMany({
        where: this.getPostReportsWhere(request),
        select: this.getPostReportsSelect(),
        skip,
        take: request.size,
        orderBy,
      }),
      prisma.report.count({ where: this.getPostReportsWhere(request) }),
    ]);

    console.log(reports);

    const reportsResult = reports.map((report) => ({
      ...report,
      userUsername: report.user.username,
      postTitle: report.post!.title,
      postAuthor: report.post!.user.username,
    }));

    return {
      reports: reportsResult,
      total,
      pages: Math.ceil(reports.length / request.size),
    };
  }

  private static getPostReportsWhere(request: PostReportsPaginatedRequest) {
    return {
      postId: { not: null },
      ...(request.postTitle && {
        post: {
          title: { contains: request.postTitle, mode: 'insensitive' as const },
        },
      }),
      ...(request.postAuthor && {
        post: {
          user: {
            username: {
              contains: request.postAuthor,
              mode: 'insensitive' as const,
            },
          },
        },
      }),
      ...(request.reporter && {
        user: {
          username: {
            contains: request.reporter,
            mode: 'insensitive' as const,
          },
        },
      }),
    };
  }

  private static getPostReportsSelect() {
    return {
      id: true,
      reason: true,
      createdAt: true,
      user: {
        select: {
          username: true,
        },
      },
      postId: true,
      post: {
        select: {
          title: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    };
  }

  static async getAdminComments(
    request: CommentsPaginatedRequest
  ): Promise<AdminCommentsResponse> {
    const skip = (request.page - 1) * request.size;
    const orderBy = { [request.sort]: request.order };

    const [comments, total] = await prisma.$transaction([
      prisma.comment.findMany({
        where: this.getAdminCommentsWhere(request),
        select: this.getAdminCommentsSelect(),
        skip,
        take: request.size,
        orderBy,
      }),
      prisma.comment.count({ where: this.getAdminCommentsWhere(request) }),
    ]);

    return {
      comments: comments.map(
        (com): AdminComment => ({
          id: com.id,
          text: com.text,
          createdAt: com.createdAt,
          status: com.status as ContentStatus,
          userUsername: com.user.username,
          userProfileImage: com.user.profileImage,
          postId: com.post.id,
        })
      ),
      total,
    };
  }

  private static getAdminCommentsWhere(request: CommentsPaginatedRequest) {
    return {
      ...(request.status !== ContentStatus.ALL && { status: request.status }),
      text: { contains: request.commentText, mode: 'insensitive' as const },
      post: {
        title: { contains: request.postTitle, mode: 'insensitive' as const },
      },
      user: {
        username: {
          contains: request.authorUsername,
          mode: 'insensitive' as const,
        },
      },
    };
  }

  private static getAdminCommentsSelect() {
    return {
      id: true,
      text: true,
      createdAt: true,
      status: true,
      user: {
        select: {
          username: true,
          profileImage: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
        },
      },
    };
  }

  static async getCommentReports(
    request: CommentReportsPaginatedRequest
  ): Promise<CommentReportsResponse> {
    const skip = (request.page - 1) * request.size;
    let orderBy: any;
    if (
      request.sort === 'commentContent' ||
      request.sort === 'authorUsername'
    ) {
      orderBy = { createdAt: request.order };
    } else {
      orderBy = { [request.sort]: request.order };
    }

    const [reports, total] = await prisma.$transaction([
      prisma.report.findMany({
        where: this.getCommentReportsWhere(request),
        select: this.getCommentReportsSelect(),
        skip,
        take: request.size,
        orderBy,
      }),
      prisma.report.count({ where: this.getCommentReportsWhere(request) }),
    ]);

    return {
      reports: reports.map(
        (rep): CommentReport => ({
          id: rep.id,
          reason: rep.reason,
          createdAt: rep.createdAt,
          commentText: rep.comment!.text,
          commentAuthor: rep.comment!.user.username,
          reporter: rep.user.username,
        })
      ),
      total,
      pages: Math.ceil(reports.length / request.size),
    };
  }

  private static getCommentReportsWhere(
    request: CommentReportsPaginatedRequest
  ) {
    return {
      ...(request.commentId
        ? { commentId: request.commentId }
        : { commentId: { not: null } }),
      ...(request.commentText && {
        comment: {
          text: {
            contains: request.commentText,
            mode: 'insensitive' as const,
          },
        },
      }),
      ...(request.commentAuthor && {
        comment: {
          user: {
            username: {
              contains: request.commentAuthor,
              mode: 'insensitive' as const,
            },
          },
        },
      }),
      ...(request.reporter && {
        user: {
          username: {
            contains: request.reporter,
            mode: 'insensitive' as const,
          },
        },
      }),
    };
  }

  private static getCommentReportsSelect() {
    return {
      id: true,
      reason: true,
      createdAt: true,
      user: {
        select: {
          username: true,
        },
      },
      comment: {
        select: {
          text: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    };
  }
}
