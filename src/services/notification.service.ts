import { prisma } from "../server";
import { NotificationType } from "../models/enums/notification-type.enum";
import { ContentStatus } from "../models/enums/content-status.enum";

export class NotificationService {
  static async createNotification({
    userId,
    type,
    message,
    data,
  }: {
    userId: string;
    type: NotificationType;
    message: string;
    data?: Record<string, any>;
  }) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    });
  }

  static async notifyPostReported(postId: string, reportId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) return;

    await this.createNotification({
      userId: post.userId,
      type: NotificationType.POST_REPORTED,
      message: "Your post has been reported and is under review",
      data: { 
        postId,
        reportId,
        postTitle: post.title 
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    await Promise.all(
      admins.map((admin) =>
        this.createNotification({
          userId: admin.id,
          type: NotificationType.POST_REPORTED,
          message: `New post report: "${post.title}"`,
          data: { 
            postId,
            reportId,
            postTitle: post.title,
            authorId: post.userId,
            authorName: post.user.fullName
          },
        })
      )
    );
  }

  static async notifyCommentReported(commentId: string, reportId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        text: true,
        userId: true
      }
    });

    if (!comment) return;

    await this.createNotification({
      userId: comment.userId,
      type: NotificationType.COMMENT_REPORTED,
      message: "Your comment has been reported and is under review",
      data: { 
        commentId,
        reportId,
        commentText: comment.text.substring(0, 100) + (comment.text.length > 100 ? "..." : ""),
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    await Promise.all(
      admins.map((admin) =>
        this.createNotification({
          userId: admin.id,
          type: NotificationType.COMMENT_REPORTED,
          message: 'New comment report',
          data: {
            commentId,
            reportId,
            commentText:
              comment.text.substring(0, 100) +
              (comment.text.length > 100 ? '...' : ''),
          },
        })
      )
    );
  }

  static async notifyPostStatusChange(postId: string, newStatus: ContentStatus, reason?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) return;

    let message = "";
    let notificationType: NotificationType;
    
    switch (newStatus) {
      case ContentStatus.ARCHIVED:
        message = `Your post "${post.title}" has been archived. Reason: ${reason}`;
        notificationType = NotificationType.POST_ARCHIVED;
        break;
      case ContentStatus.ACTIVE:
        message = `Your post "${post.title}" has been approved and is now visible`;
        notificationType = NotificationType.POST_APPROVED;
        break;
      case ContentStatus.REPORTED:
        message = `Your post "${post.title}" has been reported and is under review`;
        notificationType = NotificationType.POST_REPORTED;
        break;
      default:
        return;
    }

    await this.createNotification({
      userId: post.userId,
      type: notificationType,
      message,
      data: { 
        postId,
        postTitle: post.title,
        reason 
      },
    });
  }

  static async notifyCommentStatusChange(commentId: string, newStatus: ContentStatus, reason?: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { 
        user: true,
        post: {
          select: {
            id: true,
            title: true
          }
        }
      },
    });

    if (!comment) return;

    let message = "";
    let notificationType: NotificationType;
    
    switch (newStatus) {
      case ContentStatus.ARCHIVED:
        message = `Your comment on "${comment.post.title}" has been archived. Reason: ${reason}`;
        notificationType = NotificationType.COMMENT_ARCHIVED;
        break;
      case ContentStatus.ACTIVE:
        message = `Your comment on "${comment.post.title}" has been approved and is now visible`;
        notificationType = NotificationType.COMMENT_APPROVED;
        break;
      case ContentStatus.REPORTED:
        message = `Your comment on "${comment.post.title}" has been reported and is under review`;
        notificationType = NotificationType.COMMENT_REPORTED;
        break;
      default:
        return;
    }

    await this.createNotification({
      userId: comment.userId,
      type: notificationType,
      message,
      data: { 
        commentId,
        postId: comment.postId,
        postTitle: comment.post.title,
        reason 
      },
    });
  }

  static async notifyPostLiked(postId: string, likerId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post || post.userId === likerId) return;

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
    });

    await this.createNotification({
      userId: post.userId,
      type: NotificationType.POST_LIKED,
      message: `${liker?.fullName} liked your post "${post.title}"`,
      data: { 
        postId,
        postTitle: post.title,
        likerId,
        likerName: liker?.fullName
      },
    });
  }

  static async notifyNewComment(postId: string, commentId: string, commenterId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) return;

    const commenter = await prisma.user.findUnique({
      where: { id: commenterId },
    });

    if (post.userId !== commenterId) {
      await this.createNotification({
        userId: post.userId,
        type: NotificationType.POST_COMMENTED,
        message: `${commenter?.fullName} commented on your post "${post.title}"`,
        data: { 
          postId,
          postTitle: post.title,
          commentId,
          commenterId,
          commenterName: commenter?.fullName
        },
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (comment) {
      const mentions = this.extractMentions(comment.text);
      if (mentions.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
          where: {
            username: { in: mentions },
          },
        });

        await Promise.all(
          mentionedUsers.map((user) =>
            this.createNotification({
              userId: user.id,
              type: NotificationType.MENTIONED,
              message: `${commenter?.fullName} mentioned you in a comment`,
              data: { 
                postId,
                postTitle: post.title,
                commentId,
                commenterId,
                commenterName: commenter?.fullName
              },
            })
          )
        );
      }
    }
  }

  private static extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(match => match.substring(1)) : [];
  }

  static async notifySystemAnnouncement(message: string, userIds?: string[]) {
    const users = userIds 
      ? await prisma.user.findMany({ where: { id: { in: userIds } } })
      : await prisma.user.findMany();

    await Promise.all(
      users.map((user) =>
        this.createNotification({
          userId: user.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          message,
          data: { announcement: true },
        })
      )
    );
  }

  static async notifyAccountWarning(userId: string, reason: string) {
    await this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_WARNING,
      message: `Account Warning: ${reason}`,
      data: { warning: true, reason },
    });
  }
} 