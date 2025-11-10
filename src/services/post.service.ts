import { PrivacyOptions } from '../models/enums/privacy-optinos.enum';
import type { Post } from '../models/post.model';
import { prisma } from '../server';
import { ConnectionService } from './connection.service';

export class PostService {
  static async getPosts(userId?: string): Promise<Post[]> {
    return await prisma.post.findMany({
      where: { ...(userId ? { userId } : {}), status: { not: 'ARCHIVED' } },
      select: this.getPostsQuerySelect(),
      orderBy: { createdAt: 'desc' },
    });
  }

  private static getPostsQuerySelect() {
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
          fullName: true,
          settings: {
            select: {
              postsPrivacy: true,
            },
          },
        },
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
          userId: true,
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

  static async filterPostsByPrivacyOptions(
    userId: string,
    posts: Post[]
  ): Promise<Post[]> {
    const connections = (await ConnectionService.getConnections(userId)).map(
      (con) => con.user.id
    );

    return posts.filter((post) => {
      if (post.user.id === userId) return true;
      const privacy = post.user.settings?.postsPrivacy;

      switch (privacy) {
        case PrivacyOptions.public:
          return true;
        case PrivacyOptions.private:
          return false;
        case PrivacyOptions.followers:
          return connections.includes(userId);
      }
    });
  }
}
