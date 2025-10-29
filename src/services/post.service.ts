import type { Post } from "../models/post.model";
import { prisma } from "../server";

export class PostService {
  static async getUserPosts(userId: string): Promise<Post[]> {
    return await prisma.post.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      select: this.getPostsQuerySelect(userId),
      orderBy: { createdAt: 'desc' },
    });
  }

  private static getPostsQuerySelect(userId: string) {
    return {
      id: true,
      title: true,
      image: true,
      content: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          id: true,
          profileImage: true,
          username: true,
          fullName: true
        }
      },
      comments: {
        where: { status: { not: 'ARCHIVED' } },
        select: {
          id: true,
          text: true,
          author: true,
          updatedAt: true,
          isEdited: true,
          postId: true,
          userId: true
        },
        orderBy: { createdAt: 'desc' as const },
        take: 3,
      },
      likes: {
        select: {
          id: true,
          userId: true,
          postId: true,
        },
      },
    };
  }
}