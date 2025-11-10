import type { ContentStatus } from './enums/content-status.enum';
import type { Role } from './enums/role.enum';

export type UserStats = {
  id: string;
  username: string;
  fullName: string;
  profileImage: string;
  email: string;
  createdAt: Date;
};

export type PostStats = {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    username: string;
    fullName: string;
    profileImage: string;
  };
};

export type DashboardStatsData = {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalConnections: number;
  totalReports: number;
  recentUsers: UserStats[];
  recentPosts: PostStats[];
  userGrowth: GrouthStat[];
  avgPopularityGrowthRate: number;
};

export type GrouthStat = {
  name: string;
  count: number;
};

export type UsersSortField = 'id' | 'username' | 'fullName' | 'email' | 'role';
export type PostsSortField =
  | 'id'
  | 'title'
  | 'status'
  | 'createdAt'
  | 'updatedAt';
export type CommentSortField =
  | 'id'
  | 'text'
  | 'status'
  | 'createdAt'
  | 'postId';
export type PostReportsSortField =
  | 'id'
  | 'postTitle'
  | 'authorUsername'
  | 'reporter'
  | 'reason'
  | 'createdAt';
export type CommentReportsSortField =
  | 'id'
  | 'commentContent'
  | 'authorUsername'
  | 'reporter'
  | 'reason'
  | 'createdAt';

export type OrderBy = 'asc' | 'desc';

export type PaginationCriteria<T> = {
  page: number;
  size: number;
  sort: T;
  order: OrderBy;
};

export type UsersPaginatedRequest = PaginationCriteria<UsersSortField> & {
  search: string;
};

export type PostsPaginatedRequest = PaginationCriteria<PostsSortField> & {
  search: string;
  status: ContentStatus;
};

export type PostReportsPaginatedRequest =
  PaginationCriteria<PostReportsSortField> & {
    postId: string;
    postTitle: string;
    postAuthor: string;
    reporter: string;
  };

export type CommentsPaginatedRequest = PaginationCriteria<CommentSortField> & {
  commentText: string;
  postTitle: string;
  authorUsername: string;
  status: ContentStatus;
};

export type CommentReportsPaginatedRequest =
  PaginationCriteria<CommentReportsSortField> & {
    commentId: string;
    commentText: string;
    commentAuthor: string;
    reporter: string;
  };

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: Date;
  posts: number;
  connections: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  pages: number;
}

export interface AdminPost {
  id: string;
  title: string;
  content: string;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
  userUsername: string;
  userProfileImage: string;
  comments: number;
  likes: number;
}

export interface AdminPostsResponse {
  posts: AdminPost[];
  total: number;
  pages: number;
}

export interface PostReport {
  id: string;
  reason: string;
  createdAt: Date;
  userUsername: string;
  postTitle: string;
  postAuthor: string;
}

export interface PostReportsResponse {
  reports: PostReport[];
  total: number;
  pages: number;
}

export interface AdminComment {
  id: string;
  text: string;
  createdAt: Date;
  status: ContentStatus;
  userUsername: string;
  userProfileImage: string;
  postId: string;
}

export interface AdminCommentsResponse {
  comments: AdminComment[];
  total: number;
}

export interface CommentReport {
  id: string;
  reason: string;
  createdAt: Date;
  commentText: string;
  commentAuthor: string;
  reporter: string;
}

export interface CommentReportsResponse {
  reports: CommentReport[];
  total: number;
  pages: number;
}
